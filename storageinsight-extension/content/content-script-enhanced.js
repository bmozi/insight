/**
 * ENHANCED MESSAGE HANDLERS AND HELPER FUNCTIONS
 * Add these to content-script.js
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect the type of a stored value
 * @param {string} value - The stored value
 * @returns {string} Type: 'json', 'array', 'object', 'number', 'boolean', 'null', 'string'
 */
function detectValueType(value) {
  if (value === null || value === 'null') {
    return 'null';
  }

  if (value === '') {
    return 'string';
  }

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(value);

    if (parsed === null) {
      return 'null';
    }

    if (Array.isArray(parsed)) {
      return 'array';
    }

    if (typeof parsed === 'object') {
      return 'json';
    }

    if (typeof parsed === 'number') {
      return 'number';
    }

    if (typeof parsed === 'boolean') {
      return 'boolean';
    }

    return 'string';
  } catch (e) {
    // Not valid JSON, it's a plain string
    return 'string';
  }
}

/**
 * Get caller information from stack trace
 * @returns {object} Caller info with file, line, column, function
 */
function getCaller() {
  try {
    const stack = new Error().stack;
    if (!stack) {
      return { file: 'unknown', line: 0, column: 0, function: 'unknown' };
    }

    const lines = stack.split('\n');
    // Skip first 3 lines: "Error", "at getCaller", "at notifyStorageChange"
    // Line 3 is the actual caller
    const callerLine = lines[3] || lines[2] || lines[1] || '';

    // Parse stack trace line
    // Format: "at functionName (file:line:column)" or "at file:line:column"
    const match = callerLine.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/);

    if (match) {
      return {
        function: match[1] || 'anonymous',
        file: match[2] || 'unknown',
        line: parseInt(match[3], 10) || 0,
        column: parseInt(match[4], 10) || 0,
      };
    }

    // Fallback parsing
    return {
      function: 'unknown',
      file: callerLine.trim(),
      line: 0,
      column: 0,
    };
  } catch (error) {
    return {
      function: 'error',
      file: error.message,
      line: 0,
      column: 0,
    };
  }
}

/**
 * Calculate byte size of a string
 * @param {string} str - String to measure
 * @returns {number} Size in bytes
 */
function getByteSize(str) {
  return new Blob([str]).size;
}

/**
 * Sanitize value for display (remove sensitive data)
 * @param {string} value - Original value
 * @returns {string} Sanitized value
 */
function sanitizeValue(value) {
  if (!value) return value;

  // Check for common sensitive patterns
  const sensitivePatterns = [
    /token/i,
    /password/i,
    /secret/i,
    /key/i,
    /auth/i,
    /session/i,
    /credential/i,
  ];

  const valueStr = String(value).toLowerCase();
  const isSensitive = sensitivePatterns.some(pattern => pattern.test(valueStr));

  if (isSensitive && value.length > 20) {
    return '[REDACTED - Sensitive Data]';
  }

  // Truncate very long values
  if (value.length > 1000) {
    return value.substring(0, 1000) + '... [truncated]';
  }

  return value;
}

/**
 * Get detailed storage item information
 * @param {Storage} storage - localStorage or sessionStorage
 * @param {string} key - Storage key
 * @param {boolean} includeValue - Whether to include the value
 * @param {boolean} sanitize - Whether to sanitize sensitive data
 * @returns {object} Item details
 */
function getStorageItemDetails(storage, key, includeValue = true, sanitize = false) {
  try {
    const value = storage.getItem(key);
    const valueStr = value || '';
    const size = getByteSize(key) + getByteSize(valueStr);
    const type = detectValueType(valueStr);

    const item = {
      key,
      size,
      type,
    };

    if (includeValue) {
      item.value = sanitize ? sanitizeValue(valueStr) : valueStr;

      // Try to parse JSON for better display
      if (type === 'json' || type === 'array' || type === 'object') {
        try {
          item.parsedValue = JSON.parse(valueStr);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
    }

    return item;
  } catch (error) {
    return {
      key,
      error: error.message,
      size: 0,
      type: 'error',
    };
  }
}

/**
 * Get all IndexedDB databases for current origin
 * @returns {Promise<Array>} List of database information
 */
async function getIndexedDBInfo() {
  try {
    if (!window.indexedDB || !window.indexedDB.databases) {
      return [];
    }

    const databases = await window.indexedDB.databases();
    const dbInfos = [];

    for (const dbInfo of databases) {
      try {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open(dbInfo.name);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        const objectStores = [];
        for (let i = 0; i < db.objectStoreNames.length; i++) {
          objectStores.push(db.objectStoreNames[i]);
        }

        dbInfos.push({
          name: dbInfo.name,
          version: dbInfo.version || db.version,
          objectStores,
          size: 'unknown', // Size estimation requires reading all data
        });

        db.close();
      } catch (error) {
        dbInfos.push({
          name: dbInfo.name,
          error: error.message,
        });
      }
    }

    return dbInfos;
  } catch (error) {
    console.warn('Cannot access IndexedDB:', error);
    return [];
  }
}

/**
 * Detect potential fingerprinting attempts
 * @returns {Array} List of detected fingerprinting attempts
 */
function detectFingerprints() {
  const fingerprints = [];

  // Check for canvas fingerprinting
  const canvasKeys = Object.keys(localStorage).concat(Object.keys(sessionStorage))
    .filter(key => key.includes('canvas') || key.includes('fingerprint'));

  if (canvasKeys.length > 0) {
    fingerprints.push({
      type: 'canvas',
      keys: canvasKeys,
      severity: 'medium',
    });
  }

  // Check for font fingerprinting
  const fontKeys = Object.keys(localStorage).concat(Object.keys(sessionStorage))
    .filter(key => key.includes('font') || key.includes('typeface'));

  if (fontKeys.length > 0) {
    fingerprints.push({
      type: 'font',
      keys: fontKeys,
      severity: 'low',
    });
  }

  // Check for device fingerprinting
  const deviceKeys = Object.keys(localStorage).concat(Object.keys(sessionStorage))
    .filter(key => key.includes('device') || key.includes('screen') || key.includes('browser'));

  if (deviceKeys.length > 0) {
    fingerprints.push({
      type: 'device',
      keys: deviceKeys,
      severity: 'medium',
    });
  }

  return fingerprints;
}

/**
 * Enhanced storage info function matching Prompt 7 spec
 * @param {object} options - Options for gathering storage info
 * @returns {Promise<object>} Complete storage information
 */
async function getEnhancedStorageInfo(options = {}) {
  const {
    type = 'all',
    includeValues = true,
    sanitize = true,
  } = options;

  const startTime = performance.now();

  const info = {
    origin: window.location.origin,
    url: window.location.href,
    domain: window.location.hostname,
    timestamp: Date.now(),
    fingerprints: [],
  };

  // Get localStorage info
  if (type === 'all' || type === 'localStorage') {
    const items = [];
    let totalSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const itemDetails = getStorageItemDetails(localStorage, key, includeValues, sanitize);
          items.push(itemDetails);
          totalSize += itemDetails.size;
        }
      }

      info.localStorage = {
        itemCount: items.length,
        totalSize,
        items,
      };
    } catch (error) {
      info.localStorage = {
        error: error.message,
        itemCount: 0,
        totalSize: 0,
        items: [],
      };
    }
  }

  // Get sessionStorage info
  if (type === 'all' || type === 'sessionStorage') {
    const items = [];
    let totalSize = 0;

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const itemDetails = getStorageItemDetails(sessionStorage, key, includeValues, sanitize);
          items.push(itemDetails);
          totalSize += itemDetails.size;
        }
      }

      info.sessionStorage = {
        itemCount: items.length,
        totalSize,
        items,
      };
    } catch (error) {
      info.sessionStorage = {
        error: error.message,
        itemCount: 0,
        totalSize: 0,
        items: [],
      };
    }
  }

  // Get IndexedDB info
  if (type === 'all' || type === 'indexedDB') {
    try {
      const databases = await getIndexedDBInfo();
      info.indexedDB = {
        databases,
        databaseCount: databases.length,
      };
    } catch (error) {
      info.indexedDB = {
        error: error.message,
        databases: [],
        databaseCount: 0,
      };
    }
  }

  // Detect fingerprinting attempts
  if (type === 'all') {
    info.fingerprints = detectFingerprints();
  }

  // Add timing information
  const endTime = performance.now();
  info.processingTime = Math.round(endTime - startTime);

  return info;
}

/**
 * Enhanced notifyStorageChange with caller info
 */
function notifyStorageChangeEnhanced(storageType, action, key, value = null) {
  try {
    const caller = getCaller();

    chrome.runtime.sendMessage({
      type: 'STORAGE_CHANGE',
      data: {
        storageType,
        action,
        key,
        value: value ? sanitizeValue(value) : null,
        url: window.location.href,
        domain: window.location.hostname,
        origin: window.location.origin,
        timestamp: Date.now(),
        caller: {
          function: caller.function,
          file: caller.file,
          line: caller.line,
          column: caller.column,
        },
      },
    });
  } catch (error) {
    // Extension context may be invalid
    console.warn('Failed to notify storage change:', error);
  }
}

// ============================================================================
// ENHANCED MESSAGE HANDLERS
// Replace the switch statement in chrome.runtime.onMessage.addListener
// ============================================================================

/**
 * Enhanced message handler with async support
 * Replace lines 117-147 in content-script.js with this:
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content script received message:', message.type);

  // Handle async operations
  const handleAsync = async () => {
    switch (message.type) {
      // ======================================================================
      // ENHANCED GET STORAGE - Supports filtering and detailed info
      // ======================================================================
      case 'get-storage': {
        try {
          const { type = 'all', includeValues = true, sanitize = true } = message.data || {};

          const storageInfo = await getEnhancedStorageInfo({
            type,
            includeValues,
            sanitize,
          });

          sendResponse({
            success: true,
            data: storageInfo,
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message,
            stack: error.stack,
          });
        }
        break;
      }

      // ======================================================================
      // GET STORAGE DETAILS - Get detailed info about a specific key
      // ======================================================================
      case 'get-storage-details': {
        try {
          const { key, storageType = 'localStorage' } = message.data || {};

          if (!key) {
            sendResponse({
              success: false,
              error: 'Key is required',
            });
            break;
          }

          const storage = storageType === 'sessionStorage' ? sessionStorage : localStorage;
          const value = storage.getItem(key);

          if (value === null) {
            sendResponse({
              success: false,
              error: `Key "${key}" not found in ${storageType}`,
            });
            break;
          }

          const details = getStorageItemDetails(storage, key, true, false);

          // Add estimated created time (not available in Web Storage API)
          // This is just an approximation
          details.estimatedCreated = 'unknown';
          details.storageType = storageType;
          details.lastAccessed = Date.now();

          sendResponse({
            success: true,
            data: details,
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message,
          });
        }
        break;
      }

      // ======================================================================
      // DELETE STORAGE ITEM - Remove a specific key from storage
      // ======================================================================
      case 'delete-storage-item': {
        try {
          const { storageType, key } = message.data || {};

          if (!storageType || !key) {
            sendResponse({
              success: false,
              error: 'storageType and key are required',
            });
            break;
          }

          const storage = storageType === 'sessionStorage' ? sessionStorage : localStorage;

          // Check if key exists
          const existedBefore = storage.getItem(key) !== null;

          if (!existedBefore) {
            sendResponse({
              success: false,
              error: `Key "${key}" not found in ${storageType}`,
            });
            break;
          }

          // Remove the item
          storage.removeItem(key);

          // Verify removal
          const existsAfter = storage.getItem(key) !== null;

          sendResponse({
            success: true,
            data: {
              key,
              storageType,
              deleted: !existsAfter,
              timestamp: Date.now(),
            },
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message,
          });
        }
        break;
      }

      // ======================================================================
      // CLEAR ORIGIN STORAGE - Clear specified storage types
      // ======================================================================
      case 'clear-origin-storage': {
        try {
          const { types = ['localStorage', 'sessionStorage'] } = message.data || {};
          const results = {};
          let totalCleared = 0;

          // Clear localStorage
          if (types.includes('localStorage')) {
            try {
              const count = localStorage.length;
              localStorage.clear();
              results.localStorage = {
                success: true,
                itemsCleared: count,
              };
              totalCleared += count;
            } catch (error) {
              results.localStorage = {
                success: false,
                error: error.message,
              };
            }
          }

          // Clear sessionStorage
          if (types.includes('sessionStorage')) {
            try {
              const count = sessionStorage.length;
              sessionStorage.clear();
              results.sessionStorage = {
                success: true,
                itemsCleared: count,
              };
              totalCleared += count;
            } catch (error) {
              results.sessionStorage = {
                success: false,
                error: error.message,
              };
            }
          }

          // Clear IndexedDB
          if (types.includes('indexedDB')) {
            try {
              if (window.indexedDB && window.indexedDB.databases) {
                const databases = await window.indexedDB.databases();
                let dbCleared = 0;

                for (const dbInfo of databases) {
                  try {
                    await new Promise((resolve, reject) => {
                      const request = indexedDB.deleteDatabase(dbInfo.name);
                      request.onsuccess = () => resolve();
                      request.onerror = () => reject(request.error);
                      request.onblocked = () => reject(new Error('Database deletion blocked'));
                    });
                    dbCleared++;
                  } catch (error) {
                    console.warn(`Failed to delete database ${dbInfo.name}:`, error);
                  }
                }

                results.indexedDB = {
                  success: true,
                  databasesCleared: dbCleared,
                };
                totalCleared += dbCleared;
              } else {
                results.indexedDB = {
                  success: false,
                  error: 'IndexedDB not supported or databases() not available',
                };
              }
            } catch (error) {
              results.indexedDB = {
                success: false,
                error: error.message,
              };
            }
          }

          sendResponse({
            success: true,
            data: {
              results,
              totalCleared,
              timestamp: Date.now(),
            },
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message,
          });
        }
        break;
      }

      // ======================================================================
      // LEGACY HANDLERS - Keep for backward compatibility
      // ======================================================================
      case 'GET_STORAGE_INFO': {
        try {
          const info = await getEnhancedStorageInfo({ type: 'all', includeValues: false });
          sendResponse({ success: true, data: info });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
      }

      case 'CLEAR_LOCAL_STORAGE': {
        try {
          const count = localStorage.length;
          localStorage.clear();
          sendResponse({ success: true, itemsCleared: count });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
      }

      case 'CLEAR_SESSION_STORAGE': {
        try {
          const count = sessionStorage.length;
          sessionStorage.clear();
          sendResponse({ success: true, itemsCleared: count });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
        break;
    }
  };

  // Execute async handler
  handleAsync();

  // Return true to indicate we'll send response asynchronously
  return true;
});

// ============================================================================
// STORAGE EVENT LISTENER - Monitor changes from other tabs
// ============================================================================

/**
 * Listen for storage events from other tabs/windows
 * This captures changes made to localStorage from other contexts
 */
window.addEventListener('storage', (event) => {
  try {
    console.log('🔄 Storage event from other tab:', event.key);

    chrome.runtime.sendMessage({
      type: 'STORAGE_EVENT',
      data: {
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
        storageArea: event.storageArea === localStorage ? 'localStorage' : 'sessionStorage',
        url: event.url || window.location.href,
        origin: window.location.origin,
        domain: window.location.hostname,
        timestamp: Date.now(),
        source: 'external-tab',
      },
    });
  } catch (error) {
    console.warn('Failed to notify storage event:', error);
  }
});
