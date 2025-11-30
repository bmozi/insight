'use client';

import { useState, useMemo } from 'react';
import {
  Database,
  HardDrive,
  Key,
  Trash2,
  Copy,
  ChevronDown,
  AlertTriangle,
  Search,
  ChevronRight,
  X,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import type { IndexedDBInfo } from '@/lib/types';

interface StorageDetailsProps {
  data: any;
  onClearDomainStorage: (domain: string, type: 'localStorage' | 'sessionStorage') => void;
  onClearIndexedDB: (dbName: string) => void;
  onDeleteKey: (domain: string, key: string, type: 'localStorage' | 'sessionStorage') => void;
}

type TabType = 'localStorage' | 'sessionStorage' | 'indexedDB';
type SortOption = 'size' | 'keyCount' | 'domain';

interface DomainStorageData {
  domain: string;
  size: number;
  keys: string[];
  items: { key: string; value: string; size: number }[];
}

export default function StorageDetails({
  data,
  onClearDomainStorage,
  onClearIndexedDB,
  onDeleteKey,
}: StorageDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('localStorage');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('size');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Extract storage quota information
  const storageQuota = useMemo(() => {
    if (!data) return null;

    const totalBytes = data.summary?.totalSizeBytes || 0;
    // Estimate quota based on browser defaults (typically 50% of available disk or ~10GB)
    const estimatedQuotaBytes = 10 * 1024 * 1024 * 1024; // 10GB default
    const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const quotaMB = (estimatedQuotaBytes / (1024 * 1024)).toFixed(0);
    const percentUsed = ((totalBytes / estimatedQuotaBytes) * 100).toFixed(1);

    return {
      usedMB: parseFloat(usedMB),
      quotaMB: parseFloat(quotaMB),
      percentUsed: parseFloat(percentUsed),
    };
  }, [data]);

  // Process localStorage data
  const localStorageData = useMemo(() => {
    // Handle both data structures:
    // 1. data.localStorage is the byDomain object directly (from extension's legacyFormat)
    // 2. data.localStorage.byDomain is the nested structure (original format)
    const byDomain = data?.localStorage?.byDomain || data?.localStorage || {};
    if (!byDomain || typeof byDomain !== 'object' || Object.keys(byDomain).length === 0) return [];

    const domains: DomainStorageData[] = Object.entries(byDomain).map(
      ([domain, rawInfo]) => {
        const info = rawInfo as { size: number; keys?: string[] };
        return {
          domain,
          size: info.size || 0,
          keys: info.keys || [],
          items: (info.keys || []).map((key: string) => ({
            key,
            value: '', // Value would need to come from extension
            size: Math.round((info.size || 0) / (info.keys?.length || 1)), // Approximate per-key size
          })),
        };
      }
    );

    return sortDomains(domains, sortBy);
  }, [data, sortBy]);

  // Process sessionStorage data
  const sessionStorageData = useMemo(() => {
    // Handle both data structures:
    // 1. data.sessionStorage is the byDomain object directly (from extension's legacyFormat)
    // 2. data.sessionStorage.byDomain is the nested structure (original format)
    const byDomain = data?.sessionStorage?.byDomain || data?.sessionStorage || {};
    if (!byDomain || typeof byDomain !== 'object' || Object.keys(byDomain).length === 0) return [];

    const domains: DomainStorageData[] = Object.entries(byDomain).map(
      ([domain, rawInfo]) => {
        const info = rawInfo as { size: number; keys?: string[] };
        return {
          domain,
          size: info.size || 0,
          keys: info.keys || [],
          items: (info.keys || []).map((key: string) => ({
            key,
            value: '',
            size: Math.round((info.size || 0) / (info.keys?.length || 1)),
          })),
        };
      }
    );

    return sortDomains(domains, sortBy);
  }, [data, sortBy]);

  // Process IndexedDB data
  const indexedDBData = useMemo((): IndexedDBInfo[] => {
    // Handle both data structures:
    // 1. data.indexedDB is byDomain object (from extension's legacyFormat) - need to flatten
    // 2. data.indexedDB.databases is a flat array (original format)
    // 3. data.indexedDB.byDomain contains the structure

    if (data?.indexedDB?.databases && Array.isArray(data.indexedDB.databases)) {
      return data.indexedDB.databases;
    }

    // If indexedDB is byDomain object, flatten it
    const byDomain = data?.indexedDB?.byDomain || data?.indexedDB || {};
    if (!byDomain || typeof byDomain !== 'object') return [];

    const databases: IndexedDBInfo[] = [];
    Object.entries(byDomain).forEach(([domain, domainData]) => {
      const info = domainData as { databases?: Array<{ name: string; version?: number; objectStores?: Array<{ name: string }> | string[] }>; count?: number };
      if (info.databases && Array.isArray(info.databases)) {
        info.databases.forEach(db => {
          // Extract object store names - handle both formats
          const objectStores = db.objectStores
            ? (Array.isArray(db.objectStores)
              ? db.objectStores.map((s: string | { name: string }) => typeof s === 'string' ? s : s.name)
              : [])
            : [];

          databases.push({
            name: db.name,
            version: db.version || 1,
            objectStores,
            estimatedSize: 0, // Not available at this level
            domain,
          });
        });
      }
    });

    return databases;
  }, [data]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    const currentData = activeTab === 'localStorage' ? localStorageData :
                       activeTab === 'sessionStorage' ? sessionStorageData :
                       indexedDBData;

    if (!searchQuery.trim()) return currentData;

    const query = searchQuery.toLowerCase();

    if (activeTab === 'indexedDB') {
      return (currentData as IndexedDBInfo[]).filter(
        (db) =>
          db.name.toLowerCase().includes(query) ||
          db.domain.toLowerCase().includes(query) ||
          db.objectStores.some((store) => store.toLowerCase().includes(query))
      );
    } else {
      return (currentData as DomainStorageData[]).filter(
        (domain) =>
          domain.domain.toLowerCase().includes(query) ||
          domain.keys.some((key) => key.toLowerCase().includes(query))
      );
    }
  }, [activeTab, localStorageData, sessionStorageData, indexedDBData, searchQuery]);

  // Sort domains helper
  function sortDomains(domains: DomainStorageData[], sortOption: SortOption) {
    return [...domains].sort((a, b) => {
      switch (sortOption) {
        case 'size':
          return b.size - a.size;
        case 'keyCount':
          return b.keys.length - a.keys.length;
        case 'domain':
          return a.domain.localeCompare(b.domain);
        default:
          return 0;
      }
    });
  }

  // Toggle domain expansion
  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  // Toggle key expansion
  const toggleKey = (keyId: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(keyId)) {
      newExpanded.delete(keyId);
    } else {
      newExpanded.add(keyId);
    }
    setExpandedKeys(newExpanded);
  };

  // Copy value to clipboard
  const copyValue = async (value: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Check if item is suspicious
  const isSuspiciousItem = (key: string, size: number) => {
    const suspiciousKeywords = [
      'track',
      'analytics',
      '_ga',
      '_fb',
      'pixel',
      'fingerprint',
      'uuid',
      'session_id',
      'visitor',
      'advertising',
    ];

    const hasSuspiciousName = suspiciousKeywords.some((keyword) =>
      key.toLowerCase().includes(keyword)
    );
    const isLarge = size > 100 * 1024; // > 100KB

    return hasSuspiciousName || isLarge;
  };

  // Format bytes to readable size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Format JSON value
  const formatValue = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  // Get tab count
  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'localStorage':
        return localStorageData.length;
      case 'sessionStorage':
        return sessionStorageData.length;
      case 'indexedDB':
        return indexedDBData.length;
      default:
        return 0;
    }
  };

  if (!data) {
    return (
      <div className="rounded-3xl bg-white/95 p-12 text-center shadow-lg backdrop-blur-sm">
        <Database className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-xl font-bold text-gray-600">No Storage Data Available</h3>
        <p className="text-gray-500 mb-4">
          Connect the browser extension and run a scan to explore localStorage, sessionStorage, and IndexedDB.
        </p>
        <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 text-sm text-purple-700">
          <span>💡</span>
          <span>Go to the Overview tab and click "Scan Storage" to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/95 shadow-lg backdrop-blur-sm">
      {/* Storage Quota */}
      {storageQuota && (
        <div className="border-b border-gray-200 p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Storage Quota</h3>
            <span className="text-sm font-medium text-gray-600">
              {storageQuota.usedMB} MB of {storageQuota.quotaMB} MB used
            </span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all ${
                storageQuota.percentUsed > 80
                  ? 'bg-red-500'
                  : storageQuota.percentUsed > 60
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(storageQuota.percentUsed, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {storageQuota.percentUsed}% used
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {(['localStorage', 'sessionStorage', 'indexedDB'] as TabType[]).map((tab) => {
            const Icon = tab === 'indexedDB' ? Database : HardDrive;
            const label = tab === 'localStorage' ? 'Local Storage' :
                         tab === 'sessionStorage' ? 'Session Storage' : 'IndexedDB';
            const count = getTabCount(tab);

            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 font-semibold transition-all ${
                  activeTab === tab
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === tab
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Sort Controls */}
      {activeTab !== 'indexedDB' && (
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by key name..."
                className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-10 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="size">Size</option>
                <option value="keyCount">Key Count</option>
                <option value="domain">Domain</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search for IndexedDB */}
      {activeTab === 'indexedDB' && (
        <div className="border-b border-gray-200 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search databases..."
              className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-10 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-h-[600px] overflow-y-auto p-6">
        {filteredData.length === 0 ? (
          <div className="py-12 text-center">
            <Smartphone className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-600">
              {searchQuery
                ? 'No results found'
                : `No ${activeTab === 'localStorage' ? 'local storage' : activeTab === 'sessionStorage' ? 'session storage' : 'IndexedDB'} data`}
            </p>
          </div>
        ) : activeTab === 'indexedDB' ? (
          // IndexedDB List
          <div className="space-y-4">
            {(filteredData as IndexedDBInfo[]).map((db) => (
              <div
                key={`${db.domain}-${db.name}`}
                className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 transition-all hover:border-purple-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      <h3 className="font-mono text-lg font-bold text-gray-800">
                        {db.name}
                      </h3>
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                      <div>
                        <span className="text-gray-500">Domain:</span>
                        <span className="ml-2 font-medium text-gray-700">{db.domain}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Version:</span>
                        <span className="ml-2 font-medium text-gray-700">{db.version}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="ml-2 font-medium text-gray-700">
                          {formatBytes(db.estimatedSize)}
                        </span>
                      </div>
                    </div>
                    {db.objectStores.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                          Object Stores ({db.objectStores.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {db.objectStores.map((store) => (
                            <span
                              key={store}
                              className="rounded-lg bg-purple-100 px-2 py-1 font-mono text-xs font-medium text-purple-700"
                            >
                              {store}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onClearIndexedDB(db.name)}
                    className="ml-4 flex-shrink-0 rounded-lg bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200 hover:shadow-md active:scale-95"
                    title="Clear database"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // localStorage / sessionStorage List
          <div className="space-y-3">
            {(filteredData as DomainStorageData[]).map((domainData) => {
              const isExpanded = expandedDomains.has(domainData.domain);
              const hasSuspiciousItems = domainData.items.some((item) =>
                isSuspiciousItem(item.key, item.size)
              );

              return (
                <div
                  key={domainData.domain}
                  className={`rounded-xl border-2 transition-all ${
                    hasSuspiciousItems
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-200 bg-gray-50 hover:border-purple-300'
                  }`}
                >
                  {/* Domain Header */}
                  <div
                    className="flex cursor-pointer items-center justify-between p-4"
                    onClick={() => toggleDomain(domainData.domain)}
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <button className="text-gray-500 transition-transform">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono text-sm font-bold text-gray-800">
                            {domainData.domain}
                          </h3>
                          {hasSuspiciousItems && (
                            <span title="Contains suspicious items">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                          <span>{formatBytes(domainData.size)}</span>
                          <span>{domainData.keys.length} keys</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearDomainStorage(domainData.domain, activeTab as 'localStorage' | 'sessionStorage');
                      }}
                      className="ml-4 flex-shrink-0 rounded-lg bg-red-100 p-2 text-red-600 transition-all hover:bg-red-200 hover:shadow-md active:scale-95"
                      title="Clear domain storage"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Domain Items */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-white p-4">
                      {domainData.items.length === 0 ? (
                        <p className="text-center text-sm text-gray-500">No items</p>
                      ) : (
                        <div className="space-y-2">
                          {domainData.items.map((item) => {
                            const keyId = `${domainData.domain}-${item.key}`;
                            const isKeyExpanded = expandedKeys.has(keyId);
                            const isSuspicious = isSuspiciousItem(item.key, item.size);
                            const isCopied = copiedKey === keyId;

                            return (
                              <div
                                key={keyId}
                                className={`rounded-lg border ${
                                  isSuspicious
                                    ? 'border-orange-300 bg-orange-50'
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                {/* Key Header */}
                                <div className="flex items-center justify-between p-3">
                                  <div className="flex flex-1 items-center gap-2 overflow-hidden">
                                    <Key className={`h-4 w-4 flex-shrink-0 ${isSuspicious ? 'text-orange-600' : 'text-purple-600'}`} />
                                    <button
                                      onClick={() => toggleKey(keyId)}
                                      className="min-w-0 flex-1 text-left"
                                    >
                                      <p className="truncate font-mono text-sm font-semibold text-gray-800">
                                        {item.key}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatBytes(item.size)}
                                      </p>
                                    </button>
                                  </div>
                                  <div className="ml-2 flex flex-shrink-0 items-center gap-1">
                                    <button
                                      onClick={() => toggleKey(keyId)}
                                      className="rounded-lg p-1.5 text-gray-600 transition-all hover:bg-gray-200"
                                      title={isKeyExpanded ? 'Collapse' : 'Expand'}
                                    >
                                      {isKeyExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => copyValue(item.key, keyId)}
                                      className="rounded-lg p-1.5 text-gray-600 transition-all hover:bg-gray-200"
                                      title="Copy key"
                                    >
                                      {isCopied ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        onDeleteKey(
                                          domainData.domain,
                                          item.key,
                                          activeTab as 'localStorage' | 'sessionStorage'
                                        )
                                      }
                                      className="rounded-lg p-1.5 text-red-600 transition-all hover:bg-red-100"
                                      title="Delete key"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Key Value */}
                                {isKeyExpanded && (
                                  <div className="border-t border-gray-200 bg-white p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="text-xs font-semibold uppercase text-gray-500">
                                        Value
                                      </span>
                                      <button
                                        onClick={() => copyValue(item.value || 'No value available', `${keyId}-value`)}
                                        className="flex items-center gap-1 rounded-lg bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 transition-all hover:bg-purple-200"
                                      >
                                        <Copy className="h-3 w-3" />
                                        Copy Value
                                      </button>
                                    </div>
                                    <pre className="max-h-48 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                                      {item.value ? formatValue(item.value) : 'Value not available (requires extension access)'}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex flex-wrap gap-4">
            {activeTab === 'indexedDB' ? (
              <>
                <span className="text-gray-600">
                  <strong className="text-gray-800">{indexedDBData.length}</strong> databases
                </span>
                <span className="text-gray-600">
                  <strong className="text-gray-800">
                    {formatBytes(data.indexedDB?.estimatedSize || 0)}
                  </strong>{' '}
                  total
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-600">
                  <strong className="text-gray-800">{filteredData.length}</strong> domains
                </span>
                <span className="text-gray-600">
                  <strong className="text-gray-800">
                    {(filteredData as DomainStorageData[]).reduce((sum, d) => sum + d.keys.length, 0)}
                  </strong>{' '}
                  keys
                </span>
                <span className="text-gray-600">
                  <strong className="text-gray-800">
                    {formatBytes(
                      (filteredData as DomainStorageData[]).reduce((sum, d) => sum + d.size, 0)
                    )}
                  </strong>{' '}
                  total
                </span>
              </>
            )}
          </div>
          {searchQuery && (
            <span className="text-gray-500">
              Showing {filteredData.length} of{' '}
              {activeTab === 'localStorage' ? localStorageData.length :
               activeTab === 'sessionStorage' ? sessionStorageData.length :
               indexedDBData.length}{' '}
              results
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
