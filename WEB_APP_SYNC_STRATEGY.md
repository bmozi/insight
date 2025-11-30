# Web App ↔ Extension Sync Strategy

## Overview

This document outlines the strategy for syncing data between the StorageInsight Chrome Extension and the Insight web dashboard using modern web APIs, agents, and task-based architecture.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Chrome Extension   │◄───────►│   Insight Web App    │
│                     │         │  (localhost:3000)    │
│  - Scans storage    │         │  - Displays data     │
│  - Real browser data│         │  - Analytics         │
│  - Privacy analysis │         │  - Reports           │
└─────────────────────┘         └──────────────────────┘
         │                               │
         │                               │
         ▼                               ▼
   Extension                        Web Storage
   Storage API                      (IndexedDB)
```

---

## Sync Methods

### 1. **PostMessage API** (Recommended for Real-time)

The extension can communicate with the web app via `window.postMessage`.

#### Extension → Web App

**Extension Side:**
```javascript
// In background/service-worker.js or popup/popup.js
import { scanAllStorage } from '../lib/storage-scanner.js';

async function syncToWebApp() {
  const scanResults = await scanAllStorage();

  // Find or open web app tab
  const tabs = await chrome.tabs.query({
    url: 'http://localhost:3000/*'
  });

  if (tabs.length === 0) {
    // Open web app if not already open
    await chrome.tabs.create({ url: 'http://localhost:3000' });
    // Wait for page to load, then retry
    return;
  }

  // Send data to web app via content script
  const tabId = tabs[0].id;

  await chrome.scripting.executeScript({
    target: { tabId },
    func: (data) => {
      window.postMessage({
        source: 'storageinsight-extension',
        type: 'SCAN_DATA',
        payload: data
      }, window.location.origin);
    },
    args: [scanResults]
  });

  console.log('✅ Data synced to web app');
}

// Auto-sync after scan
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_STORAGE') {
    handleStorageScan(async (response) => {
      sendResponse(response);
      // Auto-sync to web app
      await syncToWebApp();
    });
    return true;
  }
});
```

**Web App Side:**
```typescript
// In app/page.tsx or a custom hook
'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [realData, setRealData] = useState(null);
  const [isExtensionConnected, setIsExtensionConnected] = useState(false);

  useEffect(() => {
    // Listen for messages from extension
    const handleMessage = (event: MessageEvent) => {
      // Verify source
      if (event.data.source !== 'storageinsight-extension') {
        return;
      }

      if (event.data.type === 'SCAN_DATA') {
        console.log('📥 Received scan data from extension', event.data.payload);
        setRealData(event.data.payload);
        setIsExtensionConnected(true);

        // Store in IndexedDB for persistence
        storeDataLocally(event.data.payload);

        // Show notification
        showNotification('Extension data received!');
      }
    };

    window.addEventListener('message', handleMessage);

    // Request data from extension on page load
    requestExtensionData();

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const requestExtensionData = () => {
    // Extension content script can listen for this
    window.postMessage({
      source: 'insight-webapp',
      type: 'REQUEST_DATA'
    }, window.location.origin);
  };

  return (
    <div>
      {isExtensionConnected ? (
        <div className="banner success">
          ✅ Connected to extension - Showing real data
        </div>
      ) : (
        <div className="banner warning">
          ⚠️ Extension not connected - Showing sample data
        </div>
      )}

      {/* Display real or sample data */}
      <Dashboard data={realData || sampleData} />
    </div>
  );
}
```

---

### 2. **Chrome Storage API** (Recommended for Persistence)

Store data in chrome.storage that the web app can request.

**Extension Side:**
```javascript
import { scanAllStorage } from '../lib/storage-scanner.js';

async function saveScanResults() {
  const results = await scanAllStorage();

  // Save to extension storage
  await chrome.storage.local.set({
    latestScan: {
      timestamp: Date.now(),
      data: results
    }
  });

  // Notify web app
  notifyWebApp('DATA_UPDATED');
}
```

**Web App Side:**
```typescript
// Create a content script that bridges extension storage to web app
// content-bridge.js
chrome.storage.local.get(['latestScan'], (result) => {
  if (result.latestScan) {
    window.postMessage({
      source: 'storageinsight-extension',
      type: 'STORED_DATA',
      payload: result.latestScan
    }, '*');
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.latestScan) {
    window.postMessage({
      source: 'storageinsight-extension',
      type: 'DATA_UPDATED',
      payload: changes.latestScan.newValue
    }, '*');
  }
});
```

---

### 3. **Native Messaging** (Advanced, Not Recommended)

For production, you could use Chrome's native messaging to communicate via a local server, but this adds complexity.

---

## Agent-Based Sync Architecture

Using AI agents to intelligently sync and process data.

### Data Sync Agent

```javascript
// sync-agent.js
export class DataSyncAgent {
  constructor() {
    this.syncInterval = 60000; // 1 minute
    this.lastSyncTime = null;
  }

  async start() {
    // Initial sync
    await this.performSync();

    // Set up periodic sync
    setInterval(() => this.performSync(), this.syncInterval);

    // Listen for manual sync requests
    this.setupListeners();
  }

  async performSync() {
    console.log('🔄 Sync agent: Starting sync...');

    try {
      // 1. Scan storage
      const scanData = await scanAllStorage();

      // 2. Analyze privacy
      const privacyAnalysis = await this.analyzePrivacy(scanData);

      // 3. Detect changes
      const changes = await this.detectChanges(scanData);

      // 4. Sync to web app
      await this.syncToWebApp({
        scan: scanData,
        privacy: privacyAnalysis,
        changes
      });

      // 5. Update last sync time
      this.lastSyncTime = Date.now();

      console.log('✅ Sync agent: Sync complete');

    } catch (error) {
      console.error('❌ Sync agent: Sync failed', error);
    }
  }

  async analyzePrivacy(scanData) {
    // Use PrivacyAnalyzer
    const analyzer = new PrivacyAnalyzer();
    return await analyzer.analyze();
  }

  async detectChanges(scanData) {
    // Get previous scan
    const { lastScan } = await chrome.storage.local.get('lastScan');

    if (!lastScan) {
      return { isFirstScan: true };
    }

    // Compare
    return {
      cookiesAdded: scanData.summary.cookieCount - lastScan.summary.cookieCount,
      storageChanged: scanData.summary.totalSizeBytes !== lastScan.summary.totalSizeBytes,
      newDomains: scanData.summary.uniqueDomains - lastScan.summary.uniqueDomains
    };
  }

  async syncToWebApp(data) {
    // Find web app tab
    const tabs = await chrome.tabs.query({
      url: 'http://localhost:3000/*'
    });

    if (tabs.length === 0) return;

    // Send data
    await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: (syncData) => {
        window.postMessage({
          source: 'storageinsight-extension',
          type: 'SYNC_UPDATE',
          payload: syncData
        }, window.location.origin);
      },
      args: [data]
    });
  }

  setupListeners() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'MANUAL_SYNC') {
        this.performSync();
      }
    });
  }
}

// Start agent
const syncAgent = new DataSyncAgent();
syncAgent.start();
```

### Integration in Service Worker

```javascript
// background/service-worker.js
import { DataSyncAgent } from './sync-agent.js';

// Initialize sync agent
const syncAgent = new DataSyncAgent();
syncAgent.start();

// Manual sync from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_SYNC') {
    syncAgent.performSync().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
```

---

## Task-Based Sync Queue

For reliability, implement a task queue for sync operations.

```javascript
// task-queue.js
export class SyncTaskQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  addTask(task) {
    this.queue.push({
      id: Date.now(),
      type: task.type,
      data: task.data,
      retries: 0,
      maxRetries: 3,
      priority: task.priority || 0
    });

    // Sort by priority
    this.queue.sort((a, b) => b.priority - a.priority);

    this.processQueue();
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();

      try {
        await this.executeTask(task);
        console.log(`✅ Task ${task.id} completed`);
      } catch (error) {
        console.error(`❌ Task ${task.id} failed:`, error);

        // Retry logic
        if (task.retries < task.maxRetries) {
          task.retries++;
          this.queue.push(task);
          console.log(`🔄 Task ${task.id} queued for retry (${task.retries}/${task.maxRetries})`);
        }
      }
    }

    this.processing = false;
  }

  async executeTask(task) {
    switch (task.type) {
      case 'SYNC_TO_WEBAPP':
        await this.syncToWebApp(task.data);
        break;

      case 'SCAN_STORAGE':
        await scanAllStorage();
        break;

      case 'ANALYZE_PRIVACY':
        const analyzer = new PrivacyAnalyzer();
        await analyzer.analyze();
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  async syncToWebApp(data) {
    // Implementation from DataSyncAgent
    // ...
  }
}

// Usage
const taskQueue = new SyncTaskQueue();

// Add sync task
taskQueue.addTask({
  type: 'SYNC_TO_WEBAPP',
  data: scanResults,
  priority: 10
});
```

---

## Web App IndexedDB Storage

Store extension data in web app's IndexedDB for offline access.

```typescript
// lib/storage-db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface StorageDB extends DBSchema {
  scans: {
    key: number;
    value: {
      timestamp: number;
      data: any;
      privacyScore: number;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

class StorageDatabase {
  private db: IDBPDatabase<StorageDB> | null = null;

  async init() {
    this.db = await openDB<StorageDB>('insight-storage', 1, {
      upgrade(db) {
        // Create stores
        db.createObjectStore('scans', { keyPath: 'timestamp' });
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    });
  }

  async saveScan(data: any) {
    await this.db!.add('scans', {
      timestamp: Date.now(),
      data,
      privacyScore: data.privacy?.score || 0
    });

    // Keep only last 30 scans
    await this.cleanup();
  }

  async getLatestScan() {
    const tx = this.db!.transaction('scans', 'readonly');
    const store = tx.objectStore('scans');

    const allScans = await store.getAll();
    return allScans.sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  async getAllScans() {
    return await this.db!.getAll('scans');
  }

  async cleanup() {
    const scans = await this.getAllScans();

    if (scans.length > 30) {
      const toDelete = scans
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, scans.length - 30);

      for (const scan of toDelete) {
        await this.db!.delete('scans', scan.timestamp);
      }
    }
  }
}

export const storageDB = new StorageDatabase();
```

**Usage in Web App:**
```typescript
// app/hooks/useExtensionData.ts
'use client';

import { useState, useEffect } from 'react';
import { storageDB } from '@/lib/storage-db';

export function useExtensionData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize DB
    storageDB.init().then(async () => {
      // Load last scan from IndexedDB
      const lastScan = await storageDB.getLatestScan();
      if (lastScan) {
        setData(lastScan.data);
      }
      setLoading(false);
    });

    // Listen for extension messages
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.source === 'storageinsight-extension') {
        const scanData = event.data.payload;

        // Save to IndexedDB
        await storageDB.saveScan(scanData);

        // Update state
        setData(scanData);
        setIsConnected(true);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { data, loading, isConnected };
}
```

---

## Implementation Checklist

### Phase 1: Basic Sync
- [x] Enhanced storage scanner with detailed data
- [ ] PostMessage communication between extension and web app
- [ ] Web app message listener
- [ ] IndexedDB storage in web app
- [ ] Connection status indicator

### Phase 2: Agent-Based Sync
- [ ] DataSyncAgent implementation
- [ ] Automatic periodic sync
- [ ] Change detection
- [ ] Privacy analysis integration
- [ ] Sync status notifications

### Phase 3: Task Queue
- [ ] SyncTaskQueue implementation
- [ ] Retry logic
- [ ] Priority handling
- [ ] Error logging
- [ ] Queue persistence

### Phase 4: Advanced Features
- [ ] Real-time updates (WebSocket?)
- [ ] Conflict resolution
- [ ] Batch sync optimization
- [ ] Compression for large datasets
- [ ] Sync analytics

---

## Security Considerations

1. **Origin Verification**
   - Always check `event.origin` in postMessage
   - Only accept messages from localhost:3000 in development
   - Use proper domain in production

2. **Data Sanitization**
   - Never sync sensitive cookie values
   - Use previews (first 50 chars) only
   - Filter out passwords, tokens, API keys

3. **Permission Checks**
   - Verify extension has required permissions
   - Handle permission errors gracefully
   - Request permissions when needed

4. **Rate Limiting**
   - Don't sync more than once per minute
   - Implement backoff for failed syncs
   - Batch updates when possible

---

## Testing Strategy

```javascript
// test/sync.test.js
describe('Extension ↔ Web App Sync', () => {
  it('should send scan data to web app', async () => {
    const scanData = await scanAllStorage();
    const result = await syncToWebApp(scanData);
    expect(result.success).toBe(true);
  });

  it('should handle web app not open', async () => {
    // Close all web app tabs
    const result = await syncToWebApp(data);
    expect(result.error).toBe('Web app not open');
  });

  it('should retry failed syncs', async () => {
    const task = { type: 'SYNC_TO_WEBAPP', data: {} };
    taskQueue.addTask(task);
    // Simulate failure
    await wait(100);
    expect(task.retries).toBeGreaterThan(0);
  });
});
```

---

## Monitoring & Debugging

```javascript
// Enable debug mode
const DEBUG = true;

if (DEBUG) {
  // Log all postMessage events
  window.addEventListener('message', (event) => {
    console.log('[DEBUG] PostMessage:', event.data);
  });

  // Log all sync attempts
  console.log('[DEBUG] Sync started:', Date.now());
}
```

---

## Future Enhancements

1. **WebSocket Connection** for real-time bidirectional sync
2. **Service Worker** in web app for background sync
3. **Push Notifications** for important privacy alerts
4. **Cloud Sync** (optional) for multi-device
5. **Data Visualization** with historical trends
6. **AI-Powered Insights** using Claude API

---

**Version:** 1.0.0
**Last Updated:** 2025-01-15
**Status:** In Development
