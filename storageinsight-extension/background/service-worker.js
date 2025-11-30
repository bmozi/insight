/**
 * StorageInsight Service Worker (Background Script)
 * Complete Prompt 6 Implementation
 *
 * Features:
 * - Cookie monitoring with onChanged listener
 * - Activity log system (last 100 events)
 * - Complete message handling
 * - Badge updates with color coding
 * - Context menu integration
 * - Scheduled tasks (scans, cleanup, reports)
 * - Cookie blocking with declarativeNetRequest
 * - Error handling and logging
 */

// Import libraries
import { scanAllStorage, scanCookies, scanLocalStorage, scanSessionStorage, scanIndexedDB } from '../lib/storage-scanner.js';
import { analyzePrivacy, analyzePrivacyFromData } from '../lib/privacy-analyzer.js';
import { TrackingDatabase } from '../lib/tracking-database.js';

console.log('🚀 StorageInsight Service Worker starting...');

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let trackingDB = null;
let activityLog = [];
let settings = null;
let statistics = null;
let whitelist = [];

const MAX_ACTIVITY_LOG = 100;

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize on extension install or update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('✅ StorageInsight installed/updated', details);

  if (details.reason === 'install') {
    console.log('🎉 Welcome to StorageInsight!');
    await initializeExtension();

    // Show welcome notification
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../assets/icons/icon-128.png',
        title: 'Welcome to StorageInsight!',
        message: 'Click the extension icon to start scanning your browser storage.',
      });
    }
  } else if (details.reason === 'update') {
    console.log('🔄 Extension updated to version', chrome.runtime.getManifest().version);
  }

  // Create context menus
  createContextMenus();
});

// Initialize extension settings and perform first scan
async function initializeExtension() {
  try {
    // Initialize tracking database
    trackingDB = new TrackingDatabase();

    // Set default settings
    settings = {
      autoScanEnabled: true,
      scanFrequency: 300000, // 5 minutes in ms
      notifications: true,
      privacyThreshold: 70,
      blockingEnabled: false,
      lastScanTime: null,
    };

    statistics = {
      totalScans: 0,
      cookiesFound: 0,
      trackersBlocked: 0,
      lastScanDate: null,
    };

    activityLog = [];
    whitelist = [];

    await chrome.storage.local.set({
      settings,
      statistics,
      activityLog,
      whitelist,
    });

    // Set up alarms
    await setupAlarms();

    // Run initial scan
    console.log('🔍 Running initial scan...');
    await performScan();

    console.log('✅ Extension initialized with default settings');
  } catch (error) {
    logError(error, 'initializeExtension');
  }
}

// Set up periodic alarms
async function setupAlarms() {
  // Clear existing alarms
  await chrome.alarms.clearAll();

  // Periodic scan alarm (every 5 minutes by default)
  chrome.alarms.create('periodicScan', {
    delayInMinutes: 5,
    periodInMinutes: 5,
  });

  // Cleanup expired cookies (every hour)
  chrome.alarms.create('cleanupExpired', {
    delayInMinutes: 60,
    periodInMinutes: 60,
  });

  // Daily privacy report
  chrome.alarms.create('dailyReport', {
    delayInMinutes: 1440, // 24 hours
    periodInMinutes: 1440,
  });

  // Weekly cleanup
  chrome.alarms.create('weeklyCleanup', {
    delayInMinutes: 10080, // 7 days
    periodInMinutes: 10080,
  });

  console.log('⏰ Alarms configured');
}

// Load state from storage
async function loadState() {
  try {
    const result = await chrome.storage.local.get([
      'settings',
      'statistics',
      'activityLog',
      'whitelist',
    ]);

    settings = result.settings || settings;
    statistics = result.statistics || statistics;
    activityLog = result.activityLog || [];
    whitelist = result.whitelist || [];

    if (!trackingDB) {
      trackingDB = new TrackingDatabase();
    }
  } catch (error) {
    logError(error, 'loadState');
  }
}

// Initialize state on startup
loadState();

// ============================================================================
// COOKIE MONITORING
// ============================================================================

// Monitor cookie changes in real-time
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  try {
    const { cookie, removed, cause } = changeInfo;

    // Log activity
    await addActivity({
      type: removed ? 'cookie-removed' : 'cookie-added',
      name: cookie.name,
      domain: cookie.domain,
      cause: cause || 'unknown',
      timestamp: Date.now(),
    });

    // Check if it's a tracking cookie
    if (!removed && trackingDB && trackingDB.isTracker(cookie.domain)) {
      const category = trackingDB.categorize(cookie.domain);
      const riskLevel = trackingDB.getRiskLevel(cookie.domain);

      await addActivity({
        type: 'tracker-detected',
        name: cookie.name,
        domain: cookie.domain,
        category,
        riskLevel,
        timestamp: Date.now(),
      });

      // Update badge
      await updateBadge();

      // Send notification if enabled
      if (settings?.notifications && riskLevel === 'high') {
        notifyTracker(cookie, category);
      }
    }

    // Update badge count
    await updateBadge();
  } catch (error) {
    logError(error, 'cookies.onChanged');
  }
});

// ============================================================================
// ACTIVITY LOG SYSTEM
// ============================================================================

async function addActivity(activity) {
  try {
    activityLog.unshift({
      ...activity,
      id: Date.now() + Math.random(),
      timestamp: activity.timestamp || Date.now(),
    });

    // Keep only last 100 events
    if (activityLog.length > MAX_ACTIVITY_LOG) {
      activityLog = activityLog.slice(0, MAX_ACTIVITY_LOG);
    }

    // Persist to storage
    await chrome.storage.local.set({ activityLog });
  } catch (error) {
    logError(error, 'addActivity');
  }
}

async function getActivity(limit = 100) {
  await loadState();
  return activityLog.slice(0, limit);
}

async function clearActivity() {
  activityLog = [];
  await chrome.storage.local.set({ activityLog });
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message.action || message.type, 'from:', sender.tab?.url || 'extension');

  // Support both 'action' and 'type' for compatibility
  const action = message.action || message.type;

  // Handle different message types
  switch (action) {
    // Scanning
    case 'scan':
    case 'SCAN_STORAGE':
    case 'performScan':
      handleScan(sendResponse);
      return true;

    // Cookie operations
    case 'get-cookies':
    case 'GET_COOKIES':
      handleGetCookies(message.data, sendResponse);
      return true;

    case 'delete-cookie':
      handleDeleteCookie(message.data, sendResponse);
      return true;

    case 'delete-domain':
      handleDeleteDomain(message.data, sendResponse);
      return true;

    case 'clear-trackers':
    case 'CLEAR_TRACKING':
      handleClearTrackers(sendResponse);
      return true;

    case 'clear-all':
      handleClearAll(sendResponse);
      return true;

    // Specific recommendation actions
    case 'CLEAR_ADVERTISING':
      handleClearAdvertising(sendResponse);
      return true;

    case 'CLEAR_FINGERPRINTING':
      handleClearFingerprinting(sendResponse);
      return true;

    case 'CLEAR_FACEBOOK':
      handleClearFacebook(sendResponse);
      return true;

    case 'CLEAR_ANALYTICS':
      handleClearAnalytics(sendResponse);
      return true;

    case 'CLEAR_LONG_LIVED':
      handleClearLongLived(sendResponse);
      return true;

    case 'CLEAR_LOCALSTORAGE':
      handleClearLocalStorage(sendResponse);
      return true;

    // Statistics and activity
    case 'get-stats':
      handleGetStats(sendResponse);
      return true;

    case 'get-activity':
      handleGetActivity(message.data, sendResponse);
      return true;

    case 'clear-activity':
      handleClearActivity(sendResponse);
      return true;

    // Privacy analysis
    case 'ANALYZE_PRIVACY':
    case 'analyze-privacy':
      handlePrivacyAnalysis(sendResponse);
      return true;

    // Whitelist management
    case 'update-whitelist':
      handleUpdateWhitelist(message.data, sendResponse);
      return true;

    case 'add-to-whitelist':
      handleAddToWhitelist(message.data, sendResponse);
      return true;

    case 'remove-from-whitelist':
      handleRemoveFromWhitelist(message.data, sendResponse);
      return true;

    case 'get-whitelist':
      handleGetWhitelist(sendResponse);
      return true;

    // Settings
    case 'GET_SETTINGS':
    case 'get-settings':
      handleGetSettings(sendResponse);
      return true;

    case 'UPDATE_SETTINGS':
    case 'update-settings':
    case 'settingsUpdated':
      handleUpdateSettings(message.data || message.settings, sendResponse);
      return true;

    // Export
    case 'EXPORT_DATA':
    case 'export-data':
      handleExportData(sendResponse);
      return true;

    // Badge
    case 'update-badge':
      updateBadge().then(() => sendResponse({ success: true }));
      return true;

    case 'clear-badge':
      handleClearBadge(sendResponse);
      return true;

    // Page load tracking
    case 'PAGE_LOAD':
      handlePageLoad(message.data, sender, sendResponse);
      return true;

    default:
      console.warn('⚠️ Unknown message action:', action);
      sendResponse({ success: false, error: 'Unknown message action' });
  }
});

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

async function handleScan(sendResponse) {
  try {
    console.log('🔍 Starting storage scan...');

    const scanResults = await performScan();

    sendResponse({ success: true, data: scanResults });
  } catch (error) {
    logError(error, 'handleScan');
    sendResponse({ success: false, error: error.message });
  }
}

async function performScan() {
  try {
    // Scan all storage
    const scanResults = await scanAllStorage();

    // Perform privacy analysis on the pre-scanned data
    const privacyAnalysis = analyzePrivacyFromData(scanResults);

    // Transform to legacy format for compatibility
    const legacyFormat = {
      totalCookies: scanResults.summary.cookieCount,
      totalStorageMB: parseFloat(scanResults.summary.totalSizeMB),
      totalStorageBytes: scanResults.summary.totalSizeBytes,
      trackingCookies: (privacyAnalysis.breakdown?.byCategory?.Analytics || 0) +
                       (privacyAnalysis.breakdown?.byCategory?.Advertising || 0) +
                       (privacyAnalysis.breakdown?.byCategory?.Social || 0) +
                       (privacyAnalysis.breakdown?.byCategory?.Fingerprinting || 0),
      uniqueDomains: scanResults.summary.uniqueDomains,
      cookies: scanResults.cookies?.cookies || [],
      localStorage: scanResults.localStorage?.byDomain || {},
      sessionStorage: scanResults.sessionStorage?.byDomain || {},
      indexedDB: scanResults.indexedDB?.byDomain || {},
      storageBreakdown: [
        { name: 'Cookies', value: parseFloat((scanResults.cookies?.totalSize || 0) / (1024 * 1024)).toFixed(2), color: '#8b5cf6' },
        { name: 'Local Storage', value: parseFloat((scanResults.localStorage?.totalSize || 0) / (1024 * 1024)).toFixed(2), color: '#3b82f6' },
        { name: 'Session Storage', value: parseFloat((scanResults.sessionStorage?.totalSize || 0) / (1024 * 1024)).toFixed(2), color: '#06b6d4' },
        { name: 'IndexedDB', value: parseFloat((scanResults.indexedDB?.estimatedSize || 0) / (1024 * 1024)).toFixed(2), color: '#6366f1' }
      ],
      privacyScore: privacyAnalysis.privacyScore,
      summary: scanResults.summary,
      _detailed: scanResults,
      _privacyAnalysis: privacyAnalysis,
    };

    // Update statistics
    await loadState();
    statistics.totalScans = (statistics.totalScans || 0) + 1;
    statistics.cookiesFound = legacyFormat.totalCookies;
    statistics.lastScanDate = Date.now();
    await chrome.storage.local.set({ statistics });

    // Log activity
    await addActivity({
      type: 'scan-completed',
      cookiesFound: legacyFormat.totalCookies,
      trackersFound: legacyFormat.trackingCookies,
      privacyScore: privacyAnalysis.privacyScore,
    });

    // Update badge
    await updateBadge();

    // Auto-sync to web app (send legacyFormat which includes _privacyAnalysis)
    await syncToWebApp(legacyFormat);

    console.log('✅ Storage scan complete');
    return legacyFormat;
  } catch (error) {
    logError(error, 'performScan');
    throw error;
  }
}

async function handleGetCookies(data, sendResponse) {
  try {
    const { domain } = data || {};
    console.log('🍪 Getting cookies for:', domain || 'all domains');

    const cookies = await chrome.cookies.getAll(domain ? { domain } : {});
    sendResponse({ success: true, data: cookies });
  } catch (error) {
    logError(error, 'handleGetCookies');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteCookie(data, sendResponse) {
  try {
    const { name, domain, url: providedUrl } = data;

    if (!name || !domain) {
      throw new Error('Cookie name and domain are required');
    }

    const url = providedUrl || `http${domain.startsWith('.') ? 's' : ''}://${domain}/`;
    await chrome.cookies.remove({ url, name });

    await addActivity({
      type: 'cookie-deleted',
      name,
      domain,
    });

    console.log(`✅ Deleted cookie: ${name} from ${domain}`);
    sendResponse({ success: true });
  } catch (error) {
    logError(error, 'handleDeleteCookie');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteDomain(data, sendResponse) {
  try {
    const { domain } = data;

    if (!domain) {
      throw new Error('Domain is required');
    }

    const cookies = await chrome.cookies.getAll({ domain });
    let removedCount = 0;

    for (const cookie of cookies) {
      const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      await chrome.cookies.remove({ url, name: cookie.name });
      removedCount++;
    }

    await addActivity({
      type: 'domain-cleared',
      domain,
      count: removedCount,
    });

    console.log(`✅ Deleted ${removedCount} cookies from ${domain}`);
    sendResponse({ success: true, data: { removedCount } });
  } catch (error) {
    logError(error, 'handleDeleteDomain');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearTrackers(sendResponse) {
  try {
    console.log('🗑️ Clearing tracking cookies...');

    await loadState();
    const cookies = await chrome.cookies.getAll({});
    let removedCount = 0;

    for (const cookie of cookies) {
      // Skip whitelisted domains
      if (whitelist.includes(cookie.domain)) {
        continue;
      }

      // Check both domain-based and name-based tracking detection
      const isDomainTracker = trackingDB.isTracker(cookie.domain);
      const isNameTracker = trackingDB.isTrackingCookie(cookie);

      if (isDomainTracker || isNameTracker) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
        removedCount++;
      }
    }

    await addActivity({
      type: 'trackers-cleared',
      count: removedCount,
    });

    // Update statistics
    statistics.trackersBlocked = (statistics.trackersBlocked || 0) + removedCount;
    await chrome.storage.local.set({ statistics });

    console.log(`✅ Removed ${removedCount} tracking cookies`);
    sendResponse({ success: true, data: { removedCount } });
  } catch (error) {
    logError(error, 'handleClearTrackers');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearAll(sendResponse) {
  try {
    console.log('🗑️ Clearing all cookies...');

    const cookies = await chrome.cookies.getAll({});
    let removedCount = 0;

    for (const cookie of cookies) {
      // Skip whitelisted domains
      if (whitelist.includes(cookie.domain)) {
        continue;
      }

      const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      await chrome.cookies.remove({ url, name: cookie.name });
      removedCount++;
    }

    await addActivity({
      type: 'all-cookies-cleared',
      count: removedCount,
    });

    console.log(`✅ Removed ${removedCount} cookies`);
    sendResponse({ success: true, data: { removedCount } });
  } catch (error) {
    logError(error, 'handleClearAll');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearAdvertising(sendResponse) {
  try {
    console.log('🗑️ Clearing advertising cookies...');

    await loadState();
    const cookies = await chrome.cookies.getAll({});
    let removedCount = 0;

    // Advertising cookie name patterns
    const adPatterns = [/^DSID$/, /^IDE$/, /test_cookie/, /^c$/, /^bku$/, /^TapAd_/, /_cc_/, /_uetsid/, /_uetvid/];

    for (const cookie of cookies) {
      // Skip whitelisted domains
      if (whitelist.includes(cookie.domain)) {
        continue;
      }

      const category = trackingDB.categorize(cookie.domain);
      const nameMatchesAd = adPatterns.some(pattern => pattern.test(cookie.name));

      if (category === 'ADVERTISING' || nameMatchesAd) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
        removedCount++;
      }
    }

    await addActivity({
      type: 'advertising-cookies-cleared',
      count: removedCount,
    });

    console.log(`✅ Removed ${removedCount} advertising cookies`);
    sendResponse({ success: true, data: { removedCount } });
  } catch (error) {
    logError(error, 'handleClearAdvertising');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearFingerprinting(sendResponse) {
  try {
    console.log('🗑️ Clearing fingerprinting cookies...');

    await loadState();
    const cookies = await chrome.cookies.getAll({});
    let removedCount = 0;

    for (const cookie of cookies) {
      // Skip whitelisted domains
      if (whitelist.includes(cookie.domain)) {
        continue;
      }

      const category = trackingDB.categorize(cookie.domain);
      if (category === 'FINGERPRINTING') {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
        removedCount++;
      }
    }

    await addActivity({
      type: 'fingerprinting-cookies-cleared',
      count: removedCount,
    });

    console.log(`✅ Removed ${removedCount} fingerprinting cookies`);
    sendResponse({ success: true, data: { removedCount } });
  } catch (error) {
    logError(error, 'handleClearFingerprinting');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearFacebook(sendResponse) {
  try {
    console.log('🗑️ Clearing Facebook tracking cookies...');

    await loadState();
    const cookies = await chrome.cookies.getAll({});
    let removedCount = 0;

    // Facebook cookie name patterns (these can appear on any domain with Facebook Pixel)
    const fbPatterns = [/_fbp/, /_fbc/, /^fr$/, /^datr$/, /^sb$/, /^c_user$/, /^xs$/];

    for (const cookie of cookies) {
      // Skip whitelisted domains
      if (whitelist.includes(cookie.domain)) {
        continue;
      }

      // Check if domain contains facebook or fb
      const domain = cookie.domain.toLowerCase();
      const isDomainFacebook = domain.includes('facebook') || domain.includes('.fb.') || domain.endsWith('.fb.com');
      const nameMatchesFb = fbPatterns.some(pattern => pattern.test(cookie.name));

      if (isDomainFacebook || nameMatchesFb) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
        removedCount++;
      }
    }

    await addActivity({
      type: 'facebook-cookies-cleared',
      count: removedCount,
    });

    console.log(`✅ Removed ${removedCount} Facebook cookies`);
    sendResponse({ success: true, data: { removedCount } });
  } catch (error) {
    logError(error, 'handleClearFacebook');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearAnalytics(sendResponse) {
  try {
    console.log('🗑️ Clearing analytics cookies...');

    await loadState();
    const cookies = await chrome.cookies.getAll({});
    let removedCount = 0;

    // Analytics cookie name patterns
    const analyticsPatterns = [/_ga/, /_gid/, /_gat/, /__utm/, /_gcl_/, /^AMP_TOKEN$/, /_pk_/, /__qca/, /_hjid/, /^ajs_/, /^mp_/, /_kuid_/];

    for (const cookie of cookies) {
      // Skip whitelisted domains
      if (whitelist.includes(cookie.domain)) {
        continue;
      }

      const category = trackingDB.categorize(cookie.domain);
      const nameMatchesAnalytics = analyticsPatterns.some(pattern => pattern.test(cookie.name));

      if (category === 'ANALYTICS' || nameMatchesAnalytics) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
        removedCount++;
      }
    }

    await addActivity({
      type: 'analytics-cookies-cleared',
      count: removedCount,
    });

    console.log(`✅ Removed ${removedCount} analytics cookies`);
    sendResponse({ success: true, data: { removedCount } });
  } catch (error) {
    logError(error, 'handleClearAnalytics');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearLongLived(sendResponse) {
  try {
    console.log('🗑️ Clearing long-lived tracking cookies...');

    await loadState();
    const cookies = await chrome.cookies.getAll({});
    const oneYearFromNow = (Date.now() / 1000) + (365 * 24 * 60 * 60); // Chrome uses seconds
    let removedCount = 0;

    for (const cookie of cookies) {
      // Skip whitelisted domains and session cookies
      if (whitelist.includes(cookie.domain) || cookie.session) {
        continue;
      }

      // Check if it's a tracking cookie (by domain OR by name pattern) and long-lived (>1 year)
      const isTracking = trackingDB.isTracker(cookie.domain) || trackingDB.isTrackingCookie(cookie);

      if (isTracking &&
          cookie.expirationDate &&
          cookie.expirationDate > oneYearFromNow) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
        removedCount++;
      }
    }

    await addActivity({
      type: 'long-lived-cookies-cleared',
      count: removedCount,
    });

    console.log(`✅ Removed ${removedCount} long-lived cookies`);
    sendResponse({ success: true, data: { removedCount } });
  } catch (error) {
    logError(error, 'handleClearLongLived');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearLocalStorage(sendResponse) {
  try {
    console.log('🗑️ Clearing excessive localStorage...');

    // Note: We can't directly clear localStorage from the service worker
    // We can only suggest clearing it or use the browsingData API
    const result = await chrome.browsingData.remove(
      {},
      { localStorage: true }
    );

    await addActivity({
      type: 'localstorage-cleared',
      count: 1,
    });

    console.log('✅ LocalStorage cleared');
    sendResponse({ success: true, data: { removedCount: 1 } });
  } catch (error) {
    logError(error, 'handleClearLocalStorage');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetStats(sendResponse) {
  try {
    await loadState();

    // Get current cookie count
    const cookies = await chrome.cookies.getAll({});
    const trackerCount = cookies.filter(c => trackingDB.isTracker(c.domain)).length;

    const stats = {
      ...statistics,
      currentCookies: cookies.length,
      currentTrackers: trackerCount,
      activityCount: activityLog.length,
      whitelistCount: whitelist.length,
    };

    sendResponse({ success: true, data: stats });
  } catch (error) {
    logError(error, 'handleGetStats');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetActivity(data, sendResponse) {
  try {
    const { limit = 100 } = data || {};
    const activity = await getActivity(limit);
    sendResponse({ success: true, data: activity });
  } catch (error) {
    logError(error, 'handleGetActivity');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearActivity(sendResponse) {
  try {
    await clearActivity();
    sendResponse({ success: true });
  } catch (error) {
    logError(error, 'handleClearActivity');
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePrivacyAnalysis(sendResponse) {
  try {
    console.log('🛡️ Running privacy analysis...');

    const scanResults = await scanAllStorage();
    const analysis = analyzePrivacyFromData(scanResults);

    sendResponse({ success: true, data: analysis });
  } catch (error) {
    logError(error, 'handlePrivacyAnalysis');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateWhitelist(data, sendResponse) {
  try {
    whitelist = data.whitelist || data;
    await chrome.storage.local.set({ whitelist });

    await addActivity({
      type: 'whitelist-updated',
      count: whitelist.length,
    });

    // Update blocking rules if enabled
    if (settings?.blockingEnabled) {
      await updateBlockingRules();
    }

    console.log('✅ Whitelist updated:', whitelist.length, 'domains');
    sendResponse({ success: true });
  } catch (error) {
    logError(error, 'handleUpdateWhitelist');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAddToWhitelist(data, sendResponse) {
  try {
    const { domain } = data;

    if (!domain) {
      throw new Error('Domain is required');
    }

    await loadState();

    if (!whitelist.includes(domain)) {
      whitelist.push(domain);
      await chrome.storage.local.set({ whitelist });

      await addActivity({
        type: 'domain-whitelisted',
        domain,
      });

      // Update blocking rules
      if (settings?.blockingEnabled) {
        await updateBlockingRules();
      }
    }

    console.log(`✅ Added ${domain} to whitelist`);
    sendResponse({ success: true });
  } catch (error) {
    logError(error, 'handleAddToWhitelist');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRemoveFromWhitelist(data, sendResponse) {
  try {
    const { domain } = data;

    if (!domain) {
      throw new Error('Domain is required');
    }

    await loadState();

    whitelist = whitelist.filter(d => d !== domain);
    await chrome.storage.local.set({ whitelist });

    await addActivity({
      type: 'domain-removed-from-whitelist',
      domain,
    });

    // Update blocking rules
    if (settings?.blockingEnabled) {
      await updateBlockingRules();
    }

    console.log(`✅ Removed ${domain} from whitelist`);
    sendResponse({ success: true });
  } catch (error) {
    logError(error, 'handleRemoveFromWhitelist');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetWhitelist(sendResponse) {
  try {
    await loadState();
    sendResponse({ success: true, data: whitelist });
  } catch (error) {
    logError(error, 'handleGetWhitelist');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetSettings(sendResponse) {
  try {
    await loadState();
    sendResponse({ success: true, data: { settings, statistics } });
  } catch (error) {
    logError(error, 'handleGetSettings');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateSettings(data, sendResponse) {
  try {
    await loadState();

    const oldSettings = { ...settings };
    settings = { ...settings, ...data };
    await chrome.storage.local.set({ settings });

    await addActivity({
      type: 'settings-updated',
    });

    // If blocking setting changed, update rules
    if (oldSettings.blockingEnabled !== settings.blockingEnabled) {
      await updateBlockingRules();
    }

    // If scan frequency changed, update alarms
    if (oldSettings.scanFrequency !== settings.scanFrequency) {
      await setupAlarms();
    }

    console.log('✅ Settings updated:', settings);
    sendResponse({ success: true });
  } catch (error) {
    logError(error, 'handleUpdateSettings');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleExportData(sendResponse) {
  try {
    console.log('📤 Exporting data...');

    const scanResults = await scanAllStorage();
    const privacyAnalysis = analyzePrivacyFromData(scanResults);

    const exportData = {
      timestamp: new Date().toISOString(),
      version: chrome.runtime.getManifest().version,
      scannerVersion: '2.0.0',
      data: scanResults,
      privacyAnalysis,
      statistics,
      settings,
      activityLog: activityLog.slice(0, 50), // Last 50 activities
      whitelist,
    };

    sendResponse({ success: true, data: exportData });
  } catch (error) {
    logError(error, 'handleExportData');
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearBadge(sendResponse) {
  try {
    await chrome.action.setBadgeText({ text: '' });
    sendResponse({ success: true });
  } catch (error) {
    logError(error, 'handleClearBadge');
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePageLoad(data, sender, sendResponse) {
  try {
    const { url, domain, localStorage, sessionStorage, cookies } = data || {};

    console.log(`📄 Page loaded: ${url || 'unknown'}`);

    // Log the page visit activity
    await addActivity({
      type: 'page-loaded',
      url: url,
      domain: domain,
      storageSnapshot: {
        localStorageItems: localStorage?.itemCount || 0,
        sessionStorageItems: sessionStorage?.itemCount || 0,
        cookieCount: cookies?.count || 0,
        totalSize: (localStorage?.totalSize || 0) + (sessionStorage?.totalSize || 0) + (cookies?.totalSize || 0),
      },
    });

    // Update badge for the current tab
    await updateBadge();

    sendResponse({ success: true });
  } catch (error) {
    logError(error, 'handlePageLoad');
    sendResponse({ success: false, error: error.message });
  }
}

// ============================================================================
// BADGE UPDATES
// ============================================================================

async function updateBadge() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }

    const url = new URL(tab.url);
    const cookies = await chrome.cookies.getAll({ domain: url.hostname });

    await loadState();

    // Count trackers
    const trackerCount = cookies.filter(cookie => {
      return trackingDB.isTracker(cookie.domain) && !whitelist.includes(cookie.domain);
    }).length;

    // Color coding: green (0), yellow (1-10), red (>10)
    let color;
    if (trackerCount === 0) {
      color = '#22c55e'; // Green
      await chrome.action.setBadgeText({ text: '' }); // No badge if 0
    } else if (trackerCount <= 10) {
      color = '#eab308'; // Yellow
      await chrome.action.setBadgeText({ text: trackerCount.toString() });
    } else {
      color = '#ef4444'; // Red
      await chrome.action.setBadgeText({ text: trackerCount.toString() });
    }

    await chrome.action.setBadgeBackgroundColor({ color });
  } catch (error) {
    logError(error, 'updateBadge');
  }
}

// Update badge when tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateBadge();
});

// Update badge when tab URL updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await updateBadge();
  }
});

// ============================================================================
// CONTEXT MENU
// ============================================================================

function createContextMenus() {
  try {
    // Remove existing menus
    chrome.contextMenus.removeAll(() => {
      // Scan this page
      chrome.contextMenus.create({
        id: 'scanPage',
        title: 'Scan this page',
        contexts: ['page', 'frame'],
      });

      // Clear cookies for this site
      chrome.contextMenus.create({
        id: 'clearCookies',
        title: 'Clear cookies for this site',
        contexts: ['page', 'frame'],
      });

      // Add to whitelist
      chrome.contextMenus.create({
        id: 'addWhitelist',
        title: 'Add to whitelist',
        contexts: ['page', 'frame'],
      });

      // Separator
      chrome.contextMenus.create({
        id: 'separator',
        type: 'separator',
        contexts: ['page', 'frame'],
      });

      // Open dashboard
      chrome.contextMenus.create({
        id: 'openDashboard',
        title: 'Open StorageInsight Dashboard',
        contexts: ['page', 'frame', 'browser_action'],
      });

      console.log('✅ Context menus created');
    });
  } catch (error) {
    logError(error, 'createContextMenus');
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (!tab?.url) return;

    const url = new URL(tab.url);
    const domain = url.hostname;

    switch (info.menuItemId) {
      case 'scanPage':
        console.log('🔍 Context menu: Scan page -', domain);
        await performScan();

        // Show notification
        if (chrome.notifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '../assets/icons/icon-128.png',
            title: 'Scan Complete',
            message: `Scanned ${domain}`,
          });
        }
        break;

      case 'clearCookies':
        console.log('🗑️ Context menu: Clear cookies -', domain);
        const cookies = await chrome.cookies.getAll({ domain });

        for (const cookie of cookies) {
          const cookieUrl = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
          await chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
        }

        await addActivity({
          type: 'domain-cleared-via-context-menu',
          domain,
          count: cookies.length,
        });

        // Show notification
        if (chrome.notifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '../assets/icons/icon-128.png',
            title: 'Cookies Cleared',
            message: `Removed ${cookies.length} cookies from ${domain}`,
          });
        }
        break;

      case 'addWhitelist':
        console.log('✅ Context menu: Add to whitelist -', domain);
        await loadState();

        if (!whitelist.includes(domain)) {
          whitelist.push(domain);
          await chrome.storage.local.set({ whitelist });

          await addActivity({
            type: 'domain-whitelisted-via-context-menu',
            domain,
          });

          // Show notification
          if (chrome.notifications) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: '../assets/icons/icon-128.png',
              title: 'Domain Whitelisted',
              message: `${domain} added to whitelist`,
            });
          }
        }
        break;

      case 'openDashboard':
        console.log('📊 Context menu: Open dashboard');
        // Open web app dashboard
        chrome.tabs.create({ url: 'http://localhost:3000' });
        break;
    }
  } catch (error) {
    logError(error, 'contextMenus.onClicked');
  }
});

// ============================================================================
// SCHEDULED TASKS
// ============================================================================

chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('⏰ Alarm triggered:', alarm.name);

  try {
    await loadState();

    switch (alarm.name) {
      case 'periodicScan':
        if (settings?.autoScanEnabled) {
          console.log('🔄 Running periodic scan...');
          await performScan();
        }
        break;

      case 'cleanupExpired':
        console.log('🧹 Cleaning up expired cookies...');
        await cleanupExpiredCookies();
        break;

      case 'dailyReport':
        console.log('📊 Generating daily report...');
        await generateDailyReport();
        break;

      case 'weeklyCleanup':
        console.log('🗑️ Running weekly cleanup...');
        await performWeeklyCleanup();
        break;
    }
  } catch (error) {
    logError(error, 'alarms.onAlarm');
  }
});

async function cleanupExpiredCookies() {
  try {
    const cookies = await chrome.cookies.getAll({});
    const now = Date.now() / 1000; // Chrome uses seconds
    let removedCount = 0;

    for (const cookie of cookies) {
      // Skip session cookies and whitelisted domains
      if (cookie.session || whitelist.includes(cookie.domain)) {
        continue;
      }

      // Check if expired
      if (cookie.expirationDate && cookie.expirationDate < now) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({ url, name: cookie.name });
        removedCount++;
      }
    }

    await addActivity({
      type: 'expired-cookies-cleaned',
      count: removedCount,
    });

    console.log(`✅ Cleaned up ${removedCount} expired cookies`);
  } catch (error) {
    logError(error, 'cleanupExpiredCookies');
  }
}

async function generateDailyReport() {
  try {
    const scanResults = await scanAllStorage();
    const privacyAnalysis = analyzePrivacyFromData(scanResults);

    const report = {
      date: new Date().toISOString(),
      privacyScore: privacyAnalysis.privacyScore,
      totalCookies: scanResults.summary.cookieCount,
      trackers: (privacyAnalysis.breakdown?.byCategory?.Analytics || 0) +
                (privacyAnalysis.breakdown?.byCategory?.Advertising || 0) +
                (privacyAnalysis.breakdown?.byCategory?.Social || 0) +
                (privacyAnalysis.breakdown?.byCategory?.Fingerprinting || 0),
      recommendations: privacyAnalysis.recommendations,
      highRiskItems: privacyAnalysis.highRiskItems,
    };

    await addActivity({
      type: 'daily-report-generated',
      privacyScore: report.privacyScore,
      trackers: report.trackers,
    });

    // Show notification if privacy score is low
    if (settings?.notifications && report.privacyScore < settings.privacyThreshold) {
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '../assets/icons/icon-128.png',
          title: 'Privacy Alert',
          message: `Your privacy score is ${report.privacyScore}/100. ${report.trackers} trackers detected.`,
        });
      }
    }

    console.log('✅ Daily report generated:', report);
  } catch (error) {
    logError(error, 'generateDailyReport');
  }
}

async function performWeeklyCleanup() {
  try {
    await loadState();

    // Clear old activity logs (keep only last 100)
    if (activityLog.length > MAX_ACTIVITY_LOG) {
      activityLog = activityLog.slice(0, MAX_ACTIVITY_LOG);
      await chrome.storage.local.set({ activityLog });
    }

    // Remove tracking cookies if auto-cleanup enabled
    if (settings?.autoScanEnabled) {
      await handleClearTrackers((result) => {
        console.log('✅ Weekly cleanup:', result);
      });
    }

    await addActivity({
      type: 'weekly-cleanup-completed',
    });

    console.log('✅ Weekly cleanup completed');
  } catch (error) {
    logError(error, 'performWeeklyCleanup');
  }
}

// ============================================================================
// COOKIE BLOCKING (OPTIONAL)
// ============================================================================

async function updateBlockingRules() {
  try {
    await loadState();

    // Check if blocking is enabled
    if (!settings?.blockingEnabled) {
      // Remove all dynamic rules
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIds = existingRules.map(rule => rule.id);

      if (ruleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIds,
        });
      }

      console.log('🚫 Cookie blocking disabled');
      return;
    }

    // Get all tracking domains
    const trackingDomains = [];
    for (const category of ['ANALYTICS', 'ADVERTISING', 'SOCIAL', 'FINGERPRINTING']) {
      const domains = trackingDB.trackingDomains[category] || [];
      trackingDomains.push(...domains);
    }

    // Filter out whitelisted domains
    const blockedDomains = trackingDomains.filter(domain => !whitelist.includes(domain));

    // Create rules (max 5000 dynamic rules)
    const rules = blockedDomains.slice(0, 5000).map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{
          header: 'set-cookie',
          operation: 'remove',
        }],
      },
      condition: {
        urlFilter: `*://${domain}/*`,
        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script'],
      },
    }));

    // Remove old rules and add new ones
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: rules,
    });

    await addActivity({
      type: 'blocking-rules-updated',
      count: rules.length,
    });

    console.log(`✅ Blocking ${rules.length} tracking domains`);
  } catch (error) {
    logError(error, 'updateBlockingRules');
  }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function notifyTracker(cookie, category) {
  try {
    if (!chrome.notifications) return;

    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../assets/icons/icon-128.png',
      title: 'Tracker Detected',
      message: `${category} tracker from ${cookie.domain}`,
    });
  } catch (error) {
    logError(error, 'notifyTracker');
  }
}

// ============================================================================
// WEB APP SYNC
// ============================================================================

async function syncToWebApp(scanResults) {
  try {
    console.log('🔄 Attempting to sync data to web app...');

    const tabs = await chrome.tabs.query({
      url: ['http://localhost:3000/*', 'https://localhost:3000/*']
    });

    if (tabs.length === 0) {
      console.log('⚠️ Web app not open - skipping sync');
      return { success: false, reason: 'Web app not open' };
    }

    const tabId = tabs[0].id;

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (data) => {
        window.postMessage({
          source: 'storageinsight-extension',
          type: 'SCAN_DATA',
          payload: data,
          timestamp: Date.now()
        }, window.location.origin);
      },
      args: [scanResults]
    });

    console.log('✅ Data synced to web app successfully');
    return { success: true };
  } catch (error) {
    logError(error, 'syncToWebApp');
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ERROR HANDLING & LOGGING
// ============================================================================

function logError(error, context) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: Date.now(),
  };

  console.error(`❌ Error in ${context}:`, errorLog);

  // Store error for debugging (keep last 50 errors)
  chrome.storage.local.get('errorLog', (result) => {
    let errors = result.errorLog || [];
    errors.unshift(errorLog);

    if (errors.length > 50) {
      errors = errors.slice(0, 50);
    }

    chrome.storage.local.set({ errorLog: errors });
  });

  // Show notification for critical errors
  if (isCriticalError(error)) {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../assets/icons/icon-128.png',
        title: 'StorageInsight Error',
        message: `Error in ${context}: ${error.message}`,
      });
    }
  }
}

function isCriticalError(error) {
  // Define critical error patterns
  const criticalPatterns = [
    /permission/i,
    /quota/i,
    /storage/i,
  ];

  return criticalPatterns.some(pattern => pattern.test(error.message));
}

// ============================================================================
// STARTUP
// ============================================================================

console.log('✅ StorageInsight Service Worker ready!');
console.log('📊 Version:', chrome.runtime.getManifest().version);
console.log('🔧 Features enabled: Cookie monitoring, Activity log, Badge updates, Context menu, Scheduled tasks, Cookie blocking');
