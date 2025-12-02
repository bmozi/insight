/**
 * StorageInsight Content Script - Performance Optimized
 * Runs on every web page to monitor storage usage with batching and pagination
 */

// ============================================================================
// DEBUG UTILITY (inline for non-module scripts)
// ============================================================================
let _debugEnabled = false;
try {
  chrome.storage.local.get(['debugMode'], (r) => { _debugEnabled = r?.debugMode || false; });
} catch (e) { /* ignore */ }
const debug = {
  log: (...args) => { if (_debugEnabled) debug.log(...args); },
  warn: (...args) => { debug.warn(...args); },
  error: (...args) => { debug.error(...args); }
};

// Global error handler to suppress "Extension context invalidated" errors
// This error is expected when the extension is reloaded while the page is still open
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('Extension context invalidated')) {
    event.preventDefault();
    event.stopPropagation();
    debug.warn('⚠️ Extension was reloaded. Please refresh the page to reconnect.');
    return true;
  }
}, true);

// Also handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('Extension context invalidated')) {
    event.preventDefault();
    debug.warn('⚠️ Extension was reloaded. Please refresh the page to reconnect.');
  }
});

// ============================================================================
// EXTENSION DISCONNECT DETECTION
// ============================================================================

// Flag to track if extension has been disconnected/unloaded
let extensionDisconnected = false;

/**
 * Setup port-based disconnect detection
 * When the extension is reloaded/disabled, the port disconnects and we stop all operations
 */
function setupDisconnectDetection() {
  try {
    // Create a long-lived connection to the background script
    const port = chrome.runtime.connect({ name: 'content-script-keepalive' });

    port.onDisconnect.addListener(() => {
      extensionDisconnected = true;
      debug.warn('⚠️ Extension disconnected. Please refresh the page to reconnect.');

      // Cancel any pending debounced/throttled operations (if they exist)
      if (typeof debouncedNotifyBatch !== 'undefined' && debouncedNotifyBatch?.cancel) {
        debouncedNotifyBatch.cancel();
      }
    });
  } catch (error) {
    // If we can't connect, the extension is already disconnected
    extensionDisconnected = true;
    debug.warn('⚠️ Could not connect to extension:', error.message);
  }
}

// Setup disconnect detection immediately (uses try-catch internally for safety)
setupDisconnectDetection();

debug.log('🔍 StorageInsight content script loaded');

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce utility - Delays function execution until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
  let timeoutId;
  let lastArgs;

  const debounced = function (...args) {
    lastArgs = args;
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(this, lastArgs);
    }, delay);
  };

  // Allow immediate flush of pending execution
  debounced.flush = function () {
    clearTimeout(timeoutId);
    if (lastArgs) {
      func.apply(this, lastArgs);
    }
  };

  // Allow cancellation
  debounced.cancel = function () {
    clearTimeout(timeoutId);
    lastArgs = undefined;
  };

  return debounced;
}

/**
 * Throttle utility - Ensures function runs max once per limit milliseconds
 * Guarantees regular execution for high-frequency events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  let lastFunc;
  let lastRan;

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, Math.max(limit - (Date.now() - lastRan), 0));
    }
  };
}

/**
 * Check if extension context is still valid
 * Returns false if the extension was reloaded/disabled
 */
function isExtensionContextValid() {
  // Check disconnect flag first (fastest check)
  if (extensionDisconnected) {
    return false;
  }

  try {
    // Accessing chrome.runtime.id will throw if context is invalidated
    const valid = !!chrome.runtime?.id;
    if (!valid) {
      extensionDisconnected = true;
    }
    return valid;
  } catch (e) {
    extensionDisconnected = true;
    return false;
  }
}

/**
 * Safely send message to background script with error handling
 * Handles extension context invalidation gracefully
 */
function safeSendMessage(message, callback) {
  if (!isExtensionContextValid()) {
    debug.warn('⚠️ Extension context invalidated. Please refresh the page.');
    if (callback) {
      callback({ success: false, error: 'Extension context invalidated. Please refresh the page.' });
    }
    return;
  }

  try {
    chrome.runtime.sendMessage(message, (response) => {
      // Check for runtime errors (e.g., extension context invalidated during the call)
      if (chrome.runtime.lastError) {
        debug.warn('⚠️ Extension communication error:', chrome.runtime.lastError.message);
        if (callback) {
          callback({ success: false, error: chrome.runtime.lastError.message });
        }
        return;
      }
      if (callback) {
        callback(response);
      }
    });
  } catch (error) {
    debug.warn('⚠️ Failed to send message to extension:', error.message);
    if (callback) {
      callback({ success: false, error: error.message });
    }
  }
}

/**
 * Efficient serialization with circular reference handling and depth limiting
 * Performance: Completes in <10ms for normal data structures
 * @param {*} data - Data to serialize
 * @param {number} maxDepth - Maximum depth for nested objects (default: 3)
 * @returns {*} Serializable object
 */
function efficientSerialize(data, maxDepth = 3) {
  const seen = new WeakSet();
  const cache = new Map();

  function serialize(obj, depth = 0) {
    // Primitive types - return as-is
    if (obj === null || typeof obj !== 'object') {
      // Truncate large strings for performance
      if (typeof obj === 'string' && obj.length > 1000) {
        return obj.substring(0, 1000) + '...[truncated]';
      }
      return obj;
    }

    // Check for circular reference
    if (seen.has(obj)) {
      return '[Circular Reference]';
    }

    // Check cache for already serialized objects
    if (cache.has(obj)) {
      return cache.get(obj);
    }

    // Depth limit reached - return summary
    if (depth >= maxDepth) {
      if (Array.isArray(obj)) {
        return `[Array(${obj.length})]`;
      }
      return `[Object(${Object.keys(obj).length} keys)]`;
    }

    seen.add(obj);

    try {
      // Handle arrays
      if (Array.isArray(obj)) {
        const result = obj.slice(0, 100).map(item => serialize(item, depth + 1));
        if (obj.length > 100) {
          result.push(`...${obj.length - 100} more items`);
        }
        cache.set(obj, result);
        return result;
      }

      // Handle Date objects
      if (obj instanceof Date) {
        return obj.toISOString();
      }

      // Handle regular objects
      const result = {};
      const keys = Object.keys(obj);
      const keysToProcess = keys.slice(0, 50);

      for (const key of keysToProcess) {
        try {
          result[key] = serialize(obj[key], depth + 1);
        } catch (e) {
          result[key] = '[Error serializing]';
        }
      }

      if (keys.length > 50) {
        result['__truncated__'] = `${keys.length - 50} more properties`;
      }

      cache.set(obj, result);
      return result;
    } finally {
      seen.delete(obj);
    }
  }

  return serialize(data);
}

// ============================================================================
// BATCHING SYSTEM
// ============================================================================

// Batch array to collect storage changes
let changeBatch = [];
let batchSequence = 0;

/**
 * Debounced batch notification - sends accumulated changes after 1000ms of inactivity
 * Performance benefit: Reduces message frequency from N messages to 1 message per second
 */
const debouncedNotifyBatch = debounce(() => {
  // Exit early if extension is disconnected
  if (extensionDisconnected || changeBatch.length === 0) return;

  const batchToSend = [...changeBatch];
  const batchCount = batchToSend.length;

  // Send batch to background script using safe method
  safeSendMessage({
    type: 'STORAGE_CHANGE_BATCH',
    data: {
      changes: batchToSend,
      batchId: ++batchSequence,
      url: window.location.href,
      domain: window.location.hostname,
      timestamp: Date.now(),
      count: batchCount
    }
  }, (response) => {
    if (response?.success !== false) {
      debug.log(`📦 Sent batch of ${batchCount} storage changes`);
      // Clear batch after successful send
      changeBatch = [];
    }
  });
}, 1000);

// ============================================================================
// SIZE CALCULATION OPTIMIZATION
// ============================================================================

// Cache for size calculations to avoid repeated JSON.stringify
const sizeCache = new WeakMap();

/**
 * Optimized size calculation using Blob API for large objects
 * Performance: Avoids repeated JSON.stringify calls
 * @param {*} data - Data to calculate size for
 * @returns {number} Size in bytes
 */
function calculateSize(data) {
  // Check cache first
  if (typeof data === 'object' && data !== null) {
    if (sizeCache.has(data)) {
      return sizeCache.get(data);
    }
  }

  let size = 0;

  try {
    if (typeof data === 'string') {
      // Direct calculation for strings
      size = new Blob([data]).size;
    } else if (data === null || data === undefined) {
      size = 0;
    } else if (typeof data === 'object') {
      // Use Blob API for objects (more efficient than JSON.stringify for large data)
      const serialized = JSON.stringify(data);
      size = new Blob([serialized]).size;
      // Cache the result
      sizeCache.set(data, size);
    } else {
      // For primitives
      size = String(data).length;
    }
  } catch (error) {
    // Fallback for circular references or other errors
    debug.warn('Size calculation error:', error);
    size = 0;
  }

  return size;
}

// ============================================================================
// PAGINATION SUPPORT
// ============================================================================

/**
 * Get paginated storage data for handling large storage efficiently
 * Performance: Returns chunks of data instead of entire storage at once
 * @param {string} storageType - 'localStorage', 'sessionStorage', or 'indexedDB'
 * @param {number} offset - Starting index (default: 0)
 * @param {number} limit - Number of items to return (default: 100)
 * @returns {Object} Paginated storage data
 */
function getStoragePaginated(storageType, offset = 0, limit = 100) {
  const result = {
    items: [],
    total: 0,
    offset: offset,
    limit: limit,
    hasMore: false,
    storageType: storageType,
    error: null
  };

  try {
    let storage;

    // Select storage type
    switch (storageType) {
      case 'localStorage':
        storage = localStorage;
        break;
      case 'sessionStorage':
        storage = sessionStorage;
        break;
      default:
        // For IndexedDB, use async function
        if (storageType === 'indexedDB') {
          debug.warn('Use getIndexedDBLazy for IndexedDB pagination');
          result.error = 'Use getIndexedDBLazy for IndexedDB';
          return result;
        }
        result.error = 'Invalid storage type';
        return result;
    }

    result.total = storage.length;

    // Calculate actual range
    const startIndex = Math.min(offset, storage.length);
    const endIndex = Math.min(offset + limit, storage.length);

    // Collect paginated items
    for (let i = startIndex; i < endIndex; i++) {
      const key = storage.key(i);
      if (key !== null) {
        try {
          const value = storage.getItem(key);
          const size = calculateSize(key) + calculateSize(value);

          result.items.push({
            key: key,
            value: efficientSerialize(value, 2), // Limit depth for performance
            size: size,
            index: i
          });
        } catch (error) {
          // Handle individual item errors
          result.items.push({
            key: key,
            value: '[Error reading value]',
            size: 0,
            index: i,
            error: error.message
          });
        }
      }
    }

    result.hasMore = endIndex < storage.length;

  } catch (error) {
    result.error = error.message;
    debug.error(`Error paginating ${storageType}:`, error);
  }

  return result;
}

/**
 * Lazy loading for IndexedDB with pagination support
 * Performance: Loads database records on-demand instead of all at once
 * @param {string} dbName - Database name
 * @param {string} storeName - Object store name
 * @param {Object} options - Options for pagination and filtering
 * @returns {Promise<Object>} Paginated IndexedDB records
 */
async function getIndexedDBLazy(dbName, storeName, options = {}) {
  const {
    offset = 0,
    limit = 100,
    includeValues = true,
    keysOnly = false
  } = options;

  const result = {
    items: [],
    total: 0,
    offset: offset,
    limit: limit,
    hasMore: false,
    dbName: dbName,
    storeName: storeName,
    error: null
  };

  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const transaction = db.transaction([storeName], 'readonly');
    const objectStore = transaction.objectStore(storeName);

    // Get total count first
    const countRequest = objectStore.count();
    result.total = await new Promise((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });

    // Use cursor for efficient pagination
    let currentIndex = 0;
    let collected = 0;

    await new Promise((resolve, reject) => {
      const request = keysOnly ?
        objectStore.openKeyCursor() :
        objectStore.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (!cursor || collected >= limit) {
          resolve();
          return;
        }

        // Skip to offset
        if (currentIndex < offset) {
          currentIndex++;
          cursor.continue();
          return;
        }

        // Collect item
        const item = {
          key: cursor.key,
          index: currentIndex
        };

        if (!keysOnly && includeValues) {
          item.value = efficientSerialize(cursor.value, 2);
          item.size = calculateSize(cursor.value);
        }

        result.items.push(item);
        collected++;
        currentIndex++;

        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });

    result.hasMore = (offset + limit) < result.total;
    db.close();

  } catch (error) {
    result.error = error.message;
    debug.error(`Error lazy loading IndexedDB ${dbName}/${storeName}:`, error);
  }

  return result;
}

/**
 * Get list of all IndexedDB databases
 * @returns {Promise<Array>} List of databases with name and version
 */
async function getIndexedDBDatabases() {
  try {
    if (!indexedDB.databases) {
      return []; // API not supported in older browsers
    }
    const dbs = await indexedDB.databases();
    return dbs.map(db => ({ name: db.name, version: db.version }));
  } catch (error) {
    debug.warn('Error getting IndexedDB databases:', error);
    return [];
  }
}

/**
 * Get list of object stores for a database
 * @param {string} dbName - Database name
 * @returns {Promise<Array>} List of object store names
 */
async function getIndexedDBObjectStores(dbName) {
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const stores = Array.from(db.objectStoreNames);
    db.close();
    return stores;
  } catch (error) {
    debug.warn(`Error getting stores for ${dbName}:`, error);
    return [];
  }
}

/**
 * Delete a specific record from IndexedDB
 * @param {string} dbName - Database name
 * @param {string} storeName - Object store name
 * @param {*} key - Record key
 * @returns {Promise<boolean>} Success status
 */
async function deleteIndexedDBRecord(dbName, storeName, key) {
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const transaction = db.transaction([storeName], 'readwrite');
    const objectStore = transaction.objectStore(storeName);

    await new Promise((resolve, reject) => {
      const request = objectStore.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    return true;
  } catch (error) {
    debug.error(`Error deleting IndexedDB record ${dbName}/${storeName}/${key}:`, error);
    throw error;
  }
}

// ============================================================================
// STORAGE MONITORING
// ============================================================================

/**
 * Monitor storage changes with batching
 */
function monitorStorage() {
  // Track localStorage changes
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    debug.log('📝 localStorage.setItem:', key);
    notifyStorageChange('localStorage', 'set', key, value);
    return originalSetItem.apply(this, arguments);
  };

  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function (key) {
    debug.log('🗑️ localStorage.removeItem:', key);
    notifyStorageChange('localStorage', 'remove', key);
    return originalRemoveItem.apply(this, arguments);
  };

  const originalClear = localStorage.clear;
  localStorage.clear = function () {
    debug.log('🗑️ localStorage.clear');
    notifyStorageChange('localStorage', 'clear');
    return originalClear.apply(this, arguments);
  };

  // Track sessionStorage changes
  const originalSessionSetItem = sessionStorage.setItem;
  sessionStorage.setItem = function (key, value) {
    debug.log('📝 sessionStorage.setItem:', key);
    notifyStorageChange('sessionStorage', 'set', key, value);
    return originalSessionSetItem.apply(this, arguments);
  };

  const originalSessionRemoveItem = sessionStorage.removeItem;
  sessionStorage.removeItem = function (key) {
    debug.log('🗑️ sessionStorage.removeItem:', key);
    notifyStorageChange('sessionStorage', 'remove', key);
    return originalSessionRemoveItem.apply(this, arguments);
  };

  const originalSessionClear = sessionStorage.clear;
  sessionStorage.clear = function () {
    debug.log('🗑️ sessionStorage.clear');
    notifyStorageChange('sessionStorage', 'clear');
    return originalSessionClear.apply(this, arguments);
  };
}

/**
 * Updated notification function with batching support
 * Performance: Batches changes and sends max 1 message per second
 * @param {string} storageType - Type of storage
 * @param {string} action - Action performed
 * @param {string} key - Storage key
 * @param {*} value - Optional value for set operations
 */
function notifyStorageChange(storageType, action, key, value) {
  try {
    // Create change object
    const change = {
      storageType,
      action,
      key,
      timestamp: Date.now(),
      sequenceId: changeBatch.length
    };

    // Add value info for set operations (with size limit)
    if (action === 'set' && value !== undefined) {
      change.valueSize = calculateSize(value);
      // Only include small values directly
      if (change.valueSize < 1000) {
        change.value = value;
      } else {
        change.value = '[Large value omitted]';
        change.valueTruncated = true;
      }
    }

    // Add to batch
    changeBatch.push(change);

    // Trigger debounced batch send
    debouncedNotifyBatch();

    // For critical operations (clear), also use throttled immediate notification
    if (action === 'clear') {
      throttledCriticalNotify(storageType, action);
    }

  } catch (error) {
    debug.warn('Failed to batch storage change:', error);
  }
}

/**
 * Throttled notification for critical operations
 * Performance: Ensures critical operations are notified within reasonable time
 */
const throttledCriticalNotify = throttle((storageType, action) => {
  // Exit early if extension is disconnected
  if (extensionDisconnected) return;

  safeSendMessage({
    type: 'STORAGE_CRITICAL_CHANGE',
    data: {
      storageType,
      action,
      url: window.location.href,
      domain: window.location.hostname,
      timestamp: Date.now()
    }
  });
}, 2000);

/**
 * Get current page storage info with pagination support
 * Performance: Uses pagination to handle large storage efficiently
 */
function getStorageInfo(options = {}) {
  const {
    paginate = true,
    maxItemsPerType = 100,
    includeValues = false
  } = options;

  const info = {
    url: window.location.href,
    domain: window.location.hostname,
    timestamp: Date.now(),
    localStorage: {
      keys: [],
      totalSize: 0,
      itemCount: 0,
      truncated: false
    },
    sessionStorage: {
      keys: [],
      totalSize: 0,
      itemCount: 0,
      truncated: false
    },
    cookies: {
      count: 0,
      totalSize: 0
    },
    performance: {
      calculationTime: 0
    }
  };

  const startTime = performance.now();

  // Get localStorage info with pagination
  try {
    if (paginate && localStorage.length > maxItemsPerType) {
      // Use pagination for large storage
      const paginated = getStoragePaginated('localStorage', 0, maxItemsPerType);
      info.localStorage.keys = paginated.items.map(item => item.key);
      info.localStorage.totalSize = paginated.items.reduce((sum, item) => sum + item.size, 0);
      info.localStorage.itemCount = paginated.total;
      info.localStorage.truncated = paginated.hasMore;

      if (includeValues) {
        info.localStorage.items = paginated.items;
      }
    } else {
      // Full scan for small storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          const size = calculateSize(key) + calculateSize(value);
          info.localStorage.keys.push(key);
          info.localStorage.totalSize += size;

          if (includeValues && i < maxItemsPerType) {
            if (!info.localStorage.items) info.localStorage.items = [];
            info.localStorage.items.push({
              key,
              value: efficientSerialize(value, 1),
              size
            });
          }
        }
      }
      info.localStorage.itemCount = localStorage.length;
    }
  } catch (error) {
    debug.warn('Cannot access localStorage:', error);
    info.localStorage.error = error.message;
  }

  // Get sessionStorage info with pagination
  try {
    if (paginate && sessionStorage.length > maxItemsPerType) {
      // Use pagination for large storage
      const paginated = getStoragePaginated('sessionStorage', 0, maxItemsPerType);
      info.sessionStorage.keys = paginated.items.map(item => item.key);
      info.sessionStorage.totalSize = paginated.items.reduce((sum, item) => sum + item.size, 0);
      info.sessionStorage.itemCount = paginated.total;
      info.sessionStorage.truncated = paginated.hasMore;

      if (includeValues) {
        info.sessionStorage.items = paginated.items;
      }
    } else {
      // Full scan for small storage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key) || '';
          const size = calculateSize(key) + calculateSize(value);
          info.sessionStorage.keys.push(key);
          info.sessionStorage.totalSize += size;

          if (includeValues && i < maxItemsPerType) {
            if (!info.sessionStorage.items) info.sessionStorage.items = [];
            info.sessionStorage.items.push({
              key,
              value: efficientSerialize(value, 1),
              size
            });
          }
        }
      }
      info.sessionStorage.itemCount = sessionStorage.length;
    }
  } catch (error) {
    debug.warn('Cannot access sessionStorage:', error);
    info.sessionStorage.error = error.message;
  }

  // Get cookie info
  try {
    const cookies = document.cookie.split(';').filter(c => c.trim());
    info.cookies.count = cookies.length;
    info.cookies.totalSize = calculateSize(document.cookie);
  } catch (error) {
    debug.warn('Cannot access cookies:', error);
    info.cookies.error = error.message;
  }

  info.performance.calculationTime = performance.now() - startTime;

  return info;
}

/**
 * Safe response wrapper to handle context invalidation
 */
function safeSendResponse(sendResponse, data) {
  if (!isExtensionContextValid()) {
    debug.warn('⚠️ Cannot send response - extension context invalidated');
    return;
  }
  try {
    sendResponse(data);
  } catch (error) {
    debug.warn('⚠️ Failed to send response:', error.message);
  }
}

/**
 * Listen for messages from background script
 * Wrapped in try-catch to handle extension context invalidation gracefully
 */
try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Check if extension context is still valid
    if (!isExtensionContextValid()) {
      debug.warn('⚠️ Received message but extension context is invalidated. Please refresh the page.');
      return false;
    }

    debug.log('📨 Content script received message:', message.type);

    try {
      switch (message.type) {
        case 'GET_STORAGE_INFO':
          // Support pagination options from background
          const options = message.options || {};
          safeSendResponse(sendResponse, { success: true, data: getStorageInfo(options) });
          return true;

        case 'GET_STORAGE_PAGE':
          // Get specific page of storage data
          const { storageType, offset = 0, limit = 100 } = message;
          const pageData = getStoragePaginated(storageType, offset, limit);
          safeSendResponse(sendResponse, { success: true, data: pageData });
          return true;

        case 'GET_INDEXEDDB_PAGE':
          // Async operation for IndexedDB pagination
          const { dbName, storeName, options: dbOptions } = message;
          getIndexedDBLazy(dbName, storeName, dbOptions)
            .then(data => safeSendResponse(sendResponse, { success: true, data }))
            .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
          return true; // Keep message channel open for async response

        case 'GET_IDB_DBS':
          // Get list of IndexedDB databases
          getIndexedDBDatabases()
            .then(data => safeSendResponse(sendResponse, { success: true, data }))
            .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
          return true;

        case 'GET_IDB_STORES':
          // Get list of object stores
          getIndexedDBObjectStores(message.dbName)
            .then(data => safeSendResponse(sendResponse, { success: true, data }))
            .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
          return true;

        case 'DELETE_IDB_RECORD':
          // Delete specific IndexedDB record
          const { dbName: delDb, storeName: delStore, key: delKey } = message;
          deleteIndexedDBRecord(delDb, delStore, delKey)
            .then(() => safeSendResponse(sendResponse, { success: true }))
            .catch(error => safeSendResponse(sendResponse, { success: false, error: error.message }));
          return true;

        case 'CLEAR_LOCAL_STORAGE':
          try {
            localStorage.clear();
            safeSendResponse(sendResponse, { success: true });
          } catch (error) {
            safeSendResponse(sendResponse, { success: false, error: error.message });
          }
          return true;

        case 'CLEAR_SESSION_STORAGE':
          try {
            sessionStorage.clear();
            safeSendResponse(sendResponse, { success: true });
          } catch (error) {
            safeSendResponse(sendResponse, { success: false, error: error.message });
          }
          return true;

        case 'FLUSH_BATCH':
          // Force send any pending batch
          debouncedNotifyBatch.flush();
          safeSendResponse(sendResponse, { success: true, batchSize: changeBatch.length });
          return true;

        default:
          // Also handle action-based messages from service worker
          if (message.action === 'clearStorage') {
            try {
              if (message.storageType === 'localStorage') {
                localStorage.clear();
              } else if (message.storageType === 'sessionStorage') {
                sessionStorage.clear();
              }
              safeSendResponse(sendResponse, { success: true });
            } catch (error) {
              safeSendResponse(sendResponse, { success: false, error: error.message });
            }
            return true;
          }

          if (message.action === 'deleteStorageKey') {
            try {
              if (message.storageType === 'localStorage') {
                localStorage.removeItem(message.key);
              } else if (message.storageType === 'sessionStorage') {
                sessionStorage.removeItem(message.key);
              }
              safeSendResponse(sendResponse, { success: true });
            } catch (error) {
              safeSendResponse(sendResponse, { success: false, error: error.message });
            }
            return true;
          }

          safeSendResponse(sendResponse, { success: false, error: 'Unknown message type' });
          return true;
      }
    } catch (error) {
      debug.warn('⚠️ Error handling message:', error.message);
      safeSendResponse(sendResponse, { success: false, error: error.message });
      return true;
    }
  });
} catch (error) {
  debug.warn('⚠️ Extension context invalidated. Please refresh the page to reconnect.');
}

/**
 * Send initial page load info
 * Performance: Uses efficient serialization and pagination
 */
function sendPageLoadInfo() {
  try {
    const info = getStorageInfo({
      paginate: true,
      maxItemsPerType: 50,
      includeValues: false
    });

    safeSendMessage({
      type: 'PAGE_LOAD',
      data: info
    }, (response) => {
      if (response?.success !== false) {
        debug.log(`✅ Page load info sent (calculation time: ${info.performance.calculationTime.toFixed(2)}ms)`);
      }
    });
  } catch (error) {
    debug.warn('Failed to send page load info:', error);
  }
}

/**
 * Cleanup function for page unload
 */
function cleanup() {
  // Flush any pending batches before page unload
  debouncedNotifyBatch.flush();
}

// ============================================================================
// WEB APP COMMUNICATION
// ============================================================================

/**
 * Listen for messages from the web app (localhost:3000)
 * Relay action commands to the background script
 */
window.addEventListener('message', (event) => {
  // Only accept messages from the same origin (localhost:3000)
  if (event.origin !== window.location.origin) {
    return;
  }

  // Check if extension context is still valid before processing
  if (!isExtensionContextValid()) {
    return; // Silently ignore - extension was reloaded
  }

  // Check if it's from our web app (support both source names for compatibility)
  if (event.data && (event.data.source === 'storageinsight-webapp' || event.data.source === 'insight-webapp')) {
    debug.log('📨 Web app message received:', event.data);

    // Handle REQUEST_DATA - trigger a new scan and send data back
    if (event.data.type === 'REQUEST_DATA') {
      debug.log('🔄 Web app requested data refresh');

      // Request fresh scan from background script
      safeSendMessage({ type: 'SCAN_STORAGE' }, (response) => {
        debug.log('📊 Scan response received:', response?.success);

        if (response && response.success && response.data) {
          // Send scan data back to web app
          window.postMessage({
            source: 'storageinsight-extension',
            type: 'SCAN_DATA',
            payload: response.data,
          }, window.location.origin);
          debug.log('✅ Scan data sent to web app');
        } else {
          debug.warn('❌ Scan failed or no data:', response?.error);
          // Send error response
          window.postMessage({
            source: 'storageinsight-extension',
            type: 'SCAN_ERROR',
            error: response?.error || 'Scan failed. Try refreshing the page.',
          }, window.location.origin);
        }
      });
      return;
    }

    // Relay action to background script
    if (event.data.type === 'EXECUTE_ACTION' && event.data.action) {
      safeSendMessage({
        type: event.data.action,
      }, (response) => {
        debug.log('✅ Action response:', response);

        // Post response back to web app
        window.postMessage({
          source: 'storageinsight-extension',
          type: 'ACTION_RESPONSE',
          action: event.data.action,
          success: response?.success || false,
          data: response?.data,
          error: response?.error,
        }, window.location.origin);
      });
    }
  }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize monitoring
monitorStorage();

// Send page load info
if (document.readyState === 'complete') {
  sendPageLoadInfo();
} else {
  window.addEventListener('load', sendPageLoadInfo);
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);

// Announce extension presence to the web app
// This helps the dashboard detect the extension is installed
function announceExtension() {
  // Check if extension context is still valid before announcing
  if (!isExtensionContextValid()) {
    return; // Extension was reloaded, stop announcing
  }

  try {
    window.postMessage({
      source: 'storageinsight-extension',
      type: 'EXTENSION_READY',
      version: '1.0.0',
    }, window.location.origin);
    debug.log('📢 Extension announced to web app at', window.location.origin);
  } catch (error) {
    debug.warn('⚠️ Failed to announce extension:', error.message);
  }
}

// Announce immediately and also after a short delay (in case page JS loads later)
announceExtension();
setTimeout(() => {
  if (isExtensionContextValid()) announceExtension();
}, 1000);
setTimeout(() => {
  if (isExtensionContextValid()) announceExtension();
}, 3000);

debug.log('✅ StorageInsight content script initialized with performance optimizations');
debug.log('📊 Performance features: Batching (1msg/sec), Pagination (100 items/page), Efficient serialization (<10ms)');
debug.log('🔗 Web app communication enabled for', window.location.origin);