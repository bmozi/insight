/**
 * StorageInsight Storage Browser Module
 * Handles localStorage, sessionStorage, and IndexedDB browsing
 */
const StorageBrowser = (function() {
  // ============================================================================
  // PRIVATE STATE
  // ============================================================================

  let state = {
    activeTab: 'localStorage',
    localStorage: [],
    sessionStorage: [],
    indexedDB: [],
    searchTerm: '',
    sortBy: 'size',
    expandedDomains: new Set()
  };

  // ============================================================================
  // DOM ELEMENTS AND CALLBACKS
  // ============================================================================

  let elements = {};
  let showStatusFn = null;
  let onTabChangeFn = null; // callback when tab changes (for IDB browser integration)

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the storage browser module
   * @param {Object} domElements - DOM element references
   * @param {Object} callbacks - Callback functions
   */
  function init(domElements, callbacks) {
    elements = domElements;
    showStatusFn = callbacks.showStatus;
    onTabChangeFn = callbacks.onTabChange;
    setupListeners();
  }

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  /**
   * Process localStorage/sessionStorage data into domain-grouped format
   */
  function processStorageData(storageData, type) {
    if (!storageData) return [];

    const domainMap = new Map();

    // Handle different data structures
    const byDomain = storageData.byDomain || storageData;

    if (byDomain && typeof byDomain === 'object') {
      Object.entries(byDomain).forEach(([domain, data]) => {
        if (domain === 'byDomain') return; // Skip nested wrapper

        let keyItems = [];
        let totalSize = 0;

        // Handle localStorage format: { items: { keyName: {sizeBytes, ...} }, count, totalSize }
        if (data.items && typeof data.items === 'object') {
          Object.entries(data.items).forEach(([keyName, keyData]) => {
            const keySize = keyData.sizeBytes || keyData.size || 0;
            keyItems.push({
              key: keyName,
              size: keySize,
              valuePreview: keyData.valuePreview || '',
              isSuspicious: StorageInsightUtils.isSuspiciousStorageKey(keyName)
            });
            totalSize += keySize;
          });
        }

        // Handle sessionStorage format: { tabs: [{items: {...}, count, size}], totalItems, totalSize }
        if (data.tabs && Array.isArray(data.tabs)) {
          data.tabs.forEach(tabData => {
            if (tabData.items && typeof tabData.items === 'object') {
              Object.entries(tabData.items).forEach(([keyName, keyData]) => {
                // Avoid duplicates across tabs
                if (!keyItems.find(k => k.key === keyName)) {
                  const keySize = keyData.sizeBytes || keyData.size || 0;
                  keyItems.push({
                    key: keyName,
                    size: keySize,
                    valuePreview: keyData.valuePreview || '',
                    isSuspicious: StorageInsightUtils.isSuspiciousStorageKey(keyName)
                  });
                  totalSize += keySize;
                }
              });
            }
          });
        }

        // Fallback: handle old keys array format
        if (data.keys && Array.isArray(data.keys)) {
          const size = data.size || 0;
          keyItems = data.keys.map((key, idx) => {
            const keySize = data.keys.length > 0 ? Math.round(size / data.keys.length) : 0;
            return {
              key: typeof key === 'string' ? key : key.key || `key_${idx}`,
              size: typeof key === 'object' ? (key.size || keySize) : keySize,
              isSuspicious: StorageInsightUtils.isSuspiciousStorageKey(typeof key === 'string' ? key : key.key || '')
            };
          });
          totalSize = size;
        }

        // Use provided totalSize if available
        const finalSize = data.totalSize || data.size || totalSize;

        if (keyItems.length > 0 || finalSize > 0) {
          domainMap.set(domain, {
            domain,
            size: finalSize,
            keys: keyItems,
            keyCount: keyItems.length || data.count || data.totalItems || 0,
            type
          });
        }
      });
    }

    // Also handle items array format
    if (storageData.items && Array.isArray(storageData.items)) {
      storageData.items.forEach(item => {
        const domain = item.origin || item.domain || 'Unknown';
        const existing = domainMap.get(domain) || {
          domain,
          size: 0,
          keys: [],
          keyCount: 0,
          type
        };

        existing.size += item.size || 0;
        existing.keys.push({
          key: item.key || 'unknown',
          size: item.size || 0,
          isSuspicious: StorageInsightUtils.isSuspiciousStorageKey(item.key || '')
        });
        existing.keyCount = existing.keys.length;

        domainMap.set(domain, existing);
      });
    }

    return Array.from(domainMap.values());
  }

  /**
   * Process IndexedDB data
   */
  function processIndexedDBData(indexedDBData) {
    if (!indexedDBData) return [];

    const databases = [];

    // Handle byDomain format
    if (indexedDBData.byDomain) {
      Object.entries(indexedDBData.byDomain).forEach(([domain, data]) => {
        if (data.databases && Array.isArray(data.databases)) {
          data.databases.forEach(db => {
            databases.push({
              domain,
              name: db.name || 'Unknown',
              version: db.version || 1,
              size: db.estimatedSize || db.size || 0,
              objectStores: db.objectStores || [],
              type: 'indexedDB'
            });
          });
        }
      });
    }

    // Handle flat databases array
    if (indexedDBData.databases && Array.isArray(indexedDBData.databases)) {
      indexedDBData.databases.forEach(db => {
        databases.push({
          domain: db.domain || 'Unknown',
          name: db.name || 'Unknown',
          version: db.version || 1,
          size: db.estimatedSize || db.size || 0,
          objectStores: db.objectStores || [],
          type: 'indexedDB'
        });
      });
    }

    return databases;
  }

  /**
   * Calculate total storage bytes
   */
  function calculateTotalStorageBytes(data) {
    let total = 0;

    // localStorage - scanner returns totalSize, not size
    if (data.localStorage) {
      // Use top-level totalSize if available
      if (typeof data.localStorage.totalSize === 'number') {
        total += data.localStorage.totalSize;
      } else {
        const byDomain = data.localStorage.byDomain || data.localStorage;
        if (typeof byDomain === 'object') {
          Object.values(byDomain).forEach(d => {
            if (d && typeof d === 'object') {
              total += d.totalSize || d.size || 0;
            }
          });
        }
      }
    }

    // sessionStorage - scanner returns totalSize, not size
    if (data.sessionStorage) {
      // Use top-level totalSize if available
      if (typeof data.sessionStorage.totalSize === 'number') {
        total += data.sessionStorage.totalSize;
      } else {
        const byDomain = data.sessionStorage.byDomain || data.sessionStorage;
        if (typeof byDomain === 'object') {
          Object.values(byDomain).forEach(d => {
            if (d && typeof d === 'object') {
              total += d.totalSize || d.size || 0;
            }
          });
        }
      }
    }

    // indexedDB
    if (data.indexedDB?.databases) {
      data.indexedDB.databases.forEach(db => {
        total += db.estimatedSize || db.size || 0;
      });
    } else if (data.indexedDB?.byDomain) {
      Object.values(data.indexedDB.byDomain).forEach(d => {
        if (d.databases) {
          d.databases.forEach(db => {
            total += db.estimatedSize || db.size || 0;
          });
        }
      });
    }

    return total;
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  /**
   * Setup storage page event listeners
   */
  function setupListeners() {
    // Tab switching
    document.querySelectorAll('.storage-tab').forEach(tab => {
      tab.addEventListener('click', handleStorageTabClick);
    });

    // Search
    if (elements.storageSearchInput) {
      elements.storageSearchInput.addEventListener('input', handleStorageSearch);
    }
    if (elements.storageSearchClear) {
      elements.storageSearchClear.addEventListener('click', clearStorageSearch);
    }

    // Sort
    if (elements.storageSortSelect) {
      elements.storageSortSelect.addEventListener('change', handleStorageSort);
    }

    // List interactions (using event delegation)
    if (elements.storagePageList) {
      elements.storagePageList.addEventListener('click', handleStorageListClick);
    }
  }

  /**
   * Handle storage tab click
   */
  function handleStorageTabClick(e) {
    const tab = e.currentTarget;
    const storageType = tab.dataset.storageType;

    // Update active tab
    document.querySelectorAll('.storage-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    // Update state and re-render
    state.activeTab = storageType;
    state.expandedDomains = new Set();

    // Notify callback about tab change (for IDB browser coordination)
    if (onTabChangeFn) {
      onTabChangeFn(storageType);
    }

    if (storageType === 'indexedDB') {
      // Switch to IDB Browser view
      if (elements.storagePageList) elements.storagePageList.style.display = 'none';
      if (elements.idbBrowser) {
        elements.idbBrowser.style.display = 'block';
      }
      // Hide standard controls that might not apply
      if (elements.storageSortSelect) elements.storageSortSelect.parentElement.style.display = 'none';
    } else {
      // Standard view
      if (elements.storagePageList) elements.storagePageList.style.display = 'block';
      if (elements.idbBrowser) elements.idbBrowser.style.display = 'none';
      if (elements.storageSortSelect) elements.storageSortSelect.parentElement.style.display = 'flex';
      renderStorageList();
    }
  }

  /**
   * Handle storage search
   */
  function handleStorageSearch(e) {
    state.searchTerm = e.target.value;
    if (elements.storageSearchClear) {
      elements.storageSearchClear.style.display = e.target.value ? 'flex' : 'none';
    }
    renderStorageList();
  }

  /**
   * Clear storage search
   */
  function clearStorageSearch() {
    if (elements.storageSearchInput) elements.storageSearchInput.value = '';
    state.searchTerm = '';
    if (elements.storageSearchClear) elements.storageSearchClear.style.display = 'none';
    renderStorageList();
  }

  /**
   * Handle storage sort change
   */
  function handleStorageSort(e) {
    state.sortBy = e.target.value;
    renderStorageList();
  }

  /**
   * Handle storage list click (expand/collapse, delete)
   */
  function handleStorageListClick(e) {
    // Handle domain delete
    if (e.target.closest('.storage-delete-btn')) {
      const btn = e.target.closest('.storage-delete-btn');
      const domain = btn.dataset.domain;
      const storageType = btn.dataset.type;
      deleteStorageDomain(domain, storageType);
      return;
    }

    // Handle key delete
    if (e.target.closest('.storage-key-delete')) {
      const btn = e.target.closest('.storage-key-delete');
      const domain = btn.dataset.domain;
      const key = btn.dataset.key;
      const storageType = btn.dataset.type;
      deleteStorageKey(domain, key, storageType);
      return;
    }

    // Handle expand/collapse
    const header = e.target.closest('.storage-domain-header');
    if (header) {
      const item = header.closest('.storage-domain-item');
      const domain = item.dataset.domain;

      if (state.expandedDomains.has(domain)) {
        state.expandedDomains.delete(domain);
      } else {
        state.expandedDomains.add(domain);
      }
      item.classList.toggle('expanded');
    }
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  /**
   * Render the storage list based on current state
   */
  function renderStorageList() {
    if (!elements.storagePageList) return;

    const { activeTab, searchTerm, sortBy } = state;
    let data = state[activeTab] || [];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (activeTab === 'indexedDB') {
        data = data.filter(d =>
          d.domain.toLowerCase().includes(term) ||
          d.name.toLowerCase().includes(term) ||
          d.objectStores.some(s => s.toLowerCase().includes(term))
        );
      } else {
        data = data.filter(d =>
          d.domain.toLowerCase().includes(term) ||
          d.keys.some(k => k.key.toLowerCase().includes(term))
        );
      }
    }

    // Sort
    data = [...data].sort((a, b) => {
      switch (sortBy) {
        case 'size':
          return b.size - a.size;
        case 'name':
          return a.domain.localeCompare(b.domain);
        case 'keys':
          return (b.keyCount || b.objectStores?.length || 0) - (a.keyCount || a.objectStores?.length || 0);
        default:
          return 0;
      }
    });

    // Calculate totals for footer
    const totalDomains = data.length;
    const totalKeys = data.reduce((sum, d) => sum + (d.keyCount || d.objectStores?.length || 0), 0);
    const totalSize = data.reduce((sum, d) => sum + (d.size || 0), 0);

    // Update footer
    if (elements.storageDomainsCountEl) elements.storageDomainsCountEl.textContent = totalDomains;
    if (elements.storageKeysCountEl) elements.storageKeysCountEl.textContent = totalKeys;
    if (elements.storageTotalSizeEl) elements.storageTotalSizeEl.textContent = StorageInsightUtils.formatBytes(totalSize);

    // Render empty state or list
    if (data.length === 0) {
      const emptyMessage = searchTerm
        ? `No results for "${searchTerm}"`
        : `No ${activeTab === 'indexedDB' ? 'IndexedDB databases' : activeTab.replace('Storage', ' storage')} found`;

      elements.storagePageList.innerHTML = `
      <div class="storage-empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
        <p>${emptyMessage}</p>
        <p class="hint">Websites haven't stored any data yet</p>
      </div>
    `;
      return;
    }

    // Render based on storage type
    if (activeTab === 'indexedDB') {
      renderIndexedDBList(data);
    } else {
      renderStorageDomainList(data, activeTab);
    }
  }

  /**
   * Render localStorage/sessionStorage domain list
   */
  function renderStorageDomainList(domains, storageType) {
    elements.storagePageList.innerHTML = domains.map(domain => {
      const isExpanded = state.expandedDomains.has(domain.domain);
      const hasSuspicious = domain.keys.some(k => k.isSuspicious);

      return `
      <div class="storage-domain-item ${isExpanded ? 'expanded' : ''}" data-domain="${domain.domain}">
        <div class="storage-domain-header">
          <svg class="storage-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <div class="storage-domain-info">
            <div class="storage-domain-name" title="${domain.domain}">${domain.domain}</div>
            <div class="storage-domain-meta">
              <span>${StorageInsightUtils.formatBytes(domain.size)}</span>
              <span>•</span>
              <span>${domain.keyCount} key${domain.keyCount !== 1 ? 's' : ''}</span>
              ${hasSuspicious ? '<span class="suspicious-badge" title="Contains tracking keys">⚠️</span>' : ''}
            </div>
          </div>
          <div class="storage-domain-actions">
            <button class="storage-delete-btn" data-domain="${domain.domain}" data-type="${storageType}" title="Delete all storage for ${domain.domain}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="storage-keys-list">
          <div class="storage-keys-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
            <span>Keys (${domain.keyCount})</span>
          </div>
          <div class="storage-keys-container">
            ${domain.keys.slice(0, 10).map(key => `
              <div class="storage-key-item ${key.isSuspicious ? 'suspicious' : ''}">
                <svg class="storage-key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${key.isSuspicious
          ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
          : '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>'
        }
                </svg>
                <div class="storage-key-info">
                  <div class="storage-key-name" title="${key.key}">${key.key}</div>
                </div>
                <span class="storage-key-size">${StorageInsightUtils.formatBytes(key.size)}</span>
                <button class="storage-key-delete" data-domain="${domain.domain}" data-key="${key.key}" data-type="${storageType}" title="Delete this key">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            `).join('')}
            ${domain.keyCount > 10 ? `
              <button class="show-more-keys" data-domain="${domain.domain}">
                Show ${domain.keyCount - 10} more keys
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    }).join('');
  }

  /**
   * Render IndexedDB list
   */
  function renderIndexedDBList(databases) {
    elements.storagePageList.innerHTML = databases.map(db => {
      const isExpanded = state.expandedDomains.has(`${db.domain}-${db.name}`);

      return `
      <div class="storage-domain-item ${isExpanded ? 'expanded' : ''}" data-domain="${db.domain}-${db.name}" data-type="indexedDB">
        <div class="storage-domain-header">
          <svg class="storage-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <div class="storage-domain-info">
            <div class="storage-domain-name" title="${db.name}">${db.name}</div>
            <div class="storage-domain-meta">
              <span>${db.domain}</span>
              <span>•</span>
              <span>v${db.version}</span>
              <span>•</span>
              <span>${StorageInsightUtils.formatBytes(db.size)}</span>
            </div>
          </div>
          <div class="storage-domain-actions">
            <button class="storage-delete-btn" data-domain="${db.domain}" data-name="${db.name}" data-type="indexedDB" title="Delete database ${db.name}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="storage-keys-list">
          <div class="storage-keys-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Object Stores (${db.objectStores.length})</span>
          </div>
          <div class="indexeddb-stores">
            ${db.objectStores.map(store => `
              <span class="indexeddb-store-badge">${store}</span>
            `).join('')}
            ${db.objectStores.length === 0 ? '<span class="no-data" style="font-size: 11px;">No object stores</span>' : ''}
          </div>
        </div>
      </div>
    `;
    }).join('');
  }

  // ============================================================================
  // DELETION OPERATIONS
  // ============================================================================

  /**
   * Delete storage for a domain
   */
  async function deleteStorageDomain(domain, storageType) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'clearDomainStorage',
        domain,
        storageType
      });

      if (response?.success) {
        if (showStatusFn) {
          showStatusFn(`Cleared ${storageType} for ${domain}`, 'success');
        }

        // Remove from state
        if (storageType === 'indexedDB') {
          state.indexedDB = state.indexedDB.filter(
            d => `${d.domain}-${d.name}` !== domain
          );
        } else {
          state[storageType] = state[storageType].filter(
            d => d.domain !== domain
          );
        }

        // Update tab count
        const countEl = storageType === 'localStorage' ? elements.localStorageCountEl
          : storageType === 'sessionStorage' ? elements.sessionStorageCountEl
            : elements.indexedDBCountEl;
        if (countEl) countEl.textContent = state[storageType].length;

        renderStorageList();
      } else {
        if (showStatusFn) {
          showStatusFn(`Failed to clear ${storageType}`, 'error');
        }
      }
    } catch (error) {
      debug.error('Error clearing storage:', error);
      if (showStatusFn) {
        showStatusFn('Error clearing storage', 'error');
      }
    }
  }

  /**
   * Delete a specific storage key
   */
  async function deleteStorageKey(domain, key, storageType) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'deleteStorageKey',
        domain,
        key,
        storageType
      });

      if (response?.success) {
        if (showStatusFn) {
          showStatusFn(`Deleted key "${key}"`, 'success');
        }

        // Remove key from state
        const domainData = state[storageType].find(d => d.domain === domain);
        if (domainData) {
          domainData.keys = domainData.keys.filter(k => k.key !== key);
          domainData.keyCount = domainData.keys.length;

          // Remove domain if no keys left
          if (domainData.keyCount === 0) {
            state[storageType] = state[storageType].filter(
              d => d.domain !== domain
            );

            // Update tab count
            const countEl = storageType === 'localStorage' ? elements.localStorageCountEl
              : elements.sessionStorageCountEl;
            if (countEl) countEl.textContent = state[storageType].length;
          }
        }

        renderStorageList();
      } else {
        if (showStatusFn) {
          showStatusFn('Failed to delete key', 'error');
        }
      }
    } catch (error) {
      debug.error('Error deleting key:', error);
      if (showStatusFn) {
        showStatusFn('Error deleting key', 'error');
      }
    }
  }

  // ============================================================================
  // POPULATION
  // ============================================================================

  /**
   * Populate storage page with full storage explorer
   */
  function populate(data) {
    if (!elements.storagePageList) return;

    // Process localStorage data
    state.localStorage = processStorageData(data.localStorage, 'localStorage');

    // Process sessionStorage data
    state.sessionStorage = processStorageData(data.sessionStorage, 'sessionStorage');

    // Process indexedDB data
    state.indexedDB = processIndexedDBData(data.indexedDB);

    // Calculate total storage and quota
    const totalBytes = calculateTotalStorageBytes(data);
    const quotaBytes = 50 * 1024 * 1024; // 50MB realistic estimate for localStorage/cookies
    const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const quotaMB = Math.round(quotaBytes / (1024 * 1024));
    const percentUsed = Math.min(100, (totalBytes / quotaBytes) * 100).toFixed(1);

    // Update quota bar
    if (elements.storageUsedEl) elements.storageUsedEl.textContent = `${usedMB} MB`;
    if (elements.storageQuotaEl) elements.storageQuotaEl.textContent = `${quotaMB} MB`;
    if (elements.quotaPercentEl) elements.quotaPercentEl.textContent = `${percentUsed}% used`;
    if (elements.quotaProgressFill) {
      elements.quotaProgressFill.style.width = `${percentUsed}%`;
      elements.quotaProgressFill.classList.remove('warning', 'critical');
      if (percentUsed > 80) {
        elements.quotaProgressFill.classList.add('critical');
      } else if (percentUsed > 60) {
        elements.quotaProgressFill.classList.add('warning');
      }
    }

    // Update tab counts
    if (elements.localStorageCountEl) elements.localStorageCountEl.textContent = state.localStorage.length;
    if (elements.sessionStorageCountEl) elements.sessionStorageCountEl.textContent = state.sessionStorage.length;
    if (elements.indexedDBCountEl) elements.indexedDBCountEl.textContent = state.indexedDB.length;

    // Reset state - ensure activeTab is reset to localStorage (matches HTML default)
    state.activeTab = 'localStorage';
    state.searchTerm = '';
    state.sortBy = 'size';
    state.expandedDomains = new Set();

    // Reset inputs
    if (elements.storageSearchInput) elements.storageSearchInput.value = '';
    if (elements.storageSortSelect) elements.storageSortSelect.value = 'size';
    if (elements.storageSearchClear) elements.storageSearchClear.style.display = 'none';

    // Reset tab UI to match state
    document.querySelectorAll('.storage-tab').forEach(tab => {
      const isLocalStorage = tab.dataset.storageType === 'localStorage';
      tab.classList.toggle('active', isLocalStorage);
      tab.setAttribute('aria-selected', isLocalStorage ? 'true' : 'false');
    });

    // Ensure storage list is visible and IDB browser is hidden
    if (elements.storagePageList) elements.storagePageList.style.display = 'block';
    if (elements.idbBrowser) elements.idbBrowser.style.display = 'none';
    if (elements.storageSortSelect) elements.storageSortSelect.parentElement.style.display = 'flex';

    // Render
    renderStorageList();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    init,
    populate,
    getState: () => ({ ...state }),
    getActiveTab: () => state.activeTab,
    setActiveTab: (tab) => { state.activeTab = tab; },
    search: (term) => {
      state.searchTerm = term;
      renderStorageList();
    },
    sort: (by) => {
      state.sortBy = by;
      renderStorageList();
    },
    clearSearch: clearStorageSearch,
    render: renderStorageList
  };
})();
