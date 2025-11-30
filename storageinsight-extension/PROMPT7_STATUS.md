# Prompt 7: Content Script for Deep Storage Access

## Status: ⚠️ **PARTIALLY COMPLETE (~25%)**

**Date:** 2025-11-24
**Current File:** `content/content-script.js` (175 lines)

## Requirements Analysis

### ✅ 1. On Page Load - Gather Storage Data (40% Complete)

#### ✅ Implemented:
- ✅ localStorage keys and basic size calculation (lines 84-95)
- ✅ sessionStorage keys and basic size calculation (lines 98-109)
- ✅ Send page load info to background (lines 152-162)

#### ❌ Missing:
- ❌ **IndexedDB databases enumeration** - NOT implemented
- ❌ **IndexedDB size calculation** - NOT implemented
- ❌ Detailed value inspection (only keys collected)
- ❌ Data type detection (json, string, etc.)
- ❌ Detailed response format matching spec

**Current format:**
```javascript
{
  localStorage: { keys: [...], totalSize: 0 },
  sessionStorage: { keys: [...], totalSize: 0 }
}
```

**Required format:**
```javascript
{
  origin: "https://example.com",
  localStorage: {
    itemCount: 15,
    totalSize: 24576,
    items: [{ key: "user_prefs", size: 1024, type: "json" }, ...]
  },
  sessionStorage: {...},
  indexedDB: {
    databases: [{ name: "app_db", objectStores: ["users"], size: 102400 }]
  }
}
```

### ⚠️ 2. Message Protocol (50% Complete)

#### ✅ Implemented:
- ✅ Message listener setup (lines 117-147)
- ✅ 'GET_STORAGE_INFO' handler (lines 121-123)
- ✅ 'CLEAR_LOCAL_STORAGE' handler (lines 125-132)
- ✅ 'CLEAR_SESSION_STORAGE' handler (lines 134-141)

#### ❌ Missing:
- ❌ **'get-storage' with detailed options** - Partial
- ❌ **'delete-storage-item' command** - NOT implemented
- ❌ **'clear-origin-storage' unified command** - NOT implemented
- ❌ **'get-indexeddb' command** - NOT implemented
- ❌ **'delete-indexeddb-item' command** - NOT implemented

**Needed handlers:**
```javascript
'get-storage' → { type: 'all'|'localStorage'|'sessionStorage'|'indexedDB', includeValues: true }
'delete-storage-item' → { storageType, key }
'clear-origin-storage' → { types: ['localStorage', 'sessionStorage', 'indexedDB'] }
'get-indexeddb-details' → { dbName, storeName, limit }
```

### ❌ 3. Deep IndexedDB Inspection (0% Complete)

**COMPLETELY MISSING** - This is a major gap

#### Required:
- ❌ Enumerate all IndexedDB databases
- ❌ Open each database connection
- ❌ List all object stores per database
- ❌ Count records in each store
- ❌ Get sample records (first 10)
- ❌ Calculate total size estimate
- ❌ Handle database errors gracefully

**Example needed:**
```javascript
async function getIndexedDBInfo() {
  const databases = await window.indexedDB.databases();
  const results = [];

  for (const dbInfo of databases) {
    const db = await openDatabase(dbInfo.name);
    const stores = Array.from(db.objectStoreNames);

    for (const storeName of stores) {
      const count = await getRecordCount(db, storeName);
      const samples = await getSampleRecords(db, storeName, 10);
      results.push({ dbName, storeName, count, samples });
    }
  }

  return results;
}
```

### ⚠️ 4. Storage Change Observer (40% Complete)

#### ✅ Implemented:
- ✅ localStorage monitoring via wrapper (lines 13-18, 20-25)
- ✅ sessionStorage monitoring via wrapper (lines 28-33, 35-40)
- ✅ Report changes to background (lines 46-63)

#### ❌ Missing:
- ❌ **Track which scripts modify storage** - NOT implemented
- ❌ **Stack trace capture** - NOT implemented
- ❌ **Debounced change batching** - NOT implemented
- ❌ **IndexedDB change monitoring** - NOT implemented
- ❌ **Storage event listener** (for changes from other tabs)

**Needed:**
```javascript
// Track caller script
const stack = new Error().stack;
const caller = extractCallerFromStack(stack);

// Debounced batching
let changeBatch = [];
const debouncedNotify = debounce(() => {
  chrome.runtime.sendMessage({ type: 'STORAGE_CHANGES_BATCH', changes: changeBatch });
  changeBatch = [];
}, 1000);
```

### ❌ 5. Security (0% Complete)

**COMPLETELY MISSING** - Currently exposes everything

#### Required:
- ❌ **Don't expose actual values unless requested** - Currently exposes all
- ❌ **Hash sensitive-looking data** - NOT implemented
- ❌ **Flag potential PII detection** - NOT implemented
- ❌ **Redact sensitive patterns** (SSN, credit cards, emails, tokens)

**Needed:**
```javascript
function sanitizeValue(key, value) {
  // Detect PII patterns
  if (isPII(value)) {
    return {
      redacted: true,
      hash: hashValue(value),
      piiType: detectPIIType(value)
    };
  }

  // Check key patterns
  if (isSensitiveKey(key)) {
    return { redacted: true, reason: 'sensitive-key' };
  }

  return value;
}
```

### ❌ 6. Performance (20% Complete)

#### ✅ Implemented:
- ✅ Only scan when requested (reactive)

#### ❌ Missing:
- ❌ **Debounce observations** - NOT implemented
- ❌ **Efficient serialization** - NOT implemented
- ❌ **Lazy loading of large datasets** - NOT implemented
- ❌ **Pagination for large storage** - NOT implemented
- ❌ **Cancel long-running operations** - NOT implemented

**Needed:**
```javascript
// Debounce
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Pagination
async function getStoragePageinated(offset = 0, limit = 100) {
  // Return chunks of storage data
}

// Efficient serialization
function efficientSerialize(data) {
  // Use structured cloning or custom serialization
  return JSON.parse(JSON.stringify(data));
}
```

### ❌ 7. Fingerprint Detection (0% Complete)

**COMPLETELY MISSING** - This is a critical privacy feature

#### Required:
- ❌ **Canvas fingerprinting detection** - NOT implemented
- ❌ **Audio fingerprinting detection** - NOT implemented
- ❌ **WebGL fingerprinting detection** - NOT implemented
- ❌ **Font enumeration detection** - NOT implemented
- ❌ **Flag suspicious API calls** - NOT implemented
- ❌ **Report to background script** - NOT implemented

**Needed:**
```javascript
// Monitor canvas fingerprinting
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
HTMLCanvasElement.prototype.toDataURL = function(...args) {
  detectFingerprintAttempt('canvas', {
    size: [this.width, this.height],
    caller: getCaller()
  });
  return originalToDataURL.apply(this, args);
};

// Monitor audio fingerprinting
const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
window.AudioContext = function(...args) {
  detectFingerprintAttempt('audio', { caller: getCaller() });
  return new OriginalAudioContext(...args);
};

// Monitor WebGL fingerprinting
const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
WebGLRenderingContext.prototype.getParameter = function(param) {
  if (isFingerprinting(param)) {
    detectFingerprintAttempt('webgl', { param, caller: getCaller() });
  }
  return originalGetParameter.call(this, param);
};
```

## Current Implementation Summary

### What Exists (175 lines):
```
✅ Basic localStorage monitoring (wrapper)
✅ Basic sessionStorage monitoring (wrapper)
✅ Simple message handler (3 message types)
✅ Page load info sender
✅ Storage change notifications
✅ Basic size calculation
```

### What's Missing (~650+ lines needed):

```
❌ IndexedDB enumeration and inspection (~150 lines)
❌ Deep message protocol handlers (~80 lines)
❌ Security & PII detection (~100 lines)
❌ Performance optimizations (~50 lines)
❌ Fingerprint detection system (~200 lines)
❌ Enhanced storage observer (~70 lines)
❌ Error handling & logging (~50 lines)
```

## Feature Comparison

| Feature | Current | Required | Status |
|---------|---------|----------|--------|
| **localStorage access** | ✅ Keys only | ✅ Full details | ⚠️ Partial |
| **sessionStorage access** | ✅ Keys only | ✅ Full details | ⚠️ Partial |
| **IndexedDB access** | ❌ None | ✅ Full inspection | ❌ Missing |
| **Message handlers** | 3 | 8+ | ⚠️ Partial |
| **Storage monitoring** | ✅ Basic | ✅ Enhanced | ⚠️ Partial |
| **PII detection** | ❌ None | ✅ Required | ❌ Missing |
| **Fingerprint detection** | ❌ None | ✅ Required | ❌ Missing |
| **Performance optimizations** | ❌ None | ✅ Required | ❌ Missing |
| **Security features** | ❌ None | ✅ Required | ❌ Missing |

## Estimated Work Required

### Lines of Code:
- **Current:** 175 lines (~25% complete)
- **Required:** ~825 lines total
- **To Add:** ~650 lines

### Major Components to Build:

1. **IndexedDB Inspector** (~150 lines)
   - Database enumeration
   - Object store inspection
   - Record counting
   - Sample data retrieval

2. **Fingerprint Detection System** (~200 lines)
   - Canvas monitoring
   - Audio monitoring
   - WebGL monitoring
   - Font enumeration detection
   - Reporting system

3. **Security Layer** (~100 lines)
   - PII detection
   - Value sanitization
   - Sensitive key patterns
   - Hash generation

4. **Enhanced Message Protocol** (~80 lines)
   - 5+ new message handlers
   - Detailed response formatting
   - Error handling

5. **Performance Optimizations** (~70 lines)
   - Debouncing
   - Pagination
   - Efficient serialization
   - Change batching

6. **Enhanced Observer** (~50 lines)
   - Stack trace capture
   - Caller identification
   - Storage event listener

## Next Steps

Choose implementation approach:

### Option 1: Complete Implementation
- Implement all 7 requirements
- Add ~650 lines of code
- Full Prompt 7 compliance
- Estimated time: Complete

### Option 2: Incremental Implementation
- Phase 1: IndexedDB support (~150 lines)
- Phase 2: Fingerprint detection (~200 lines)
- Phase 3: Security features (~100 lines)
- Phase 4: Performance & polish (~200 lines)

### Option 3: Keep Current (Not Recommended)
- Only basic localStorage/sessionStorage
- Missing critical features
- Does not meet Prompt 7 requirements

## Recommendation

**Implement Option 1** - The current implementation is missing critical features:
- No IndexedDB support (major gap)
- No fingerprint detection (privacy feature)
- No PII protection (security issue)
- Limited message protocol

These features are essential for a complete storage insight tool.

---

**Status:** ⚠️ ~25% complete, ~650 lines of code needed to meet all Prompt 7 requirements.
