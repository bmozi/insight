/**
 * Custom React Hook for Extension Data Integration
 * Listens for messages from StorageInsight extension and manages data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { storageDB } from './storage-db';

export interface ExtensionData {
  summary: {
    cookieCount: number;
    totalSizeMB: string;
    totalSizeBytes: number;
    uniqueDomains: number;
  };
  cookies: any;
  localStorage: any;
  sessionStorage: any;
  indexedDB: any;
  metadata: {
    scanTime: string;
    scanDurationMs: number;
    version: string;
  };
  _detailed?: {
    cookies?: {
      totalSize?: number;
    };
    localStorage?: {
      totalSize?: number;
    };
    sessionStorage?: {
      totalSize?: number;
    };
    indexedDB?: {
      estimatedSize?: number;
    };
  };
  _privacyAnalysis?: any;
}

export interface ExtensionDataState {
  data: ExtensionData | null;
  loading: boolean;
  isConnected: boolean;
  lastUpdated: number | null;
  error: string | null;
}

/**
 * Hook to manage extension data
 */
export function useExtensionData() {
  const [state, setState] = useState<ExtensionDataState>({
    data: null,
    loading: true,
    isConnected: false,
    lastUpdated: null,
    error: null,
  });

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        console.log('📂 Loading stored scan data...');
        await storageDB.init();

        const lastScan = await storageDB.getLatestScan();
        if (lastScan) {
          console.log('✅ Loaded stored scan from:', new Date(lastScan.timestamp).toLocaleString());
          setState((prev) => ({
            ...prev,
            data: lastScan.data,
            lastUpdated: lastScan.timestamp,
            isConnected: true, // Mark as connected if we have stored data
            loading: false,
          }));
        } else {
          console.log('ℹ️ No stored scan data found');
          setState((prev) => ({
            ...prev,
            loading: false,
          }));
        }
      } catch (error) {
        console.error('❌ Error loading stored data:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load data',
        }));
      }
    };

    loadStoredData();
  }, []);

  // Listen for messages from extension
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: Verify message origin and source
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.source !== 'storageinsight-extension') {
        return;
      }

      console.log('📥 Received message from extension:', event.data.type);

      try {
        switch (event.data.type) {
          case 'SCAN_DATA': {
            const scanData = event.data.payload;
            console.log('📊 Received scan data:', scanData.summary || scanData);
            console.log('📊 Has privacy analysis:', !!scanData._privacyAnalysis);
            console.log('📊 Recommendations count:', scanData._privacyAnalysis?.recommendations?.length || 0);

            // Save to IndexedDB
            await storageDB.saveScan(scanData);

            // Update state - set loading to false since we received data
            setState((prev) => ({
              ...prev,
              data: scanData,
              isConnected: true,
              lastUpdated: Date.now(),
              loading: false,
              error: null,
            }));

            // Show notification
            showNotification('Data refreshed successfully!', 'success');
            break;
          }

          case 'SYNC_UPDATE': {
            const syncData = event.data.payload;
            console.log('🔄 Received sync update:', syncData);

            // Save scan data
            if (syncData.scan) {
              await storageDB.saveScan(syncData.scan);

              setState((prev) => ({
                ...prev,
                data: syncData.scan,
                isConnected: true,
                lastUpdated: Date.now(),
                error: null,
              }));
            }
            break;
          }

          case 'EXTENSION_READY': {
            console.log('✅ Extension is ready');
            setState((prev) => ({
              ...prev,
              isConnected: true,
            }));
            break;
          }

          case 'ACTION_RESPONSE': {
            const { action, success, data, error } = event.data;
            console.log(`📋 Action ${action} completed:`, success ? 'success' : 'failed', data || error);

            if (success) {
              showNotification(`${action} completed successfully!`, 'success');
              // Refresh data after successful action
              window.postMessage(
                { source: 'insight-webapp', type: 'REQUEST_DATA' },
                window.location.origin
              );
            } else {
              showNotification(`${action} failed: ${error || 'Unknown error'}`, 'error');
            }
            break;
          }

          case 'SCAN_ERROR': {
            console.error('❌ Scan error:', event.data.error);
            setState((prev) => ({
              ...prev,
              loading: false,
              error: event.data.error || 'Scan failed',
            }));
            showNotification('Scan failed. Make sure the extension is active.', 'error');
            break;
          }

          default:
            console.log('ℹ️ Unknown message type:', event.data.type);
        }
      } catch (error) {
        console.error('❌ Error handling extension message:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to process extension data',
        }));
      }
    };

    window.addEventListener('message', handleMessage);

    // Request data from extension on mount
    requestExtensionData();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Request data from extension
  const requestExtensionData = useCallback(() => {
    console.log('📡 Requesting data from extension...');

    // Set loading state while waiting for response
    setState((prev) => ({
      ...prev,
      loading: true,
    }));

    window.postMessage(
      {
        source: 'insight-webapp',
        type: 'REQUEST_DATA',
      },
      window.location.origin
    );

    // Timeout fallback - if no response in 5 seconds, reset loading
    setTimeout(() => {
      setState((prev) => {
        if (prev.loading) {
          console.log('⚠️ Request timeout - no response from extension');
          return { ...prev, loading: false };
        }
        return prev;
      });
    }, 5000);
  }, []);

  // Manually refresh data from extension
  const refresh = useCallback(() => {
    requestExtensionData();
  }, [requestExtensionData]);

  // Clear all stored data
  const clearStoredData = useCallback(async () => {
    try {
      await storageDB.clearAllScans();
      setState({
        data: null,
        loading: false,
        isConnected: false,
        lastUpdated: null,
        error: null,
      });
      showNotification('All stored data cleared', 'info');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      showNotification('Failed to clear data', 'error');
    }
  }, []);

  return {
    ...state,
    refresh,
    clearStoredData,
  };
}

/**
 * Show a browser notification (you can customize this)
 */
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // For now, just console log. You can integrate with a toast library later
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  console.log(`${emoji} ${message}`);

  // Optional: Use browser Notification API (requires permission)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Insight', {
      body: message,
      icon: '/icon-128.png',
    });
  }
}
