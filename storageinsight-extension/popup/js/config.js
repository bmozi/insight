/**
 * StorageInsight Configuration Constants
 * Centralized configuration for the popup UI
 *
 * This module uses the revealing module pattern to expose configuration
 * constants while keeping the actual config object private and immutable.
 */

// ============================================================================
// DEBUG UTILITY (loaded first, available to all popup scripts)
// ============================================================================
let _debugEnabled = false;
try {
  chrome.storage.local.get(['debugMode'], (r) => { _debugEnabled = r?.debugMode || false; });
} catch (e) { /* ignore */ }
const debug = {
  log: (...args) => { if (_debugEnabled) console.log(...args); },
  warn: (...args) => { console.warn(...args); },
  error: (...args) => { console.error(...args); }
};

const StorageInsightConfig = (function() {
  'use strict';

  // Private configuration object
  const config = {
    // ============================================================
    // PAGINATION SETTINGS
    // ============================================================

    /** Number of cookies to display per page in Cookie Browser */
    COOKIE_PAGE_SIZE: 20,

    /** Number of domains to display per page in Domain Explorer */
    DOMAIN_PAGE_SIZE: 15,

    /** Number of IndexedDB records to display per page */
    IDB_PAGE_SIZE: 50,

    // ============================================================
    // SCAN & HISTORY LIMITS
    // ============================================================

    /** Maximum number of scan records to keep in history */
    MAX_SCAN_HISTORY: 100,

    /** Maximum number of recent scans to display in history view */
    MAX_RECENT_SCANS_DISPLAY: 10,

    // ============================================================
    // PREVIEW & DISPLAY LIMITS
    // ============================================================

    /** Maximum number of cookies to show in domain preview (Cookie Browser) */
    MAX_COOKIES_PREVIEW: 10,

    /** Maximum number of storage keys to show in domain preview (Storage page) */
    MAX_KEYS_PREVIEW: 10,

    /** Maximum number of domains to show for tracking companies */
    MAX_TRACKER_DOMAINS_PREVIEW: 3,

    /** Maximum number of recommendations to display */
    MAX_RECOMMENDATIONS_DISPLAY: 5,

    /** Maximum number of items to show in recommendation details */
    MAX_RECOMMENDATION_ITEMS: 8,

    /** Maximum number of detail items to show per recommendation */
    MAX_RECOMMENDATION_DETAILS: 10,

    // ============================================================
    // TIMEOUT SETTINGS (milliseconds)
    // ============================================================

    /** Maximum time to wait for a storage scan to complete */
    SCAN_TIMEOUT: 15000,

    /** Duration to display status messages before auto-hiding */
    STATUS_DISPLAY_DURATION: 3000,

    /** Delay before triggering automatic rescan after clearing data */
    RESCAN_DELAY: 500,

    // ============================================================
    // STORAGE QUOTA
    // ============================================================

    /** Estimated browser storage quota (50MB) - realistic for localStorage/cookies */
    ESTIMATED_QUOTA_BYTES: 50 * 1024 * 1024,

    /** Bytes per kilobyte */
    BYTES_PER_KB: 1024,

    /** Bytes per megabyte */
    BYTES_PER_MB: 1024 * 1024,

    /** Bytes per gigabyte */
    BYTES_PER_GB: 1024 * 1024 * 1024,

    // ============================================================
    // UI CONSTRAINTS
    // ============================================================

    /** Maximum percentage value for progress bars */
    MAX_PERCENTAGE: 100,

    /** Minimum number of pages (always at least 1) */
    MIN_PAGES: 1
  };

  // Freeze the config object to prevent modifications
  Object.freeze(config);

  // Public API
  return {
    /**
     * Get a configuration value by key
     * @param {string} key - The configuration key
     * @returns {*} The configuration value, or undefined if key doesn't exist
     */
    get(key) {
      return config[key];
    },

    /**
     * Get all configuration values as a shallow copy
     * @returns {Object} A copy of all configuration values
     */
    getAll() {
      return { ...config };
    },

    /**
     * Check if a configuration key exists
     * @param {string} key - The configuration key to check
     * @returns {boolean} True if the key exists
     */
    has(key) {
      return key in config;
    },

    /**
     * Get all configuration keys
     * @returns {string[]} Array of all configuration keys
     */
    keys() {
      return Object.keys(config);
    }
  };
})();

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageInsightConfig;
}
