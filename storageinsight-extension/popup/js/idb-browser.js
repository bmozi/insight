/**
 * StorageInsight IndexedDB Browser Module
 * Handles drill-down browsing of IndexedDB databases, stores, and records
 */
const IDBBrowser = (function() {
  // Private state
  let state = {
    view: 'dbs', // 'dbs', 'stores', 'records'
    currentDb: null,
    currentStore: null,
    databases: [],
    stores: [],
    records: [],
    page: 1,
    pageSize: 50,
    totalRecords: 0
  };

  // DOM elements and callbacks
  let elements = {};
  let showStatusFn = null;
  let getStoragePageState = null; // callback to get cached IDB data

  /**
   * Initialize the IDB Browser module
   * @param {Object} domElements - Object containing DOM element references
   * @param {Object} callbacks - Object containing callback functions
   */
  function init(domElements, callbacks) {
    elements = domElements;
    showStatusFn = callbacks.showStatus;
    getStoragePageState = callbacks.getStoragePageState;
    setupListeners();
  }

  /**
   * Setup event listeners for IDB browser controls
   */
  function setupListeners() {
    if (elements.idbBackBtn) elements.idbBackBtn.addEventListener('click', handleIDBBack);
    if (elements.idbPrevPage) elements.idbPrevPage.addEventListener('click', () => changeIDBPage(-1));
    if (elements.idbNextPage) elements.idbNextPage.addEventListener('click', () => changeIDBPage(1));

    // Delegation for list items
    if (elements.idbContent) {
      elements.idbContent.addEventListener('click', handleIDBContentClick);
    }
  }

  /**
   * Load and display all IndexedDB databases
   */
  async function loadDatabases() {
    state.view = 'dbs';
    state.currentDb = null;
    state.currentStore = null;
    updateIDBBreadcrumbs();

    // Use the already-scanned IndexedDB data from storagePageState
    // This avoids trying to relay messages to content scripts which may not be loaded
    const storagePageState = getStoragePageState();
    if (storagePageState.indexedDB && storagePageState.indexedDB.length > 0) {
      // Transform the scanned data into the format expected by the IDB browser
      state.databases = storagePageState.indexedDB.map(db => ({
        name: db.name || 'Unknown',
        version: db.version || 1,
        domain: db.domain || 'Unknown',
        objectStores: db.objectStores || []
      }));
      renderIDBDatabases();
      return;
    }

    // Fall back to trying to get fresh data if no cached data
    if (elements.idbContent) elements.idbContent.innerHTML = '<div class="scan-loader active"><div class="spinner"></div><span>Loading databases...</span></div>';

    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_IDB_DBS' });
      if (response && response.success) {
        state.databases = response.data || [];
        renderIDBDatabases();
      } else {
        // If relay fails, show empty state instead of error
        state.databases = [];
        renderIDBDatabases();
      }
    } catch (error) {
      debug.error('Error loading IDB databases:', error);
      // Show empty state instead of error - relay to content script may not work
      state.databases = [];
      renderIDBDatabases();
    }
  }

  /**
   * Render the list of databases
   */
  function renderIDBDatabases() {
    if (!elements.idbContent) return;

    if (state.databases.length === 0) {
      elements.idbContent.innerHTML = '<p class="no-data">No IndexedDB databases found</p>';
      return;
    }

    elements.idbContent.innerHTML = state.databases.map(db => `
      <div class="idb-item db-item" data-name="${db.name}">
        <div class="idb-icon db-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
          </svg>
        </div>
        <div class="idb-info">
          <div class="idb-name">${db.name}</div>
          <div class="idb-meta">Version: ${db.version}</div>
        </div>
        <div class="idb-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `).join('');

    if (elements.idbPagination) elements.idbPagination.style.display = 'none';
  }

  /**
   * Load and display object stores for a database
   * @param {string} dbName - Name of the database
   */
  async function loadStores(dbName) {
    state.view = 'stores';
    state.currentDb = dbName;
    updateIDBBreadcrumbs();

    // Try to get stores from already-scanned data first
    const storagePageState = getStoragePageState();
    const cachedDb = storagePageState.indexedDB.find(db => db.name === dbName);
    if (cachedDb && cachedDb.objectStores && cachedDb.objectStores.length > 0) {
      state.stores = cachedDb.objectStores;
      renderIDBStores();
      return;
    }

    // Fall back to trying to get fresh data
    if (elements.idbContent) elements.idbContent.innerHTML = '<div class="scan-loader active"><div class="spinner"></div><span>Loading object stores...</span></div>';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_IDB_STORES',
        dbName: dbName
      });

      if (response && response.success) {
        state.stores = response.data || [];
        renderIDBStores();
      } else {
        // Show empty state instead of error
        state.stores = [];
        renderIDBStores();
      }
    } catch (error) {
      debug.error('Error loading IDB stores:', error);
      // Show empty state instead of error
      state.stores = [];
      renderIDBStores();
    }
  }

  /**
   * Render the list of object stores
   */
  function renderIDBStores() {
    if (!elements.idbContent) return;

    if (state.stores.length === 0) {
      elements.idbContent.innerHTML = '<p class="no-data">No object stores found in this database</p>';
      return;
    }

    elements.idbContent.innerHTML = state.stores.map(store => `
      <div class="idb-item store-item" data-name="${store}">
        <div class="idb-icon store-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </div>
        <div class="idb-info">
          <div class="idb-name">${store}</div>
        </div>
        <div class="idb-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `).join('');

    if (elements.idbPagination) elements.idbPagination.style.display = 'none';
  }

  /**
   * Load and display records from an object store with pagination
   * @param {string} dbName - Name of the database
   * @param {string} storeName - Name of the object store
   * @param {number} page - Page number (default: 1)
   */
  async function loadRecords(dbName, storeName, page = 1) {
    state.view = 'records';
    state.currentDb = dbName;
    state.currentStore = storeName;
    state.page = page;
    updateIDBBreadcrumbs();

    if (elements.idbContent) elements.idbContent.innerHTML = '<div class="scan-loader active"><div class="spinner"></div><span>Loading records...</span></div>';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_INDEXEDDB_PAGE',
        dbName: dbName,
        storeName: storeName,
        page: page,
        pageSize: state.pageSize,
        includeValues: true
      });

      if (response && response.success) {
        state.records = response.data.items || [];
        state.totalRecords = response.data.total || 0;
        renderIDBRecords();
      } else {
        // Show helpful message - browsing records requires active tab with database
        state.records = [];
        state.totalRecords = 0;
        if (elements.idbContent) {
          elements.idbContent.innerHTML = `
            <div class="storage-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
              <p>Cannot browse records</p>
              <p class="hint">Open a tab with this website to browse IndexedDB records</p>
            </div>
          `;
        }
        if (elements.idbPagination) elements.idbPagination.style.display = 'none';
      }
    } catch (error) {
      debug.error('Error loading IDB records:', error);
      // Show helpful message instead of error
      state.records = [];
      state.totalRecords = 0;
      if (elements.idbContent) {
        elements.idbContent.innerHTML = `
          <div class="storage-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
            <p>Cannot browse records</p>
            <p class="hint">Open a tab with this website to browse IndexedDB records</p>
          </div>
        `;
      }
      if (elements.idbPagination) elements.idbPagination.style.display = 'none';
    }
  }

  /**
   * Render the list of records
   */
  function renderIDBRecords() {
    if (!elements.idbContent) return;

    if (state.records.length === 0) {
      elements.idbContent.innerHTML = '<p class="no-data">No records found</p>';
      if (elements.idbPagination) elements.idbPagination.style.display = 'none';
      return;
    }

    elements.idbContent.innerHTML = state.records.map(record => {
      const keyStr = typeof record.key === 'object' ? JSON.stringify(record.key) : String(record.key);
      const valueStr = typeof record.value === 'object' ? JSON.stringify(record.value) : String(record.value);
      const shortValue = valueStr.length > 100 ? valueStr.substring(0, 100) + '...' : valueStr;

      return `
        <div class="idb-record-item">
          <div class="idb-record-header">
            <span class="idb-key" title="${keyStr}">Key: ${keyStr}</span>
            <button class="idb-delete-btn" data-key="${keyStr}" title="Delete Record">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          <div class="idb-record-value">
            <div class="value-preview">${shortValue}</div>
            <button class="value-expand-btn">Show Full</button>
            <div class="value-full" style="display: none;">${valueStr}</div>
          </div>
        </div>
      `;
    }).join('');

    updateIDBPagination();
  }

  /**
   * Update pagination controls
   */
  function updateIDBPagination() {
    if (!elements.idbPagination) return;

    const totalPages = Math.ceil(state.totalRecords / state.pageSize);

    if (totalPages > 1) {
      elements.idbPagination.style.display = 'flex';
      if (elements.idbCurrentPage) elements.idbCurrentPage.textContent = `${state.page} of ${totalPages}`;
      if (elements.idbPrevPage) elements.idbPrevPage.disabled = state.page <= 1;
      if (elements.idbNextPage) elements.idbNextPage.disabled = state.page >= totalPages;
    } else {
      elements.idbPagination.style.display = 'none';
    }
  }

  /**
   * Change to a different page of records
   * @param {number} delta - Page change delta (-1 for previous, +1 for next)
   */
  function changeIDBPage(delta) {
    const newPage = state.page + delta;
    const totalPages = Math.ceil(state.totalRecords / state.pageSize);

    if (newPage >= 1 && newPage <= totalPages) {
      loadRecords(state.currentDb, state.currentStore, newPage);
    }
  }

  /**
   * Handle clicks in the IDB content area (delegation)
   * @param {Event} e - Click event
   */
  function handleIDBContentClick(e) {
    // Handle DB click
    const dbItem = e.target.closest('.db-item');
    if (dbItem) {
      const dbName = dbItem.dataset.name;
      loadStores(dbName);
      return;
    }

    // Handle Store click
    const storeItem = e.target.closest('.store-item');
    if (storeItem) {
      const storeName = storeItem.dataset.name;
      loadRecords(state.currentDb, storeName);
      return;
    }

    // Handle Delete Record
    const deleteBtn = e.target.closest('.idb-delete-btn');
    if (deleteBtn) {
      const key = deleteBtn.dataset.key;
      // Note: key is a string here, but IDB keys can be complex.
      // For now, we assume string/number keys or simple serialization.
      // Ideally we should store the original key in memory map if complex.
      // But for simple implementation, we'll try to parse it if it looks like JSON, else use as string.
      let parsedKey = key;
      try {
        parsedKey = JSON.parse(key);
      } catch (e) { }

      handleIDBDelete(state.currentDb, state.currentStore, parsedKey);
      return;
    }

    // Handle Expand Value
    if (e.target.classList.contains('value-expand-btn')) {
      const container = e.target.parentElement;
      const full = container.querySelector('.value-full');
      const preview = container.querySelector('.value-preview');

      if (full.style.display === 'none') {
        full.style.display = 'block';
        preview.style.display = 'none';
        e.target.textContent = 'Show Less';
      } else {
        full.style.display = 'none';
        preview.style.display = 'block';
        e.target.textContent = 'Show Full';
      }
    }
  }

  /**
   * Delete a record from an object store
   * @param {string} dbName - Name of the database
   * @param {string} storeName - Name of the object store
   * @param {*} key - Key of the record to delete
   */
  async function handleIDBDelete(dbName, storeName, key) {
    if (!confirm(`Are you sure you want to delete this record?`)) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DELETE_IDB_RECORD',
        dbName,
        storeName,
        key
      });

      if (response.success) {
        showStatusFn('Record deleted successfully', 'success');
        loadRecords(dbName, storeName, state.page);
      } else {
        throw new Error(response.error || 'Failed to delete record');
      }
    } catch (error) {
      debug.error('Error deleting IDB record:', error);
      showStatusFn('Error deleting record', 'error');
    }
  }

  /**
   * Navigate back in the hierarchy
   */
  function handleIDBBack() {
    if (state.view === 'records') {
      loadStores(state.currentDb);
    } else if (state.view === 'stores') {
      loadDatabases();
    }
  }

  /**
   * Update breadcrumb navigation
   */
  function updateIDBBreadcrumbs() {
    if (!elements.idbBreadcrumbs) return;

    let html = '<span class="crumb" data-level="dbs">Databases</span>';

    if (state.view === 'stores' || state.view === 'records') {
      html += ` <span class="separator">/</span> <span class="crumb" data-level="stores">${state.currentDb}</span>`;
    }

    if (state.view === 'records') {
      html += ` <span class="separator">/</span> <span class="crumb active">${state.currentStore}</span>`;
    }

    elements.idbBreadcrumbs.innerHTML = html;

    // Add click listeners to crumbs
    const crumbs = elements.idbBreadcrumbs.querySelectorAll('.crumb');
    crumbs.forEach(crumb => {
      crumb.addEventListener('click', () => {
        const level = crumb.dataset.level;
        if (level === 'dbs') loadDatabases();
        if (level === 'stores') loadStores(state.currentDb);
      });
    });

    // Update back button visibility
    if (elements.idbBackBtn) {
      elements.idbBackBtn.style.display = state.view === 'dbs' ? 'none' : 'flex';
    }
  }

  // Public API
  return {
    init,
    loadDatabases,
    loadStores,
    loadRecords,
    goBack: handleIDBBack,
    getState: () => ({ ...state }),
    getView: () => state.view,
    setDatabases: (dbs) => { state.databases = dbs; }
  };
})();
