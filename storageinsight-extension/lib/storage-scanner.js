/**
 * StorageScanner Library - Enhanced Core Module
 * Comprehensive scanning and analysis of browser storage including:
 * - Cookies (with detailed parsing and domain grouping)
 * - LocalStorage (with size calculation)
 * - SessionStorage (with tab/window tracking)
 * - IndexedDB (with object store enumeration)
 *
 * @module storage-scanner
 * @version 2.0.0
 */

import debug from './debug.js';

/**
 * Wraps a promise with a timeout that ALWAYS resolves (never hangs).
 * If the promise hangs forever, this will still resolve with the fallback value.
 * This is critical for chrome.scripting.executeScript which can hang indefinitely
 * on tabs without proper permissions.
 *
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {*} fallback - Value to resolve with on timeout (default: null)
 * @returns {Promise} Always resolves, never rejects or hangs
 */
function withTimeout(promise, ms, fallback = null) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((result) => { clearTimeout(timer); resolve(result); })
      .catch(() => { clearTimeout(timer); resolve(fallback); });
  });
}

/**
 * Format a Unix timestamp or Date to a human-readable string
 * @param {number|Date} timestamp - Unix timestamp (seconds) or Date object
 * @returns {string} Formatted date string
 */
function formatExpirationDate(timestamp) {
  if (!timestamp) return 'Session';

  const date = typeof timestamp === 'number'
    ? new Date(timestamp * 1000)
    : new Date(timestamp);

  if (!date || isNaN(date.getTime())) return 'Invalid Date';

  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // If expired
  if (diffMs < 0) {
    return `Expired ${Math.abs(diffDays)} days ago`;
  }

  // If expires soon
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return `Expires in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }

  if (diffDays < 30) {
    return `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }

  // Format as readable date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate the size of a cookie in bytes
 * @param {chrome.cookies.Cookie} cookie - Chrome cookie object
 * @returns {number} Size in bytes
 */
function calculateCookieSize(cookie) {
  return (
    (cookie.name?.length || 0) +
    (cookie.value?.length || 0) +
    (cookie.domain?.length || 0) +
    (cookie.path?.length || 0)
  );
}

/**
 * Parse a cookie into detailed information
 * @param {chrome.cookies.Cookie} cookie - Raw cookie from Chrome API
 * @returns {Object} Enhanced cookie object with readable properties
 */
function parseCookieDetails(cookie) {
  return {
    // Basic properties
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,

    // Security flags
    secure: cookie.secure || false,
    httpOnly: cookie.httpOnly || false,
    sameSite: cookie.sameSite || 'unspecified',

    // Type and expiration
    session: cookie.session || false,
    expirationDate: cookie.expirationDate || null,
    expirationFormatted: formatExpirationDate(cookie.expirationDate),

    // Metadata
    hostOnly: cookie.hostOnly || false,
    storeId: cookie.storeId || 'default',

    // Size
    sizeBytes: calculateCookieSize(cookie),

    // Extended properties
    isPersistent: !cookie.session,
    isThirdParty: cookie.domain.startsWith('.'),

    // Raw object for reference
    _raw: cookie
  };
}

/**
 * Scan all cookies from the browser
 *
 * @async
 * @returns {Promise<Object>} Object containing:
 *   - cookies: Array of parsed cookie objects
 *   - byDomain: Cookies grouped by domain
 *   - totalCount: Total number of cookies
 *   - totalSize: Total size in bytes
 *   - metadata: Scan metadata
 *
 * @example
 * const result = await scanCookies();
 * debug.log(`Found ${result.totalCount} cookies`);
 * debug.log(`Domain groups:`, Object.keys(result.byDomain));
 */
export async function scanCookies() {
  try {
    debug.log('🍪 Starting cookie scan...');

    // Get all cookies
    const rawCookies = await chrome.cookies.getAll({});

    // Parse and enhance each cookie
    const cookies = rawCookies.map(parseCookieDetails);

    // Group by domain
    const byDomain = {};
    cookies.forEach(cookie => {
      const domain = cookie.domain.startsWith('.')
        ? cookie.domain.substring(1)
        : cookie.domain;

      if (!byDomain[domain]) {
        byDomain[domain] = {
          cookies: [],
          count: 0,
          totalSize: 0,
          hasSecure: false,
          hasHttpOnly: false,
          hasTracking: false
        };
      }

      byDomain[domain].cookies.push(cookie);
      byDomain[domain].count++;
      byDomain[domain].totalSize += cookie.sizeBytes;

      if (cookie.secure) byDomain[domain].hasSecure = true;
      if (cookie.httpOnly) byDomain[domain].hasHttpOnly = true;
    });

    // Calculate totals
    const totalSize = cookies.reduce((sum, cookie) => sum + cookie.sizeBytes, 0);

    const result = {
      cookies,
      byDomain,
      totalCount: cookies.length,
      totalSize,
      metadata: {
        scanTime: new Date().toISOString(),
        domainCount: Object.keys(byDomain).length,
        sessionCookies: cookies.filter(c => c.session).length,
        persistentCookies: cookies.filter(c => !c.session).length,
        secureCookies: cookies.filter(c => c.secure).length,
        httpOnlyCookies: cookies.filter(c => c.httpOnly).length
      }
    };

    debug.log(`✅ Cookie scan complete: ${result.totalCount} cookies from ${result.metadata.domainCount} domains`);
    return result;

  } catch (error) {
    debug.error('❌ Error scanning cookies:', error);
    throw new Error(`Cookie scan failed: ${error.message}`);
  }
}

/**
 * Scan localStorage from all accessible tabs
 *
 * @async
 * @returns {Promise<Object>} Object containing:
 *   - byDomain: LocalStorage data grouped by domain
 *   - totalItems: Total number of items
 *   - totalSize: Total size in bytes
 *
 * @example
 * const result = await scanLocalStorage();
 * debug.log(`Found ${result.totalItems} localStorage items`);
 */
export async function scanLocalStorage() {
  try {
    debug.log('💾 Starting localStorage scan...');

    const allTabs = await chrome.tabs.query({});
    // Limit to 50 tabs to prevent slowdowns with many open tabs
    const tabs = allTabs.slice(0, 50);
    if (allTabs.length > 50) {
      debug.log(`⚠️ Limiting localStorage scan to 50 of ${allTabs.length} tabs`);
    }
    const byDomain = {};
    let totalItems = 0;
    let totalSize = 0;

    const scanPromises = tabs.map((tab) => {
      // Skip chrome:// and extension URLs
      if (!tab.url ||
          tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('edge://') ||
          tab.url.startsWith('brave://')) {
        return Promise.resolve(null);
      }

      // Wrap the entire tab scan in withTimeout to guarantee it completes
      const scanTab = chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const items = {};
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key) {
                const value = localStorage.getItem(key) || '';
                items[key] = {
                  sizeBytes: key.length + value.length,
                  keyLength: key.length,
                  valueLength: value.length,
                  valuePreview: value.substring(0, 50) + (value.length > 50 ? '...' : '')
                };
              }
            }
          } catch (e) {
            // Cannot access localStorage
          }
          return items;
        }
      }).then((results) => {
        if (results && results[0]?.result) {
          const domain = new URL(tab.url).hostname;
          const items = results[0].result;
          const itemCount = Object.keys(items).length;
          const domainSize = Object.values(items).reduce((sum, item) => sum + item.sizeBytes, 0);

          byDomain[domain] = {
            items,
            count: itemCount,
            totalSize: domainSize,
            url: tab.url,
            tabId: tab.id
          };

          totalItems += itemCount;
          totalSize += domainSize;
        }
        return null;
      });

      // withTimeout guarantees this resolves even if executeScript hangs forever
      return withTimeout(scanTab, 3000, null);
    });

    await Promise.all(scanPromises);

    const result = {
      byDomain,
      totalItems,
      totalSize,
      metadata: {
        scanTime: new Date().toISOString(),
        domainCount: Object.keys(byDomain).length
      }
    };

    debug.log(`✅ LocalStorage scan complete: ${totalItems} items from ${result.metadata.domainCount} domains`);
    return result;

  } catch (error) {
    debug.error('❌ Error scanning localStorage:', error);
    // Return empty result instead of throwing to prevent blocking other scans
    return {
      byDomain: {},
      totalItems: 0,
      totalSize: 0,
      metadata: {
        scanTime: new Date().toISOString(),
        domainCount: 0,
        error: error.message
      }
    };
  }
}

/**
 * Scan sessionStorage from all accessible tabs with tab/window tracking
 *
 * @async
 * @returns {Promise<Object>} Object containing:
 *   - byDomain: SessionStorage data grouped by domain
 *   - byTab: SessionStorage data grouped by tab
 *   - totalItems: Total number of items
 *   - totalSize: Total size in bytes
 *
 * @example
 * const result = await scanSessionStorage();
 * debug.log(`Found ${result.totalItems} sessionStorage items across ${result.byTab.length} tabs`);
 */
export async function scanSessionStorage() {
  try {
    debug.log('🔖 Starting sessionStorage scan...');

    const allTabs = await chrome.tabs.query({});
    // Limit to 50 tabs to prevent slowdowns with many open tabs
    const tabs = allTabs.slice(0, 50);
    if (allTabs.length > 50) {
      debug.log(`⚠️ Limiting sessionStorage scan to 50 of ${allTabs.length} tabs`);
    }
    const byDomain = {};
    const byTab = [];
    let totalItems = 0;
    let totalSize = 0;

    const scanPromises = tabs.map((tab) => {
      // Skip chrome:// and extension URLs
      if (!tab.url ||
          tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('edge://') ||
          tab.url.startsWith('brave://')) {
        return Promise.resolve(null);
      }

      // Wrap the entire tab scan in withTimeout to guarantee it completes
      const scanTab = chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const items = {};
          try {
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key) {
                const value = sessionStorage.getItem(key) || '';
                items[key] = {
                  sizeBytes: key.length + value.length,
                  keyLength: key.length,
                  valueLength: value.length,
                  valuePreview: value.substring(0, 50) + (value.length > 50 ? '...' : '')
                };
              }
            }
          } catch (e) {
            // Cannot access sessionStorage
          }
          return items;
        }
      }).then((results) => {
        if (results && results[0]?.result) {
          const domain = new URL(tab.url).hostname;
          const items = results[0].result;
          const itemCount = Object.keys(items).length;
          const tabSize = Object.values(items).reduce((sum, item) => sum + item.sizeBytes, 0);

          // Group by domain
          if (!byDomain[domain]) {
            byDomain[domain] = {
              tabs: [],
              totalItems: 0,
              totalSize: 0
            };
          }

          const tabData = {
            tabId: tab.id,
            windowId: tab.windowId,
            url: tab.url,
            title: tab.title || 'Untitled',
            items,
            count: itemCount,
            size: tabSize
          };

          byDomain[domain].tabs.push(tabData);
          byDomain[domain].totalItems += itemCount;
          byDomain[domain].totalSize += tabSize;

          byTab.push(tabData);

          totalItems += itemCount;
          totalSize += tabSize;
        }
        return null;
      });

      // withTimeout guarantees this resolves even if executeScript hangs forever
      return withTimeout(scanTab, 3000, null);
    });

    await Promise.all(scanPromises);

    const result = {
      byDomain,
      byTab,
      totalItems,
      totalSize,
      metadata: {
        scanTime: new Date().toISOString(),
        domainCount: Object.keys(byDomain).length,
        tabCount: byTab.length,
        windowCount: new Set(byTab.map(t => t.windowId)).size
      }
    };

    debug.log(`✅ SessionStorage scan complete: ${totalItems} items from ${result.metadata.tabCount} tabs`);
    return result;

  } catch (error) {
    debug.error('❌ Error scanning sessionStorage:', error);
    // Return empty result instead of throwing to prevent blocking other scans
    return {
      byDomain: {},
      byTab: [],
      totalItems: 0,
      totalSize: 0,
      metadata: {
        scanTime: new Date().toISOString(),
        domainCount: 0,
        tabCount: 0,
        windowCount: 0,
        error: error.message
      }
    };
  }
}

/**
 * Scan IndexedDB databases with object store enumeration
 *
 * @async
 * @returns {Promise<Object>} Object containing:
 *   - byDomain: IndexedDB data grouped by domain
 *   - totalDatabases: Total number of databases
 *   - totalObjectStores: Total number of object stores
 *   - estimatedSize: Estimated total size (if available)
 *
 * @example
 * const result = await scanIndexedDB();
 * debug.log(`Found ${result.totalDatabases} IndexedDB databases`);
 */
export async function scanIndexedDB() {
  try {
    debug.log('🗄️ Starting IndexedDB scan...');

    const allTabs = await chrome.tabs.query({});
    // Limit to 50 tabs to prevent slowdowns with many open tabs
    const tabs = allTabs.slice(0, 50);
    if (allTabs.length > 50) {
      debug.log(`⚠️ Limiting IndexedDB scan to 50 of ${allTabs.length} tabs`);
    }
    const byDomain = {};
    let totalDatabases = 0;
    let totalObjectStores = 0;
    let estimatedSize = 0;

    const scanPromises = tabs.map((tab) => {
      // Skip chrome:// and extension URLs
      if (!tab.url ||
          tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('edge://') ||
          tab.url.startsWith('brave://')) {
        return Promise.resolve(null);
      }

      // Wrap the entire tab scan in withTimeout to guarantee it completes
      const scanTab = chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          const databases = [];

          try {
            // Get list of databases
            if (indexedDB.databases) {
              const dbList = await indexedDB.databases();

              for (const dbInfo of dbList) {
                try {
                  // Open database to get object stores
                  const db = await new Promise((resolve, reject) => {
                    const request = indexedDB.open(dbInfo.name, dbInfo.version);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    request.onblocked = () => reject(new Error('Blocked'));
                    setTimeout(() => reject(new Error('DB open timeout')), 2000);
                  });

                  const objectStores = [];
                  for (let i = 0; i < db.objectStoreNames.length; i++) {
                    const storeName = db.objectStoreNames[i];
                    let recordCount = 0;
                    try {
                      const transaction = db.transaction(storeName, 'readonly');
                      const store = transaction.objectStore(storeName);
                      const countRequest = store.count();
                      recordCount = await new Promise((resolve) => {
                        countRequest.onsuccess = () => resolve(countRequest.result);
                        countRequest.onerror = () => resolve(0);
                        setTimeout(() => resolve(0), 1000);
                      });
                    } catch (e) {
                      // Silently skip
                    }

                    objectStores.push({
                      name: storeName,
                      recordCount
                    });
                  }

                  databases.push({
                    name: dbInfo.name,
                    version: dbInfo.version || db.version,
                    objectStores,
                    objectStoreCount: objectStores.length
                  });

                  db.close();

                } catch (error) {
                  databases.push({
                    name: dbInfo.name,
                    version: dbInfo.version,
                    objectStores: [],
                    objectStoreCount: 0,
                    error: error.message
                  });
                }
              }
            }
          } catch (e) {
            // Silently skip
          }

          return databases;
        }
      }).then((results) => {
        if (results && results[0]?.result) {
          const domain = new URL(tab.url).hostname;
          const databases = results[0].result;
          const dbCount = databases.length;
          const storeCount = databases.reduce((sum, db) => sum + (db.objectStoreCount || 0), 0);

          byDomain[domain] = {
            databases,
            count: dbCount,
            objectStoreCount: storeCount,
            url: tab.url,
            tabId: tab.id
          };

          totalDatabases += dbCount;
          totalObjectStores += storeCount;
        }
        return null;
      });

      // withTimeout guarantees this resolves even if executeScript hangs forever (5s for IndexedDB)
      return withTimeout(scanTab, 5000, null);
    });

    await Promise.all(scanPromises);

    // Try to get storage quota
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        estimatedSize = estimate.usage || 0;
      }
    } catch (error) {
      // Silently skip
    }

    const result = {
      byDomain,
      totalDatabases,
      totalObjectStores,
      estimatedSize,
      metadata: {
        scanTime: new Date().toISOString(),
        domainCount: Object.keys(byDomain).length
      }
    };

    debug.log(`✅ IndexedDB scan complete: ${totalDatabases} databases with ${totalObjectStores} object stores`);
    return result;

  } catch (error) {
    debug.error('❌ Error scanning IndexedDB:', error);
    // Return empty result instead of throwing to prevent blocking other scans
    return {
      byDomain: {},
      totalDatabases: 0,
      totalObjectStores: 0,
      estimatedSize: 0,
      metadata: {
        scanTime: new Date().toISOString(),
        domainCount: 0,
        error: error.message
      }
    };
  }
}

/**
 * Scan all storage types and return unified results
 *
 * @async
 * @returns {Promise<Object>} Unified object containing:
 *   - cookies: Cookie scan results
 *   - localStorage: LocalStorage scan results
 *   - sessionStorage: SessionStorage scan results
 *   - indexedDB: IndexedDB scan results
 *   - summary: Overall statistics
 *   - metadata: Scan metadata (scanTime, totalSize, totalItems)
 *
 * @throws {Error} If any critical scan fails
 *
 * @example
 * const results = await scanAllStorage();
 * debug.log('Total storage:', results.summary.totalSizeMB, 'MB');
 * debug.log('Total items:', results.summary.totalItems);
 */
export async function scanAllStorage() {
  debug.log('🔍 Starting comprehensive storage scan...');

  const startTime = Date.now();
  const errors = [];

  // Master timeout (30 seconds) as safety net - ensures scan always completes
  const scanPromise = Promise.allSettled([
    scanCookies(),
    scanLocalStorage(),
    scanSessionStorage(),
    scanIndexedDB()
  ]);

  const settledResults = await withTimeout(scanPromise, 30000, [
    { status: 'rejected', reason: new Error('Master timeout - cookies') },
    { status: 'rejected', reason: new Error('Master timeout - localStorage') },
    { status: 'rejected', reason: new Error('Master timeout - sessionStorage') },
    { status: 'rejected', reason: new Error('Master timeout - indexedDB') }
  ]);

  // Scan all storage types in parallel
  const [cookies, localStorage, sessionStorage, indexedDB] = settledResults;

  // Handle results and errors
  const cookieData = cookies.status === 'fulfilled' ? cookies.value : null;
  const localStorageData = localStorage.status === 'fulfilled' ? localStorage.value : null;
  const sessionStorageData = sessionStorage.status === 'fulfilled' ? sessionStorage.value : null;
  const indexedDBData = indexedDB.status === 'fulfilled' ? indexedDB.value : null;

  // Collect errors
  if (cookies.status === 'rejected') errors.push({ type: 'cookies', error: cookies.reason.message });
  if (localStorage.status === 'rejected') errors.push({ type: 'localStorage', error: localStorage.reason.message });
  if (sessionStorage.status === 'rejected') errors.push({ type: 'sessionStorage', error: sessionStorage.reason.message });
  if (indexedDB.status === 'rejected') errors.push({ type: 'indexedDB', error: indexedDB.reason.message });

  // Calculate totals
  const totalSize =
    (cookieData?.totalSize || 0) +
    (localStorageData?.totalSize || 0) +
    (sessionStorageData?.totalSize || 0) +
    (indexedDBData?.estimatedSize || 0);

  const totalItems =
    (cookieData?.totalCount || 0) +
    (localStorageData?.totalItems || 0) +
    (sessionStorageData?.totalItems || 0) +
    (indexedDBData?.totalDatabases || 0);

  const endTime = Date.now();
  const scanDuration = endTime - startTime;

  const results = {
    cookies: cookieData,
    localStorage: localStorageData,
    sessionStorage: sessionStorageData,
    indexedDB: indexedDBData,

    summary: {
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalItems,

      // Breakdown
      cookieCount: cookieData?.totalCount || 0,
      localStorageItems: localStorageData?.totalItems || 0,
      sessionStorageItems: sessionStorageData?.totalItems || 0,
      indexedDBDatabases: indexedDBData?.totalDatabases || 0,

      // Domain statistics
      uniqueDomains: new Set([
        ...Object.keys(cookieData?.byDomain || {}),
        ...Object.keys(localStorageData?.byDomain || {}),
        ...Object.keys(sessionStorageData?.byDomain || {}),
        ...Object.keys(indexedDBData?.byDomain || {})
      ]).size
    },

    metadata: {
      scanTime: new Date().toISOString(),
      scanDurationMs: scanDuration,
      version: '2.0.0',
      errors: errors.length > 0 ? errors : null
    }
  };

  debug.log(`✅ Complete storage scan finished in ${scanDuration}ms`);
  debug.log(`   Total: ${results.summary.totalSizeMB} MB across ${results.summary.totalItems} items`);
  debug.log(`   Domains: ${results.summary.uniqueDomains}`);

  return results;
}

/**
 * Legacy class-based interface for backward compatibility
 * @deprecated Use individual export functions instead
 */
export class StorageScanner {
  constructor() {
    debug.warn('StorageScanner class is deprecated. Use individual export functions instead.');
  }

  async scanAll() {
    return await scanAllStorage();
  }

  async scanCookies() {
    return await scanCookies();
  }
}

// Default export for convenience
export default {
  scanAllStorage,
  scanCookies,
  scanLocalStorage,
  scanSessionStorage,
  scanIndexedDB,
  StorageScanner // Legacy support
};
