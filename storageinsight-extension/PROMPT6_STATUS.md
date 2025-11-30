# Prompt 6: Background Service Worker

## Status: ⚠️ **PARTIALLY IMPLEMENTED**

**Date:** 2025-11-24

## Overview

The background service worker (`background/service-worker.js`) has **basic functionality** but is **missing many Prompt 6 requirements**. Current implementation is approximately **40% complete**.

**Current File:** `background/service-worker.js` (343 lines)
**Required:** ~800-1000 lines for full Prompt 6 implementation

## What Exists

### ✅ 1. Initialization (Partial)

**Implemented:**
- ✅ `chrome.runtime.onInstalled` listener exists (line 14)
- ✅ Default settings saved to chrome.storage.local (line 30-43)
- ✅ Tracking database imported (line 9)
- ✅ Daily scan alarm created (line 46-49)

**Missing:**
- ❌ Initial scan not triggered on install
- ❌ Tracking database not initialized in memory
- ❌ No welcome notification
- ❌ No first-run tutorial trigger

**Code Present:**
```javascript
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    initializeExtension();
  }
});

async function initializeExtension() {
  await chrome.storage.local.set({
    settings: {
      scanFrequency: 'manual',
      autoScanEnabled: false,
      notifications: true,
      privacyThreshold: 70,
    }
  });
}
```

### ❌ 2. Cookie Monitoring (NOT IMPLEMENTED)

**Status:** Completely missing

**Required:**
- ❌ `chrome.cookies.onChanged` listener
- ❌ Log all cookie changes (set, removed, expired)
- ❌ Check new cookies against tracking database
- ❌ Store activity log (last 100 events)
- ❌ Update badge count on new trackers
- ❌ Real-time tracker detection

**What's Needed:**
```javascript
// NOT IMPLEMENTED
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  // Log cookie change
  // Check if tracking cookie
  // Update activity log
  // Update badge if tracker detected
});
```

### ⚠️ 3. Message Handling (30% Complete)

**Implemented:**
- ✅ `chrome.runtime.onMessage` listener (line 58)
- ✅ `SCAN_STORAGE` - trigger full scan (line 63)
- ✅ `GET_COOKIES` - get cookies (line 67)
- ✅ `ANALYZE_PRIVACY` - run privacy analysis (line 71)
- ✅ `CLEAR_TRACKING` - delete tracking cookies (line 75)
- ✅ `EXPORT_DATA` - export data (line 79)
- ✅ `GET_SETTINGS` - get settings (line 83)
- ✅ `UPDATE_SETTINGS` - update settings (line 87)

**Missing:**
- ❌ `delete-cookie` - Delete specific cookie
- ❌ `delete-domain` - Delete all cookies for domain
- ❌ `get-stats` - Return current statistics
- ❌ `get-activity` - Return activity log
- ❌ `update-whitelist` - Modify whitelist
- ❌ `clear-all` - Clear all cookies
- ❌ `add-to-whitelist` - Add domain to whitelist
- ❌ `remove-from-whitelist` - Remove from whitelist
- ❌ `performScan` - Used by options page (needed for compatibility)

**Message Type Mapping:**

| Prompt 6 Name | Current Name | Status |
|---------------|--------------|--------|
| `scan` | `SCAN_STORAGE` | ✅ Exists (different name) |
| `delete-cookie` | - | ❌ Missing |
| `delete-domain` | - | ❌ Missing |
| `clear-trackers` | `CLEAR_TRACKING` | ✅ Exists (different name) |
| `get-stats` | - | ❌ Missing |
| `get-activity` | - | ❌ Missing |
| `update-whitelist` | - | ❌ Missing |

### ⚠️ 4. Scheduled Tasks (40% Complete)

**Implemented:**
- ✅ `chrome.alarms.create` for daily scan (line 46-49)
- ✅ `chrome.alarms.onAlarm` listener (line 251)
- ✅ Conditional execution based on `autoScanEnabled` setting (line 257)

**Missing:**
- ❌ Auto-delete expired cookies
- ❌ Cleanup based on user-defined frequency settings
- ❌ Weekly/monthly cleanup schedules
- ❌ Generate daily/weekly privacy reports
- ❌ Scheduled whitelist cleanup
- ❌ Multiple alarm types (cleanup, report, etc.)

**Current Code:**
```javascript
chrome.alarms.create('dailyScan', {
  delayInMinutes: 1440,
  periodInMinutes: 1440,
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyScan' && settings?.autoScanEnabled) {
    // Only handles daily scan
  }
});
```

**Needed Alarms:**
- `dailyScan` ✅ (exists)
- `weeklyReport` ❌
- `cleanupExpired` ❌
- `privacyReport` ❌

### ❌ 5. Cookie Blocking (NOT IMPLEMENTED)

**Status:** Completely missing

**Required:**
- ❌ Use `chrome.declarativeNetRequest` for MV3
- ❌ Block cookies from blacklisted domains
- ❌ Allow users to toggle blocking on/off
- ❌ Dynamic rules for blocking
- ❌ Whitelist exceptions

**What's Needed:**
```javascript
// NOT IMPLEMENTED
chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [...],
  removeRuleIds: [...]
});
```

**Note:** This is optional per Prompt 6 spec, but would be a major feature.

### ⚠️ 6. Badge Updates (50% Complete)

**Implemented:**
- ✅ Update badge text with count (line 288)
- ✅ Badge background color (line 289)
- ✅ Badge updates on tab activation (line 267-280)

**Missing:**
- ❌ Color coding: green (0), yellow (1-10), red (>10)
- ❌ Badge shows tracker count (currently shows all cookies)
- ❌ Clear badge after user acknowledges
- ❌ Badge animation/notification
- ❌ Persistent badge state

**Current Code:**
```javascript
async function updateBadgeForDomain(domain) {
  const cookies = await chrome.cookies.getAll({ domain });
  const count = cookies.length;

  await chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#8b5cf6' }); // Always purple
}
```

**Required Logic:**
```javascript
// NOT IMPLEMENTED
const trackerCount = cookies.filter(isTracker).length;
const color = trackerCount === 0 ? '#22c55e' : // green
              trackerCount <= 10 ? '#eab308' : // yellow
              '#ef4444'; // red
```

### ❌ 7. Context Menu (NOT IMPLEMENTED)

**Status:** Completely missing

**Required:**
- ❌ Right-click menu option "Scan this page"
- ❌ "Clear cookies for this site"
- ❌ "Add to whitelist"
- ❌ Context menu creation
- ❌ Context menu click handlers

**What's Needed:**
```javascript
// NOT IMPLEMENTED
chrome.contextMenus.create({
  id: 'scanPage',
  title: 'Scan this page',
  contexts: ['page']
});

chrome.contextMenus.create({
  id: 'clearCookies',
  title: 'Clear cookies for this site',
  contexts: ['page']
});

chrome.contextMenus.create({
  id: 'addWhitelist',
  title: 'Add to whitelist',
  contexts: ['page']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Handle clicks
});
```

## Implementation Completeness

### Feature Breakdown

| Feature | Status | Completion % | Lines Needed |
|---------|--------|--------------|--------------|
| 1. Initialization | ⚠️ Partial | 70% | +50 lines |
| 2. Cookie Monitoring | ❌ Missing | 0% | +150 lines |
| 3. Message Handling | ⚠️ Partial | 30% | +200 lines |
| 4. Scheduled Tasks | ⚠️ Partial | 40% | +100 lines |
| 5. Cookie Blocking | ❌ Missing | 0% | +200 lines (optional) |
| 6. Badge Updates | ⚠️ Partial | 50% | +50 lines |
| 7. Context Menu | ❌ Missing | 0% | +100 lines |
| **Overall** | **⚠️ Partial** | **~40%** | **+850 lines** |

### Current vs Required

**Current State:**
- File size: 343 lines
- Message types: 8 handlers
- Alarms: 1 type (daily scan)
- Listeners: 3 (onInstalled, onMessage, onAlarm, onActivated)
- Badge: Basic count display
- Context menu: None

**Required for Prompt 6:**
- File size: ~1,200 lines (estimate)
- Message types: 15+ handlers
- Alarms: 4+ types (scan, cleanup, report, etc.)
- Listeners: 6+ (add onChanged, contextMenus, etc.)
- Badge: Color-coded tracker count
- Context menu: 3+ items

## What Needs to Be Added

### Priority 1: Essential Features

1. **Cookie Monitoring System** (~150 lines)
   ```javascript
   // Activity log structure
   const activityLog = [];
   const MAX_ACTIVITY_LOG = 100;

   chrome.cookies.onChanged.addListener(async (changeInfo) => {
     const { cookie, removed, cause } = changeInfo;

     // Log activity
     addActivity({
       type: removed ? 'removed' : 'added',
       cookie: cookie.name,
       domain: cookie.domain,
       timestamp: Date.now(),
       cause,
     });

     // Check if tracking cookie
     const trackingDb = new TrackingDatabase();
     if (trackingDb.isTracker(cookie.domain)) {
       // Update badge
       await updateTrackerBadge();

       // Notify if enabled
       if (settings.notifications) {
         notifyNewTracker(cookie);
       }
     }
   });
   ```

2. **Complete Message Handlers** (~200 lines)
   ```javascript
   case 'delete-cookie':
     await handleDeleteCookie(message.data, sendResponse);
     return true;

   case 'delete-domain':
     await handleDeleteDomain(message.data, sendResponse);
     return true;

   case 'get-stats':
     await handleGetStats(sendResponse);
     return true;

   case 'get-activity':
     await handleGetActivity(sendResponse);
     return true;

   case 'update-whitelist':
     await handleUpdateWhitelist(message.data, sendResponse);
     return true;

   case 'performScan': // For options page
     await handleStorageScan(sendResponse);
     return true;
   ```

3. **Badge Color Coding** (~50 lines)
   ```javascript
   async function updateTrackerBadge() {
     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
     if (!tab?.url) return;

     const url = new URL(tab.url);
     const cookies = await chrome.cookies.getAll({ domain: url.hostname });

     const trackingDb = new TrackingDatabase();
     const trackerCount = cookies.filter(c => trackingDb.isTracker(c.domain)).length;

     // Color coding
     let color;
     if (trackerCount === 0) {
       color = '#22c55e'; // Green
     } else if (trackerCount <= 10) {
       color = '#eab308'; // Yellow
     } else {
       color = '#ef4444'; // Red
     }

     await chrome.action.setBadgeText({
       text: trackerCount > 0 ? trackerCount.toString() : ''
     });
     await chrome.action.setBadgeBackgroundColor({ color });
   }
   ```

### Priority 2: Important Features

4. **Context Menu** (~100 lines)
   ```javascript
   // Create context menu items
   chrome.runtime.onInstalled.addListener(() => {
     chrome.contextMenus.create({
       id: 'scanPage',
       title: 'Scan this page',
       contexts: ['page']
     });

     chrome.contextMenus.create({
       id: 'clearCookies',
       title: 'Clear cookies for this site',
       contexts: ['page']
     });

     chrome.contextMenus.create({
       id: 'addWhitelist',
       title: 'Add to whitelist',
       contexts: ['page']
     });
   });

   chrome.contextMenus.onClicked.addListener(async (info, tab) => {
     const url = new URL(tab.url);

     switch (info.menuItemId) {
       case 'scanPage':
         // Trigger scan for this page
         break;
       case 'clearCookies':
         // Clear cookies for domain
         break;
       case 'addWhitelist':
         // Add domain to whitelist
         break;
     }
   });
   ```

5. **Activity Log System** (~100 lines)
   ```javascript
   let activityLog = [];
   const MAX_ACTIVITY_LOG = 100;

   async function loadActivityLog() {
     const { activityLog: stored } = await chrome.storage.local.get('activityLog');
     activityLog = stored || [];
   }

   async function addActivity(activity) {
     activityLog.unshift({
       ...activity,
       timestamp: Date.now(),
       id: Date.now() + Math.random()
     });

     if (activityLog.length > MAX_ACTIVITY_LOG) {
       activityLog = activityLog.slice(0, MAX_ACTIVITY_LOG);
     }

     await chrome.storage.local.set({ activityLog });
   }

   async function handleGetActivity(sendResponse) {
     sendResponse({ success: true, data: activityLog });
   }
   ```

6. **Enhanced Scheduled Tasks** (~100 lines)
   ```javascript
   // Multiple alarm types
   chrome.alarms.create('cleanupExpired', {
     periodInMinutes: 60 // Hourly
   });

   chrome.alarms.create('weeklyReport', {
     periodInMinutes: 10080 // Weekly
   });

   chrome.alarms.onAlarm.addListener(async (alarm) => {
     switch (alarm.name) {
       case 'dailyScan':
         await performScheduledScan();
         break;
       case 'cleanupExpired':
         await cleanupExpiredCookies();
         break;
       case 'weeklyReport':
         await generateWeeklyReport();
         break;
     }
   });
   ```

### Priority 3: Optional Features

7. **Cookie Blocking with declarativeNetRequest** (~200 lines)
   ```javascript
   async function updateBlockingRules() {
     const { whitelist, blockingEnabled } = await chrome.storage.local.get([
       'whitelist',
       'blockingEnabled'
     ]);

     if (!blockingEnabled) {
       await chrome.declarativeNetRequest.updateDynamicRules({
         removeRuleIds: [1, 2, 3] // Clear all rules
       });
       return;
     }

     const trackingDb = new TrackingDatabase();
     const rules = trackingDb.getAllTrackers()
       .filter(domain => !whitelist.includes(domain))
       .map((domain, index) => ({
         id: index + 1,
         priority: 1,
         action: {
           type: 'modifyHeaders',
           responseHeaders: [{
             header: 'set-cookie',
             operation: 'remove'
           }]
         },
         condition: {
           urlFilter: `*://${domain}/*`,
           resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
         }
       }));

     await chrome.declarativeNetRequest.updateDynamicRules({
       addRules: rules,
       removeRuleIds: rules.map(r => r.id)
     });
   }
   ```

## Error Handling & Logging

**Current:**
- ✅ Basic try-catch blocks exist
- ✅ Console.log statements present
- ✅ Error messages returned in responses

**Missing:**
- ❌ Structured error logging
- ❌ Error categorization
- ❌ User-facing error notifications
- ❌ Retry logic for failed operations
- ❌ Error recovery strategies

**Needed:**
```javascript
class ErrorLogger {
  static log(error, context) {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    };

    console.error('❌ Error:', errorLog);

    // Store in chrome.storage for debugging
    this.storeError(errorLog);

    // Notify user if critical
    if (this.isCritical(error)) {
      this.notifyUser(error);
    }
  }
}
```

## Performance Optimizations

**Current:**
- ✅ Async/await used throughout
- ✅ Message channel kept open for async operations

**Missing:**
- ❌ Debouncing for frequent events
- ❌ Batch processing for bulk operations
- ❌ Caching for repeated queries
- ❌ Rate limiting for API calls

**Needed:**
```javascript
// Debounce cookie change events
const debouncedBadgeUpdate = debounce(updateTrackerBadge, 500);

chrome.cookies.onChanged.addListener(() => {
  debouncedBadgeUpdate();
});

// Cache tracking database in memory
let trackingDbCache = null;
async function getTrackingDatabase() {
  if (!trackingDbCache) {
    trackingDbCache = new TrackingDatabase();
    await trackingDbCache.initialize();
  }
  return trackingDbCache;
}
```

## Recommendations

### Approach 1: Complete Implementation
Implement all Prompt 6 features in one comprehensive update:
- Add all missing message handlers
- Implement cookie monitoring system
- Add context menu
- Implement badge color coding
- Add activity log system
- Optional: Cookie blocking

**Estimated Effort:** ~850 lines of code, 3-4 hours

### Approach 2: Phased Implementation

**Phase 1 (Critical):**
1. Cookie monitoring with onChanged ✨
2. Complete message handlers (delete-cookie, delete-domain, etc.)
3. Activity log system
4. Badge color coding

**Phase 2 (Important):**
5. Context menu
6. Enhanced scheduled tasks
7. Weekly/daily reports

**Phase 3 (Optional):**
8. Cookie blocking with declarativeNetRequest
9. Advanced error handling
10. Performance optimizations

### Approach 3: Minimal Completion
Focus only on missing critical features:
- Cookie monitoring
- Activity log
- Missing message handlers
- Badge color coding

**Estimated Effort:** ~400 lines, 2 hours

## Files That Would Be Modified

```
background/
├── service-worker.js        ⚠️ NEEDS UPDATES (~850 lines to add)
└── PROMPT6_IMPLEMENTATION.md ❌ TODO (documentation)
```

## Integration Notes

**Dependencies:**
- Uses `lib/storage-scanner.js` ✅
- Uses `lib/privacy-analyzer.js` ✅
- Uses `lib/tracking-database.js` ✅
- Integrates with popup via messages ✅
- Integrates with options page ⚠️ (needs 'performScan' handler)

**Manifest.json Requirements:**

Current permissions are likely sufficient, but verify:
```json
{
  "permissions": [
    "cookies",
    "storage",
    "alarms",
    "tabs",
    "contextMenus", // ❌ May need to add
    "declarativeNetRequest" // ❌ For cookie blocking (optional)
  ]
}
```

## Next Steps

**User Decision Required:**

Would you like me to:

1. **Implement complete Prompt 6** (all features, ~850 lines)?
2. **Implement Phase 1** (critical features first)?
3. **Implement minimal completion** (essential features only)?
4. **Skip Prompt 6** and keep current basic implementation?

Please specify which approach you'd prefer, and I'll proceed accordingly.

---

**Prompt 6 Status:** ⚠️ **~40% COMPLETE**

The service worker has basic functionality but is missing:
- Cookie monitoring (0%)
- Context menu (0%)
- Activity log system (0%)
- Many message handlers (70% missing)
- Badge color coding (50% complete)
- Cookie blocking (0% - optional)
- Enhanced scheduled tasks (60% missing)

**Estimated work needed:** ~850 lines of code to complete all Prompt 6 requirements.
