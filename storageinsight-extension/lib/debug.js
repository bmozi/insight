/**
 * Debug utility for StorageInsight extension
 * Toggle debug mode via extension options or set DEBUG = true for development
 */

// Set to true during development, false for production
const DEBUG = false;

// Cache for debug setting from storage
let debugEnabled = DEBUG;

// Try to load debug setting from storage (async, updates cache)
if (typeof chrome !== 'undefined' && chrome.storage?.local) {
  chrome.storage.local.get(['debugMode'], (result) => {
    if (result.debugMode !== undefined) {
      debugEnabled = result.debugMode;
    }
  });
}

/**
 * Enable or disable debug mode programmatically
 * @param {boolean} enabled
 */
export function setDebugMode(enabled) {
  debugEnabled = enabled;
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ debugMode: enabled });
  }
}

/**
 * Check if debug mode is enabled
 * @returns {boolean}
 */
export function isDebugEnabled() {
  return debugEnabled;
}

/**
 * Debug logger - only logs when debug mode is enabled
 */
export const debug = {
  log: (...args) => {
    if (debugEnabled) console.log(...args);
  },
  warn: (...args) => {
    // Warnings always show (useful for user troubleshooting)
    console.warn(...args);
  },
  error: (...args) => {
    // Errors always show
    console.error(...args);
  },
  info: (...args) => {
    if (debugEnabled) console.info(...args);
  },
  debug: (...args) => {
    if (debugEnabled) console.debug(...args);
  }
};

// Default export for convenience
export default debug;
