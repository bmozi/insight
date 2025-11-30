/**
 * IndexedDB Storage Utilities for Insight Web App
 * Stores scan data received from the StorageInsight extension
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface StorageDB extends DBSchema {
  scans: {
    key: number; // timestamp
    value: {
      timestamp: number;
      data: any; // Scan results from extension
      privacyScore: number;
      summary: {
        totalCookies: number;
        totalStorageMB: string;
        uniqueDomains: number;
      };
    };
    indexes: { 'by-timestamp': number };
  };
  settings: {
    key: string;
    value: any;
  };
}

class StorageDatabase {
  private db: IDBPDatabase<StorageDB> | null = null;
  private dbName = 'insight-storage';
  private dbVersion = 1;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) {
      console.log('📂 IndexedDB already initialized');
      return; // Already initialized
    }

    console.log('📂 Initializing IndexedDB...', this.dbName, 'v' + this.dbVersion);

    try {
      this.db = await openDB<StorageDB>(this.dbName, this.dbVersion, {
        upgrade(db, oldVersion, newVersion) {
          console.log('📂 IndexedDB upgrade:', oldVersion, '->', newVersion);

          // Create scans object store
          if (!db.objectStoreNames.contains('scans')) {
            console.log('📂 Creating scans store...');
            const scanStore = db.createObjectStore('scans', {
              keyPath: 'timestamp',
            });
            // Create index for faster queries
            scanStore.createIndex('by-timestamp', 'timestamp');
          }

          // Create settings object store
          if (!db.objectStoreNames.contains('settings')) {
            console.log('📂 Creating settings store...');
            db.createObjectStore('settings', {
              keyPath: 'key',
            });
          }
        },
        blocked() {
          console.warn('⚠️ IndexedDB blocked - close other tabs using this database');
        },
        blocking() {
          console.warn('⚠️ IndexedDB blocking - this tab is blocking an upgrade');
        },
        terminated() {
          console.error('❌ IndexedDB connection terminated unexpectedly');
        },
      });

      console.log('✅ IndexedDB initialized successfully:', this.dbName);
    } catch (error) {
      console.error('❌ Error initializing IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Save a scan result to the database
   */
  async saveScan(data: any): Promise<void> {
    console.log('💾 saveScan called with data keys:', Object.keys(data || {}));

    if (!this.db) {
      console.log('💾 DB not initialized, initializing now...');
      await this.init();
    }

    if (!this.db) {
      console.error('❌ Failed to initialize database');
      return;
    }

    try {
      // Extract privacy score from multiple possible locations
      // Extension sends: data.privacyScore and data._privacyAnalysis.privacyScore
      const privacyScore =
        data.privacyScore ||  // Direct field from legacyFormat
        data._privacyAnalysis?.privacyScore ||  // Nested in _privacyAnalysis
        data.privacy?.score ||  // Alternative nested structure
        0;

      console.log('📊 Saving scan with privacyScore:', privacyScore, 'from data:', {
        direct: data.privacyScore,
        nested: data._privacyAnalysis?.privacyScore,
      });

      const scanEntry = {
        timestamp: Date.now(),
        data,
        privacyScore,
        summary: {
          totalCookies: data.totalCookies || data.summary?.cookieCount || 0,
          totalStorageMB: data.totalStorageMB || data.summary?.totalSizeMB || '0',
          uniqueDomains: data.uniqueDomains || data.summary?.uniqueDomains || 0,
        },
      };

      console.log('💾 Attempting to save scan entry:', scanEntry.timestamp, scanEntry.privacyScore);
      await this.db.add('scans', scanEntry);
      console.log('✅ Scan saved to IndexedDB:', scanEntry.timestamp);

      // Keep only last 30 scans
      await this.cleanup();
    } catch (error) {
      console.error('❌ Error saving scan:', error);
      throw error;
    }
  }

  /**
   * Get the most recent scan
   */
  async getLatestScan(): Promise<any | null> {
    if (!this.db) {
      await this.init();
    }

    try {
      const tx = this.db!.transaction('scans', 'readonly');
      const store = tx.objectStore('scans');
      const allScans = await store.getAll();

      if (allScans.length === 0) {
        return null;
      }

      // Sort by timestamp descending and return the latest
      allScans.sort((a, b) => b.timestamp - a.timestamp);
      return allScans[0];
    } catch (error) {
      console.error('❌ Error getting latest scan:', error);
      return null;
    }
  }

  /**
   * Get all scans from the database
   */
  async getAllScans(): Promise<any[]> {
    if (!this.db) {
      await this.init();
    }

    try {
      const scans = await this.db!.getAll('scans');
      // Sort by timestamp descending (newest first)
      return scans.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ Error getting all scans:', error);
      return [];
    }
  }

  /**
   * Delete old scans, keeping only the most recent 30
   */
  async cleanup(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const scans = await this.getAllScans();

      if (scans.length > 30) {
        // Sort by timestamp ascending (oldest first)
        const toDelete = scans
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, scans.length - 30);

        for (const scan of toDelete) {
          await this.db!.delete('scans', scan.timestamp);
        }

        console.log(`🗑️ Cleaned up ${toDelete.length} old scans`);
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Clear all scans from the database
   */
  async clearAllScans(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    try {
      await this.db!.clear('scans');
      console.log('✅ All scans cleared from database');
    } catch (error) {
      console.error('❌ Error clearing scans:', error);
      throw error;
    }
  }

  /**
   * Get a setting from the database
   */
  async getSetting(key: string): Promise<any> {
    if (!this.db) {
      await this.init();
    }

    try {
      const setting = await this.db!.get('settings', key);
      return setting?.value;
    } catch (error) {
      console.error('❌ Error getting setting:', error);
      return null;
    }
  }

  /**
   * Save a setting to the database
   */
  async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    try {
      await this.db!.put('settings', { key, value });
      console.log(`✅ Setting saved: ${key}`);
    } catch (error) {
      console.error('❌ Error saving setting:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✅ Database connection closed');
    }
  }
}

// Export singleton instance
export const storageDB = new StorageDatabase();
