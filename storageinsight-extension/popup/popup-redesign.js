/**
 * StorageInsight Popup Script - Redesigned Compact Version
 * Handles the extension popup UI with collapsible sections
 */

// Debug utility (inline for non-module scripts)
let _debugEnabled = false;
try {
  chrome.storage.local.get(['debugMode'], (r) => { _debugEnabled = r?.debugMode || false; });
} catch (e) { /* ignore */ }
const debug = {
  log: (...args) => { if (_debugEnabled) debug.log(...args); },
  warn: (...args) => { debug.warn(...args); },
  error: (...args) => { debug.error(...args); }
};

// DOM elements
const scanBtn = document.getElementById('scanBtn');
const scanLoader = document.getElementById('scanLoader');
const settingsBtn = document.getElementById('settingsBtn');
const clearTrackingBtn = document.getElementById('clearTrackingBtn');
const exportBtn = document.getElementById('exportBtn');
const statusMessage = document.getElementById('statusMessage');

// Settings view elements
const settingsView = document.getElementById('settingsView');
const popupContainer = document.querySelector('.popup-container');
const settingsBackBtn = document.getElementById('settingsBackBtn');
const settingsSaveBtn = document.getElementById('settingsSaveBtn');
const settingsResetBtn = document.getElementById('settingsResetBtn');
const settingsAutoScan = document.getElementById('settingsAutoScan');
const settingsScanFrequency = document.getElementById('settingsScanFrequency');
const settingsNotifications = document.getElementById('settingsNotifications');
const settingsPrivacyThreshold = document.getElementById('settingsPrivacyThreshold');
const settingsDebugMode = document.getElementById('settingsDebugMode');

// Metric elements
const totalDomainsEl = document.getElementById('totalDomains');
const totalCookiesEl = document.getElementById('totalCookies');
const totalStorageEl = document.getElementById('totalStorage');
const privacyScoreEl = document.getElementById('privacyScore');
const trackingCookiesEl = document.getElementById('trackingCookies');

// Navigation elements
const infoBtn = document.getElementById('infoBtn');
const logoHome = document.getElementById('logoHome');
const clearAllTrackingBtn = document.getElementById('clearAllTrackingBtn');

// Page elements
const cookiesPageTotal = document.getElementById('cookiesPageTotal');
const cookiesPageFiltered = document.getElementById('cookiesPageFiltered');
const cookiesPageList = document.getElementById('cookiesPageList');
const cookieSearchInput = document.getElementById('cookieSearchInput');
const cookieCategoryFilter = document.getElementById('cookieCategoryFilter');
const cookiesSelectedCount = document.getElementById('cookiesSelectedCount');
const cookieBulkActions = document.getElementById('cookieBulkActions');
const bulkDeleteCookiesBtn = document.getElementById('bulkDeleteCookiesBtn');
const cookiePagination = document.getElementById('cookiePagination');
const cookiePrevPage = document.getElementById('cookiePrevPage');
const cookieNextPage = document.getElementById('cookieNextPage');
const cookieCurrentPage = document.getElementById('cookieCurrentPage');
const cookieTotalPages = document.getElementById('cookieTotalPages');
const trackingPageTotal = document.getElementById('trackingPageTotal');
const trackingPageList = document.getElementById('trackingPageList');
const domainsPageTotal = document.getElementById('domainsPageTotal');
const domainsHighRisk = document.getElementById('domainsHighRisk');
const domainsThirdParty = document.getElementById('domainsThirdParty');
const domainsFiltered = document.getElementById('domainsFiltered');
const domainsTotalCount = document.getElementById('domainsTotalCount');
const domainsPageList = document.getElementById('domainsPageList');
const domainSearchInput = document.getElementById('domainSearchInput');
const domainRiskFilter = document.getElementById('domainRiskFilter');
const domainPagination = document.getElementById('domainPagination');
const domainPrevPage = document.getElementById('domainPrevPage');
const domainNextPage = document.getElementById('domainNextPage');
const domainCurrentPage = document.getElementById('domainCurrentPage');
const domainTotalPages = document.getElementById('domainTotalPages');
// Storage page elements (new design)
const storagePageList = document.getElementById('storagePageList');
const storageUsedEl = document.getElementById('storageUsed');
const storageQuotaEl = document.getElementById('storageQuota');
const quotaProgressFill = document.getElementById('quotaProgressFill');
const quotaPercentEl = document.getElementById('quotaPercent');
const localStorageCountEl = document.getElementById('localStorageCount');
const sessionStorageCountEl = document.getElementById('sessionStorageCount');
const indexedDBCountEl = document.getElementById('indexedDBCount');
const storageSearchInput = document.getElementById('storageSearchInput');
const storageSearchClear = document.getElementById('storageSearchClear');
const storageSortSelect = document.getElementById('storageSortSelect');
const storageDomainsCountEl = document.getElementById('storageDomainsCount');
const storageKeysCountEl = document.getElementById('storageKeysCount');
const storageTotalSizeEl = document.getElementById('storageTotalSize');
const scorePageTotal = document.getElementById('scorePageTotal');
const breakdownList = document.getElementById('breakdownList');

// Score History Elements
const historyAvgScore = document.getElementById('historyAvgScore');
const historyBestScore = document.getElementById('historyBestScore');
const historyWorstScore = document.getElementById('historyWorstScore');
const historyCleared = document.getElementById('historyCleared');
const historyTrend = document.getElementById('historyTrend');
const historyTrendIcon = document.getElementById('historyTrendIcon');
const recentScansList = document.getElementById('recentScansList');

// IDB Browser Elements
const idbBrowser = document.getElementById('idbBrowser');
const idbBackBtn = document.getElementById('idbBackBtn');
const idbBreadcrumbs = document.getElementById('idbBreadcrumbs');
const idbContent = document.getElementById('idbContent');
const idbPagination = document.getElementById('idbPagination');
const idbPrevPage = document.getElementById('idbPrevPage');
const idbNextPage = document.getElementById('idbNextPage');
const idbCurrentPage = document.getElementById('idbCurrentPage');

// Analysis elements
const analysisSectionEl = document.getElementById('analysisSection');
const recommendationsEl = document.getElementById('recommendations');
const highRiskItemsEl = document.getElementById('highRiskItems');

// Collapsible section elements
const recommendationsHeader = document.getElementById('recommendationsHeader');
const recommendationsCard = document.getElementById('recommendationsCard');
const recommendationsCount = document.getElementById('recommendationsCount');

const highRiskHeader = document.getElementById('highRiskHeader');
const highRiskCard = document.getElementById('highRiskCard');
const highRiskCount = document.getElementById('highRiskCount');

// Tracking Companies elements now on tracking page (not collapsible)
const trackersCountEl = document.getElementById('trackingCompaniesTotal');

// State
let currentScanData = null;

// Cookie Browser State
let cookieBrowserState = {
  allCookies: [],
  filteredCookies: [],
  selectedCookies: new Set(),
  currentPage: 1,
  itemsPerPage: 20,
  searchTerm: '',
  categoryFilter: 'all'
};

// Domain Explorer State
let domainExplorerState = {
  allDomains: [],
  filteredDomains: [],
  currentPage: 1,
  itemsPerPage: 15,
  searchTerm: '',
  riskFilter: 'all',
  expandedDomains: new Set()
};

// Storage page state
let storagePageState = {
  activeTab: 'localStorage',
  localStorage: [],
  sessionStorage: [],
  indexedDB: [],
  searchTerm: '',
  sortBy: 'size',
  expandedDomains: new Set()
};

// IDB Browser State
let idbBrowserState = {
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

// Score History State
let scoreHistoryState = {
  scans: [],
  timeRange: '30days', // '7days', '30days', 'all'
  maxScans: 100 // Keep last 100 scans
};

/**
 * Initialize popup
 */
async function init() {
  debug.log('🚀 Popup initializing...');

  // Attach event listeners
  scanBtn.addEventListener('click', handleScan);
  settingsBtn.addEventListener('click', openSettings);
  clearTrackingBtn.addEventListener('click', handleClearTracking);
  exportBtn.addEventListener('click', handleExport);

  // Settings panel event listeners
  if (settingsBackBtn) settingsBackBtn.addEventListener('click', closeSettings);
  if (settingsSaveBtn) settingsSaveBtn.addEventListener('click', saveSettings);
  if (settingsResetBtn) settingsResetBtn.addEventListener('click', resetSettings);

  // Setup navigation
  setupNavigation();

  // Setup IDB Browser
  setupIDBBrowserListeners();

  // Setup collapsible sections (with null checks)
  if (recommendationsHeader && recommendationsCard) {
    setupCollapsible(recommendationsHeader, recommendationsCard);
  }
  if (highRiskHeader && highRiskCard) {
    setupCollapsible(highRiskHeader, highRiskCard);
  }

  // Setup score history filters
  setupScoreHistoryListeners();

  // Load score history
  await loadScoreHistory();

  // Try to load cached data
  await loadCachedData();
}

/**
 * Setup collapsible section
 */
function setupCollapsible(header, card) {
  const toggleSection = () => {
    const isExpanded = card.classList.contains('expanded');
    card.classList.toggle('expanded');
    header.setAttribute('aria-expanded', !isExpanded);
  };

  header.addEventListener('click', toggleSection);
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSection();
    }
  });
}

/**
 * Setup navigation system
 */
function setupNavigation() {
  // Add click listeners to all elements with data-navigate attribute
  const navigableElements = document.querySelectorAll('[data-navigate]');
  navigableElements.forEach(element => {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = element.dataset.navigate;
      navigateTo(targetPage);
    });

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const targetPage = element.dataset.navigate;
        navigateTo(targetPage);
      }
    });
  });

  // Info button navigates to learn page
  if (infoBtn) {
    infoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('learn');
    });
  }

  // Logo navigates to main page
  if (logoHome) {
    logoHome.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('main');
    });

    logoHome.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo('main');
      }
    });
  }

  // Wire up clear all tracking button on tracking page
  if (clearAllTrackingBtn) {
    clearAllTrackingBtn.addEventListener('click', handleClearTracking);
  }
}

/**
 * Navigate to a specific page
 */
function navigateTo(pageName) {
  debug.log('🧭 Navigating to:', pageName);

  // Hide all pages
  const allPages = document.querySelectorAll('.page');
  allPages.forEach(page => {
    page.classList.remove('active');
  });

  // Show target page
  const targetPage = document.querySelector(`.page[data-page="${pageName}"]`);
  if (targetPage) {
    targetPage.classList.add('active');

    // Populate page data when navigating (if we have scan data)
    if (currentScanData) {
      switch (pageName) {
        case 'cookies':
          populateCookiesPage(currentScanData);
          break;
        case 'tracking':
          populateTrackingPage(currentScanData);
          break;
        case 'domains':
          populateDomainsPage(currentScanData);
          break;
        case 'storage':
          populateStoragePage(currentScanData);
          break;
        case 'score':
          populateScorePage(currentScanData);
          break;
      }
    }
  } else {
    debug.warn('⚠️ Page not found:', pageName);
  }
}

/**
 * Load cached scan data if available
 */
async function loadCachedData() {
  try {
    const result = await chrome.storage.local.get(['lastScanData', 'lastScanTime']);

    if (result.lastScanData && result.lastScanTime) {
      // Always show cached data immediately
      debug.log('📦 Loading cached scan data from:', new Date(result.lastScanTime).toLocaleString());
      currentScanData = result.lastScanData;
      displayResults(result.lastScanData);

      // Show how old the data is
      const timeDiff = Date.now() - result.lastScanTime;
      const minutes = Math.floor(timeDiff / 60000);
      if (minutes > 0) {
        showStatus(`Data from ${minutes} min${minutes !== 1 ? 's' : ''} ago`, 'info');
      }
    }
  } catch (error) {
    debug.error('Error loading cached data:', error);
  }
}

/**
 * Handle scan button click
 */
async function handleScan() {
  debug.log('🔍 Starting scan...');

  // Show loading state
  scanBtn.style.display = 'none';
  scanLoader.classList.add('active');

  try {
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Scan timed out after 15 seconds')), 15000)
    );

    const scanPromise = chrome.runtime.sendMessage({
      type: 'SCAN_STORAGE'
    });

    // Race between scan and timeout
    const response = await Promise.race([scanPromise, timeoutPromise]);

    if (response.success) {
      debug.log('✅ Scan complete:', response.data);
      currentScanData = response.data;

      // Cache the results
      await chrome.storage.local.set({
        lastScanData: response.data,
        lastScanTime: Date.now()
      });

      // Display results
      displayResults(response.data);

      // Save to score history
      await saveToScoreHistory(response.data);

      // Show success message
      showStatus('Scan complete!', 'success');
    } else {
      throw new Error(response.error || 'Scan failed');
    }
  } catch (error) {
    debug.error('❌ Scan error:', error);
    showStatus('Scan failed: ' + error.message, 'error');
  } finally {
    // Hide loading state
    scanLoader.classList.remove('active');
    scanBtn.style.display = 'flex';
  }
}

/**
 * Tracking patterns for cookie categorization
 */
const trackingPatterns = {
  analytics: ['google-analytics', 'hotjar', 'mixpanel', 'segment', 'amplitude', '_ga', '_gid', '_gat', '_hjid', 'mp_', 'ajs_', 'amp_', '_pk_'],
  advertising: ['doubleclick', 'googlesyndication', 'criteo', 'outbrain', 'taboola', '_fbp', 'ads', '_cc_', 'cto_', '__qca', 'IDE', 'DSID'],
  social: ['facebook', 'twitter', 'linkedin', 'pinterest', 'instagram', 'tiktok', '_fbc', 'fr', 'datr', '_twitter_sess', 'personalization_id', '_rdt_', '_scid'],
  fingerprinting: ['fingerprint', 'datadome', 'deviceatlas', 'threatmetrix', '_fpjs', '_px', 'datadome'],
  essential: ['session', 'csrf', 'xsrf', 'auth', 'login', '__cf', 'cf_', '__stripe', 'cloudflare'],
};

/**
 * Categorize a cookie based on its name and domain
 */
function categorizeCookie(name, domain) {
  const lowercaseName = name.toLowerCase();
  const lowercaseDomain = domain.toLowerCase();
  const combined = lowercaseName + ' ' + lowercaseDomain;

  if (trackingPatterns.essential.some(p => combined.includes(p))) return 'essential';
  if (trackingPatterns.fingerprinting.some(p => combined.includes(p))) return 'fingerprinting';
  if (trackingPatterns.advertising.some(p => combined.includes(p))) return 'advertising';
  if (trackingPatterns.social.some(p => combined.includes(p))) return 'social';
  if (trackingPatterns.analytics.some(p => combined.includes(p))) return 'analytics';

  return 'unknown';
}

/**
 * Format cookie expiration date
 */
function formatExpiration(cookie) {
  if (cookie.session) return 'Session';
  if (!cookie.expirationDate) return 'Session';

  const date = new Date(cookie.expirationDate * 1000);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;

  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? 's' : ''}`;
}

/**
 * Get unique cookie ID
 */
function getCookieId(cookie) {
  return `${cookie.name}_${cookie.domain}_${cookie.path || '/'}`;
}

/**
 * Initialize cookie browser with data
 */
function populateCookiesPage(data) {
  if (!cookiesPageTotal || !cookiesPageList) return;

  const totalCookies = data.totalCookies || 0;
  if (cookiesPageTotal) cookiesPageTotal.textContent = totalCookies;

  // Get cookies array - handle both data structures
  const cookiesArray = Array.isArray(data?.cookies)
    ? data.cookies
    : data?.cookies?.cookies;

  if (!cookiesArray || cookiesArray.length === 0) {
    cookiesPageList.innerHTML = '<p class="no-data">No cookies found</p>';
    if (cookiesPageFiltered) cookiesPageFiltered.textContent = '0';
    if (cookiePagination) cookiePagination.style.display = 'none';
    return;
  }

  // Enhance cookies with categorization
  cookieBrowserState.allCookies = cookiesArray.map(cookie => ({
    ...cookie,
    category: categorizeCookie(cookie.name, cookie.domain),
    id: getCookieId(cookie)
  }));

  // Reset state
  cookieBrowserState.selectedCookies = new Set();
  cookieBrowserState.currentPage = 1;
  cookieBrowserState.searchTerm = '';
  cookieBrowserState.categoryFilter = 'all';

  // Reset inputs
  if (cookieSearchInput) cookieSearchInput.value = '';
  if (cookieCategoryFilter) cookieCategoryFilter.value = 'all';

  // Apply filters and render
  filterAndRenderCookies();
  setupCookieBrowserListeners();
}

/**
 * Filter cookies and render the list
 */
function filterAndRenderCookies() {
  const { allCookies, searchTerm, categoryFilter, currentPage, itemsPerPage } = cookieBrowserState;

  // Filter cookies
  let filtered = allCookies;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.domain.toLowerCase().includes(term)
    );
  }

  if (categoryFilter !== 'all') {
    filtered = filtered.filter(c => c.category === categoryFilter);
  }

  // Sort by domain then name
  filtered.sort((a, b) => {
    const domainCompare = a.domain.localeCompare(b.domain);
    if (domainCompare !== 0) return domainCompare;
    return a.name.localeCompare(b.name);
  });

  cookieBrowserState.filteredCookies = filtered;

  // Update counts
  if (cookiesPageFiltered) cookiesPageFiltered.textContent = filtered.length;

  // Update selection count
  updateCookieSelectionUI();

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  if (currentPage > totalPages) {
    cookieBrowserState.currentPage = totalPages;
  }

  // Update pagination UI
  if (cookiePagination) {
    cookiePagination.style.display = totalPages > 1 ? 'flex' : 'none';
  }
  if (cookieCurrentPage) cookieCurrentPage.textContent = cookieBrowserState.currentPage;
  if (cookieTotalPages) cookieTotalPages.textContent = totalPages;
  if (cookiePrevPage) cookiePrevPage.disabled = cookieBrowserState.currentPage <= 1;
  if (cookieNextPage) cookieNextPage.disabled = cookieBrowserState.currentPage >= totalPages;

  // Get current page items
  const startIdx = (cookieBrowserState.currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  // Render cookie list
  renderCookieList(pageItems);
}

/**
 * Render the cookie list
 */
function renderCookieList(cookies) {
  if (!cookiesPageList) return;

  if (cookies.length === 0) {
    cookiesPageList.innerHTML = '<p class="no-data">No cookies match your filters</p>';
    return;
  }

  cookiesPageList.innerHTML = cookies.map(cookie => {
    const isSelected = cookieBrowserState.selectedCookies.has(cookie.id);
    const categoryClass = cookie.category;

    return `
      <div class="cookie-item ${isSelected ? 'selected' : ''}" data-category="${categoryClass}" data-cookie-id="${cookie.id}">
        <div class="cookie-item-header">
          <input type="checkbox" class="cookie-checkbox" ${isSelected ? 'checked' : ''} data-cookie-id="${cookie.id}" />
          <div class="cookie-item-info" data-cookie-id="${cookie.id}">
            <div class="cookie-item-name" title="${cookie.name}">${cookie.name}</div>
            <div class="cookie-item-domain" title="${cookie.domain}">${cookie.domain}</div>
          </div>
          <div class="cookie-item-actions">
            <span class="cookie-category-badge ${categoryClass}">${categoryClass}</span>
            <button class="cookie-delete-btn" data-cookie-name="${cookie.name}" data-cookie-domain="${cookie.domain}" title="Delete this cookie">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="cookie-item-details">
          <div class="cookie-detail-row">
            <span class="cookie-detail-label">Path:</span>
            <span class="cookie-detail-value">${cookie.path || '/'}</span>
          </div>
          <div class="cookie-detail-row">
            <span class="cookie-detail-label">Expires:</span>
            <span class="cookie-detail-value">${formatExpiration(cookie)}</span>
          </div>
          <div class="cookie-detail-row">
            <span class="cookie-detail-label">Secure:</span>
            <span class="cookie-detail-value ${cookie.secure ? 'secure' : 'insecure'}">${cookie.secure ? 'Yes' : 'No'}</span>
          </div>
          <div class="cookie-detail-row">
            <span class="cookie-detail-label">HttpOnly:</span>
            <span class="cookie-detail-value ${cookie.httpOnly ? 'secure' : ''}">${cookie.httpOnly ? 'Yes' : 'No'}</span>
          </div>
          <div class="cookie-detail-row">
            <span class="cookie-detail-label">Value:</span>
            <div class="cookie-value-reveal">
              <span class="cookie-value-text" data-hidden="true">••••••••••••</span>
              <button class="cookie-value-toggle">Show</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Store cookie values for reveal functionality
  cookiesPageList.querySelectorAll('.cookie-item').forEach((item, index) => {
    const cookie = cookies[index];
    item.dataset.cookieValue = cookie.value || '';
  });
}

/**
 * Update selection UI
 */
function updateCookieSelectionUI() {
  const count = cookieBrowserState.selectedCookies.size;

  if (cookiesSelectedCount) {
    cookiesSelectedCount.textContent = `${count} selected`;
    cookiesSelectedCount.style.display = count > 0 ? 'inline' : 'none';
  }

  if (cookieBulkActions) {
    cookieBulkActions.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Setup cookie browser event listeners
 */
function setupCookieBrowserListeners() {
  // Search input
  if (cookieSearchInput) {
    cookieSearchInput.removeEventListener('input', handleCookieSearch);
    cookieSearchInput.addEventListener('input', handleCookieSearch);
  }

  // Category filter
  if (cookieCategoryFilter) {
    cookieCategoryFilter.removeEventListener('change', handleCategoryFilterChange);
    cookieCategoryFilter.addEventListener('change', handleCategoryFilterChange);
  }

  // Pagination
  if (cookiePrevPage) {
    cookiePrevPage.removeEventListener('click', handlePrevPage);
    cookiePrevPage.addEventListener('click', handlePrevPage);
  }
  if (cookieNextPage) {
    cookieNextPage.removeEventListener('click', handleNextPage);
    cookieNextPage.addEventListener('click', handleNextPage);
  }

  // Bulk delete
  if (bulkDeleteCookiesBtn) {
    bulkDeleteCookiesBtn.removeEventListener('click', handleBulkDeleteCookies);
    bulkDeleteCookiesBtn.addEventListener('click', handleBulkDeleteCookies);
  }

  // Cookie list interactions (using delegation)
  if (cookiesPageList) {
    cookiesPageList.removeEventListener('click', handleCookieListClick);
    cookiesPageList.addEventListener('click', handleCookieListClick);
    cookiesPageList.removeEventListener('change', handleCookieCheckboxChange);
    cookiesPageList.addEventListener('change', handleCookieCheckboxChange);
  }
}

function handleCookieSearch(e) {
  cookieBrowserState.searchTerm = e.target.value;
  cookieBrowserState.currentPage = 1;
  filterAndRenderCookies();
}

function handleCategoryFilterChange(e) {
  cookieBrowserState.categoryFilter = e.target.value;
  cookieBrowserState.currentPage = 1;
  filterAndRenderCookies();
}

function handlePrevPage() {
  if (cookieBrowserState.currentPage > 1) {
    cookieBrowserState.currentPage--;
    filterAndRenderCookies();
  }
}

function handleNextPage() {
  const totalPages = Math.ceil(cookieBrowserState.filteredCookies.length / cookieBrowserState.itemsPerPage);
  if (cookieBrowserState.currentPage < totalPages) {
    cookieBrowserState.currentPage++;
    filterAndRenderCookies();
  }
}

function handleCookieCheckboxChange(e) {
  if (!e.target.classList.contains('cookie-checkbox')) return;

  const cookieId = e.target.dataset.cookieId;
  if (e.target.checked) {
    cookieBrowserState.selectedCookies.add(cookieId);
  } else {
    cookieBrowserState.selectedCookies.delete(cookieId);
  }

  // Update item selection state
  const item = e.target.closest('.cookie-item');
  if (item) {
    item.classList.toggle('selected', e.target.checked);
  }

  updateCookieSelectionUI();
}

function handleCookieListClick(e) {
  // Handle delete button
  if (e.target.closest('.cookie-delete-btn')) {
    const btn = e.target.closest('.cookie-delete-btn');
    const name = btn.dataset.cookieName;
    const domain = btn.dataset.cookieDomain;
    deleteSingleCookie(name, domain);
    return;
  }

  // Handle value reveal toggle
  if (e.target.classList.contains('cookie-value-toggle')) {
    const valueText = e.target.previousElementSibling;
    const item = e.target.closest('.cookie-item');
    const isHidden = valueText.dataset.hidden === 'true';

    if (isHidden) {
      valueText.textContent = item.dataset.cookieValue || '(empty)';
      valueText.dataset.hidden = 'false';
      e.target.textContent = 'Hide';
    } else {
      valueText.textContent = '••••••••••••';
      valueText.dataset.hidden = 'true';
      e.target.textContent = 'Show';
    }
    return;
  }

  // Handle row click to expand (click on info area)
  const infoArea = e.target.closest('.cookie-item-info');
  if (infoArea) {
    const item = e.target.closest('.cookie-item');
    item.classList.toggle('expanded');
    return;
  }
}

async function deleteSingleCookie(name, domain) {
  try {
    // Send message to service worker to delete cookie
    const response = await chrome.runtime.sendMessage({
      action: 'deleteCookies',
      cookies: [{ name, domain }]
    });

    if (response?.success) {
      showStatus(`Deleted cookie: ${name}`, 'success');
      // Remove from state and re-render
      const cookieId = `${name}_${domain}_/`;
      cookieBrowserState.allCookies = cookieBrowserState.allCookies.filter(c =>
        !(c.name === name && c.domain === domain)
      );
      cookieBrowserState.selectedCookies.delete(cookieId);
      filterAndRenderCookies();

      // Update total count
      if (cookiesPageTotal) {
        cookiesPageTotal.textContent = cookieBrowserState.allCookies.length;
      }
    } else {
      showStatus('Failed to delete cookie', 'error');
    }
  } catch (error) {
    debug.error('Error deleting cookie:', error);
    showStatus('Error deleting cookie', 'error');
  }
}

async function handleBulkDeleteCookies() {
  const selectedIds = Array.from(cookieBrowserState.selectedCookies);
  if (selectedIds.length === 0) return;

  const cookiesToDelete = cookieBrowserState.allCookies
    .filter(c => selectedIds.includes(c.id))
    .map(c => ({ name: c.name, domain: c.domain }));

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'deleteCookies',
      cookies: cookiesToDelete
    });

    if (response?.success) {
      showStatus(`Deleted ${cookiesToDelete.length} cookies`, 'success');
      // Remove from state
      cookieBrowserState.allCookies = cookieBrowserState.allCookies.filter(c =>
        !selectedIds.includes(c.id)
      );
      cookieBrowserState.selectedCookies.clear();
      filterAndRenderCookies();

      // Update total count
      if (cookiesPageTotal) {
        cookiesPageTotal.textContent = cookieBrowserState.allCookies.length;
      }
    } else {
      showStatus('Failed to delete some cookies', 'error');
    }
  } catch (error) {
    debug.error('Error deleting cookies:', error);
    showStatus('Error deleting cookies', 'error');
  }
}

/**
 * Populate tracking page with tracking companies
 */
function populateTrackingPage(data) {
  const trackingPageTotalEl = document.getElementById('trackingPageTotal');
  const trackingCompaniesTotalEl = document.getElementById('trackingCompaniesTotal');
  const trackingPageListEl = document.getElementById('trackingPageList');

  if (!trackingPageListEl) return;

  const trackingCount = data.trackingCookies || 0;
  if (trackingPageTotalEl) trackingPageTotalEl.textContent = trackingCount;

  // Get tracking companies from privacy analysis or compute them
  const privacyAnalysis = data._privacyAnalysis || data.privacyAnalysis;
  const companies = privacyAnalysis?.trackerCompanies || computeTrackerCompanies(data);

  // Update companies count
  if (trackingCompaniesTotalEl) trackingCompaniesTotalEl.textContent = companies.length;

  if (companies.length === 0) {
    trackingPageListEl.innerHTML = '<div class="no-data">No tracking companies detected</div>';
    return;
  }

  // Render tracking companies (same style as was in the collapsible)
  trackingPageListEl.innerHTML = companies
    .sort((a, b) => b.cookieCount - a.cookieCount)
    .map(company => {
      const riskClass = company.risk === 'critical' ? 'critical' :
        company.risk === 'high' ? 'high' : 'medium';
      const categoryLabel = company.category || 'Tracking';
      const categoryClass = categoryLabel.toLowerCase().replace(/\s+/g, '-');

      return `
        <div class="tracker-company ${riskClass}" data-category="${categoryLabel.toLowerCase()}">
          <div class="tracker-header">
            <div class="tracker-info">
              <span class="tracker-initial">${company.name.charAt(0).toUpperCase()}</span>
              <div class="tracker-details">
                <strong class="tracker-name">${company.name}</strong>
                <span class="tracker-category ${categoryClass}">${categoryLabel}</span>
              </div>
            </div>
            <div class="tracker-stats">
              <span class="tracker-count">${company.cookieCount} cookie${company.cookieCount !== 1 ? 's' : ''}</span>
              <button class="tracker-delete-btn" data-company="${company.name}" data-domains="${company.domains.join(',')}" title="Delete all cookies from ${company.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="tracker-domains">
            ${company.domains.slice(0, 3).map(d => `<span class="tracker-domain">${d}</span>`).join('')}
            ${company.domains.length > 3 ? `<span class="tracker-domain-more">+${company.domains.length - 3} more</span>` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  // Attach delete button listeners
  trackingPageListEl.querySelectorAll('.tracker-delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteCompanyTrackers);
  });
}

/**
 * Known tracker company database for domain attribution
 */
const domainCompanyDatabase = {
  'google.com': 'Google', 'doubleclick.net': 'Google', 'googleapis.com': 'Google', 'googlesyndication.com': 'Google',
  'youtube.com': 'Google', 'gstatic.com': 'Google', 'googleadservices.com': 'Google', 'google-analytics.com': 'Google',
  'facebook.com': 'Meta', 'fb.com': 'Meta', 'fbcdn.net': 'Meta', 'instagram.com': 'Meta', 'whatsapp.com': 'Meta',
  'microsoft.com': 'Microsoft', 'bing.com': 'Microsoft', 'msn.com': 'Microsoft', 'live.com': 'Microsoft', 'office.com': 'Microsoft',
  'amazon.com': 'Amazon', 'amazonaws.com': 'Amazon', 'cloudfront.net': 'Amazon', 'amazon-adsystem.com': 'Amazon',
  'twitter.com': 'X (Twitter)', 'twimg.com': 'X (Twitter)', 'x.com': 'X (Twitter)',
  'linkedin.com': 'LinkedIn', 'licdn.com': 'LinkedIn',
  'adobe.com': 'Adobe', 'demdex.net': 'Adobe', 'omtrdc.net': 'Adobe', 'adobedtm.com': 'Adobe',
  'criteo.com': 'Criteo', 'criteo.net': 'Criteo',
  'hubspot.com': 'HubSpot', 'hs-analytics.net': 'HubSpot', 'hsforms.com': 'HubSpot',
  'tiktok.com': 'TikTok', 'tiktokcdn.com': 'TikTok',
  'pinterest.com': 'Pinterest', 'pinimg.com': 'Pinterest',
  'reddit.com': 'Reddit', 'redditmedia.com': 'Reddit', 'redditstatic.com': 'Reddit',
  'snapchat.com': 'Snapchat', 'sc-cdn.net': 'Snapchat',
  'yahoo.com': 'Yahoo', 'oath.com': 'Yahoo',
  'cloudflare.com': 'Cloudflare', 'cdnjs.cloudflare.com': 'Cloudflare',
};

/**
 * Get company name from domain
 */
function getCompanyFromDomain(domain) {
  const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;

  // Direct match
  if (domainCompanyDatabase[cleanDomain]) {
    return domainCompanyDatabase[cleanDomain];
  }

  // Check if domain ends with known company domain
  for (const [knownDomain, company] of Object.entries(domainCompanyDatabase)) {
    if (cleanDomain.endsWith('.' + knownDomain) || cleanDomain === knownDomain) {
      return company;
    }
  }

  return null;
}

/**
 * Determine risk level for a domain based on cookies and patterns
 */
function getDomainRiskLevel(domain, cookies) {
  const cookieNames = cookies.map(c => c.name.toLowerCase()).join(' ');
  const domainLower = domain.toLowerCase();

  // Fingerprinting patterns = critical
  if (/fingerprint|_fpjs|_px|datadome/.test(cookieNames + domainLower)) {
    return 'critical';
  }

  // Advertising patterns = high
  if (/doubleclick|criteo|_fbp|ads|adservice|advertising/.test(cookieNames + domainLower)) {
    return 'high';
  }

  // Analytics patterns = medium
  if (/_ga|_gid|analytics|_pk|utm_|segment|amplitude|mixpanel/.test(cookieNames + domainLower)) {
    return 'medium';
  }

  // Social media = medium
  if (/facebook|twitter|linkedin|instagram|tiktok|pinterest/.test(domainLower)) {
    return 'medium';
  }

  return 'low';
}

/**
 * Format size in bytes to human readable
 */
function formatDomainSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Initialize domain explorer with data
 */
function populateDomainsPage(data) {
  if (!domainsPageList) return;

  // Get cookies array - handle both data structures
  const cookiesArray = Array.isArray(data?.cookies)
    ? data.cookies
    : data?.cookies?.cookies;

  if (!cookiesArray || cookiesArray.length === 0) {
    domainsPageList.innerHTML = '<p class="no-data">No domains found</p>';
    if (domainsPageTotal) domainsPageTotal.textContent = '0';
    if (domainsHighRisk) domainsHighRisk.textContent = '0';
    if (domainsThirdParty) domainsThirdParty.textContent = '0';
    if (domainsFiltered) domainsFiltered.textContent = '0';
    if (domainsTotalCount) domainsTotalCount.textContent = '0';
    if (domainPagination) domainPagination.style.display = 'none';
    return;
  }

  // Group cookies by domain
  const domainMap = new Map();
  cookiesArray.forEach(cookie => {
    const domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;

    if (!domainMap.has(domain)) {
      domainMap.set(domain, {
        domain,
        cookies: [],
        cookieCount: 0,
        storageSize: 0,
        company: getCompanyFromDomain(domain),
        isThirdParty: true // Assume third party in extension context
      });
    }

    const domainInfo = domainMap.get(domain);
    domainInfo.cookies.push(cookie);
    domainInfo.cookieCount++;
    domainInfo.storageSize += (cookie.name.length + (cookie.value?.length || 0));
  });

  // Calculate risk levels and convert to array
  domainExplorerState.allDomains = Array.from(domainMap.values()).map(d => ({
    ...d,
    riskLevel: getDomainRiskLevel(d.domain, d.cookies)
  }));

  // Calculate summary stats
  const highRiskCount = domainExplorerState.allDomains.filter(
    d => d.riskLevel === 'high' || d.riskLevel === 'critical'
  ).length;
  const thirdPartyCount = domainExplorerState.allDomains.filter(d => d.isThirdParty).length;

  // Update summary stat elements
  if (domainsPageTotal) domainsPageTotal.textContent = domainExplorerState.allDomains.length;
  if (domainsHighRisk) domainsHighRisk.textContent = highRiskCount;
  if (domainsThirdParty) domainsThirdParty.textContent = thirdPartyCount;

  // Reset state
  domainExplorerState.currentPage = 1;
  domainExplorerState.searchTerm = '';
  domainExplorerState.riskFilter = 'all';
  domainExplorerState.expandedDomains = new Set();

  // Reset inputs
  if (domainSearchInput) domainSearchInput.value = '';
  if (domainRiskFilter) domainRiskFilter.value = 'all';

  // Filter and render
  filterAndRenderDomains();
  setupDomainExplorerListeners();
}

/**
 * Filter and render domain list
 */
function filterAndRenderDomains() {
  const { allDomains, searchTerm, riskFilter, currentPage, itemsPerPage } = domainExplorerState;

  // Filter domains
  let filtered = allDomains;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(d =>
      d.domain.toLowerCase().includes(term) ||
      (d.company && d.company.toLowerCase().includes(term))
    );
  }

  if (riskFilter !== 'all') {
    filtered = filtered.filter(d => d.riskLevel === riskFilter);
  }

  // Sort by risk level (critical first), then cookie count
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  filtered.sort((a, b) => {
    const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    if (riskDiff !== 0) return riskDiff;
    return b.cookieCount - a.cookieCount;
  });

  domainExplorerState.filteredDomains = filtered;

  // Update counts
  if (domainsFiltered) domainsFiltered.textContent = filtered.length;
  if (domainsTotalCount) domainsTotalCount.textContent = allDomains.length;

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  if (currentPage > totalPages) {
    domainExplorerState.currentPage = totalPages;
  }

  // Update pagination UI
  if (domainPagination) {
    domainPagination.style.display = totalPages > 1 ? 'flex' : 'none';
  }
  if (domainCurrentPage) domainCurrentPage.textContent = domainExplorerState.currentPage;
  if (domainTotalPages) domainTotalPages.textContent = totalPages;
  if (domainPrevPage) domainPrevPage.disabled = domainExplorerState.currentPage <= 1;
  if (domainNextPage) domainNextPage.disabled = domainExplorerState.currentPage >= totalPages;

  // Get current page items
  const startIdx = (domainExplorerState.currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  // Render domain list
  renderDomainList(pageItems);
}

/**
 * Render the domain list
 */
function renderDomainList(domains) {
  if (!domainsPageList) return;

  if (domains.length === 0) {
    domainsPageList.innerHTML = '<p class="no-data">No domains match your filters</p>';
    return;
  }

  domainsPageList.innerHTML = domains.map(domain => {
    const isExpanded = domainExplorerState.expandedDomains.has(domain.domain);

    return `
      <div class="domain-item ${isExpanded ? 'expanded' : ''}" data-risk="${domain.riskLevel}" data-domain="${domain.domain}">
        <div class="domain-item-header">
          <svg class="domain-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <div class="domain-item-info">
            <div class="domain-item-name">
              <span title="${domain.domain}">${domain.domain}</span>
              ${domain.isThirdParty ? '<span class="third-party-badge">3RD PARTY</span>' : ''}
            </div>
            ${domain.company ? `<div class="domain-item-company">${domain.company}</div>` : ''}
          </div>
          <div class="domain-item-stats">
            <span class="domain-stat-mini">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="8" cy="9" r="1.5" fill="currentColor"></circle>
                <circle cx="15" cy="8" r="1" fill="currentColor"></circle>
              </svg>
              ${domain.cookieCount}
            </span>
            <span class="domain-stat-mini">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
              ${formatDomainSize(domain.storageSize)}
            </span>
            <span class="domain-risk-badge ${domain.riskLevel}">${domain.riskLevel}</span>
            <button class="domain-delete-btn" data-domain="${domain.domain}" title="Delete all cookies from ${domain.domain}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="domain-item-details">
          <div class="domain-cookies-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="8" cy="9" r="1.5" fill="currentColor"></circle>
              <circle cx="15" cy="8" r="1" fill="currentColor"></circle>
            </svg>
            Cookies (${domain.cookieCount})
          </div>
          <div class="domain-cookies-list">
            ${domain.cookies.slice(0, 10).map(c => `
              <div class="domain-cookie-item">
                <span class="domain-cookie-name" title="${c.name}">${c.name}</span>
                <div class="domain-cookie-flags">
                  ${c.secure ? '<span class="domain-cookie-flag secure">Secure</span>' : ''}
                  ${c.httpOnly ? '<span class="domain-cookie-flag httponly">HttpOnly</span>' : ''}
                </div>
              </div>
            `).join('')}
            ${domain.cookies.length > 10 ? `<div class="domain-cookie-item" style="justify-content: center; color: #6b7280;">+${domain.cookies.length - 10} more cookies</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Setup domain explorer event listeners
 */
function setupDomainExplorerListeners() {
  // Search input
  if (domainSearchInput) {
    domainSearchInput.removeEventListener('input', handleDomainSearch);
    domainSearchInput.addEventListener('input', handleDomainSearch);
  }

  // Risk filter
  if (domainRiskFilter) {
    domainRiskFilter.removeEventListener('change', handleDomainRiskFilterChange);
    domainRiskFilter.addEventListener('change', handleDomainRiskFilterChange);
  }

  // Pagination
  if (domainPrevPage) {
    domainPrevPage.removeEventListener('click', handleDomainPrevPage);
    domainPrevPage.addEventListener('click', handleDomainPrevPage);
  }
  if (domainNextPage) {
    domainNextPage.removeEventListener('click', handleDomainNextPage);
    domainNextPage.addEventListener('click', handleDomainNextPage);
  }

  // Domain list interactions (using delegation)
  if (domainsPageList) {
    domainsPageList.removeEventListener('click', handleDomainListClick);
    domainsPageList.addEventListener('click', handleDomainListClick);
  }
}

function handleDomainSearch(e) {
  domainExplorerState.searchTerm = e.target.value;
  domainExplorerState.currentPage = 1;
  filterAndRenderDomains();
}

function handleDomainRiskFilterChange(e) {
  domainExplorerState.riskFilter = e.target.value;
  domainExplorerState.currentPage = 1;
  filterAndRenderDomains();
}

function handleDomainPrevPage() {
  if (domainExplorerState.currentPage > 1) {
    domainExplorerState.currentPage--;
    filterAndRenderDomains();
  }
}

function handleDomainNextPage() {
  const totalPages = Math.ceil(domainExplorerState.filteredDomains.length / domainExplorerState.itemsPerPage);
  if (domainExplorerState.currentPage < totalPages) {
    domainExplorerState.currentPage++;
    filterAndRenderDomains();
  }
}

function handleDomainListClick(e) {
  // Handle delete button
  if (e.target.closest('.domain-delete-btn')) {
    const btn = e.target.closest('.domain-delete-btn');
    const domain = btn.dataset.domain;
    deleteDomainCookies(domain);
    return;
  }

  // Handle row click to expand
  const item = e.target.closest('.domain-item');
  if (item && !e.target.closest('.domain-delete-btn')) {
    const domain = item.dataset.domain;
    if (domainExplorerState.expandedDomains.has(domain)) {
      domainExplorerState.expandedDomains.delete(domain);
    } else {
      domainExplorerState.expandedDomains.add(domain);
    }
    item.classList.toggle('expanded');
  }
}

async function deleteDomainCookies(domain) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'delete-domain',
      data: { domain }
    });

    if (response?.success) {
      showStatus(`Deleted all cookies from ${domain}`, 'success');
      // Remove from state and re-render
      domainExplorerState.allDomains = domainExplorerState.allDomains.filter(d => d.domain !== domain);
      domainExplorerState.expandedDomains.delete(domain);

      // Update summary stats
      const highRiskCount = domainExplorerState.allDomains.filter(
        d => d.riskLevel === 'high' || d.riskLevel === 'critical'
      ).length;
      if (domainsPageTotal) domainsPageTotal.textContent = domainExplorerState.allDomains.length;
      if (domainsHighRisk) domainsHighRisk.textContent = highRiskCount;

      filterAndRenderDomains();
    } else {
      showStatus('Failed to delete domain cookies', 'error');
    }
  } catch (error) {
    debug.error('Error deleting domain cookies:', error);
    showStatus('Error deleting domain cookies', 'error');
  }
}

/**
 * Populate storage page with full storage explorer
 */
function populateStoragePage(data) {
  if (!storagePageList) return;

  // Process localStorage data
  storagePageState.localStorage = processStorageData(data.localStorage, 'localStorage');

  // Process sessionStorage data
  storagePageState.sessionStorage = processStorageData(data.sessionStorage, 'sessionStorage');

  // Process indexedDB data
  storagePageState.indexedDB = processIndexedDBData(data.indexedDB);

  // Calculate total storage and quota
  const totalBytes = calculateTotalStorageBytes(data);
  const quotaBytes = 50 * 1024 * 1024; // 50MB realistic estimate for localStorage/cookies
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const quotaMB = Math.round(quotaBytes / (1024 * 1024));
  const percentUsed = Math.min(100, (totalBytes / quotaBytes) * 100).toFixed(1);

  // Update quota bar
  if (storageUsedEl) storageUsedEl.textContent = `${usedMB} MB`;
  if (storageQuotaEl) storageQuotaEl.textContent = `${quotaMB} MB`;
  if (quotaPercentEl) quotaPercentEl.textContent = `${percentUsed}% used`;
  if (quotaProgressFill) {
    quotaProgressFill.style.width = `${percentUsed}%`;
    quotaProgressFill.classList.remove('warning', 'critical');
    if (percentUsed > 80) {
      quotaProgressFill.classList.add('critical');
    } else if (percentUsed > 60) {
      quotaProgressFill.classList.add('warning');
    }
  }

  // Update tab counts
  if (localStorageCountEl) localStorageCountEl.textContent = storagePageState.localStorage.length;
  if (sessionStorageCountEl) sessionStorageCountEl.textContent = storagePageState.sessionStorage.length;
  if (indexedDBCountEl) indexedDBCountEl.textContent = storagePageState.indexedDB.length;

  // Reset state - ensure activeTab is reset to localStorage (matches HTML default)
  storagePageState.activeTab = 'localStorage';
  storagePageState.searchTerm = '';
  storagePageState.sortBy = 'size';
  storagePageState.expandedDomains = new Set();

  // Reset inputs
  if (storageSearchInput) storageSearchInput.value = '';
  if (storageSortSelect) storageSortSelect.value = 'size';
  if (storageSearchClear) storageSearchClear.style.display = 'none';

  // Reset tab UI to match state
  document.querySelectorAll('.storage-tab').forEach(tab => {
    const isLocalStorage = tab.dataset.storageType === 'localStorage';
    tab.classList.toggle('active', isLocalStorage);
    tab.setAttribute('aria-selected', isLocalStorage ? 'true' : 'false');
  });

  // Ensure storage list is visible and IDB browser is hidden
  if (storagePageList) storagePageList.style.display = 'block';
  if (idbBrowser) idbBrowser.style.display = 'none';
  if (storageSortSelect) storageSortSelect.parentElement.style.display = 'flex';

  // Setup listeners and render
  setupStoragePageListeners();
  renderStorageList();
}

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
            isSuspicious: isSuspiciousStorageKey(keyName)
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
                  isSuspicious: isSuspiciousStorageKey(keyName)
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
            isSuspicious: isSuspiciousStorageKey(typeof key === 'string' ? key : key.key || '')
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
        isSuspicious: isSuspiciousStorageKey(item.key || '')
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

/**
 * Check if a storage key is suspicious (tracking-related)
 */
function isSuspiciousStorageKey(key) {
  const suspiciousPatterns = [
    'track', 'analytics', '_ga', '_fb', 'pixel', 'fingerprint',
    'uuid', 'session_id', 'visitor', 'advertising', 'ad_', '_ad',
    'targeting', 'remarketing', 'conversion'
  ];
  const lowerKey = key.toLowerCase();
  return suspiciousPatterns.some(pattern => lowerKey.includes(pattern));
}

/**
 * Setup storage page event listeners
 */
function setupStoragePageListeners() {
  // Tab switching
  document.querySelectorAll('.storage-tab').forEach(tab => {
    tab.addEventListener('click', handleStorageTabClick);
  });

  // Search
  if (storageSearchInput) {
    storageSearchInput.addEventListener('input', handleStorageSearch);
  }
  if (storageSearchClear) {
    storageSearchClear.addEventListener('click', clearStorageSearch);
  }

  // Sort
  if (storageSortSelect) {
    storageSortSelect.addEventListener('change', handleStorageSort);
  }

  // List interactions (using event delegation)
  if (storagePageList) {
    storagePageList.addEventListener('click', handleStorageListClick);
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
  storagePageState.activeTab = storageType;
  storagePageState.expandedDomains = new Set();

  if (storageType === 'indexedDB') {
    // Switch to IDB Browser view
    if (storagePageList) storagePageList.style.display = 'none';
    if (idbBrowser) {
      idbBrowser.style.display = 'block';
      loadIDBDatabases();
    }
    // Hide standard controls that might not apply
    if (storageSortSelect) storageSortSelect.parentElement.style.display = 'none';
  } else {
    // Standard view
    if (storagePageList) storagePageList.style.display = 'block';
    if (idbBrowser) idbBrowser.style.display = 'none';
    if (storageSortSelect) storageSortSelect.parentElement.style.display = 'flex';
    renderStorageList();
  }
}

/**
 * Handle storage search
 */
function handleStorageSearch(e) {
  storagePageState.searchTerm = e.target.value;
  if (storageSearchClear) {
    storageSearchClear.style.display = e.target.value ? 'flex' : 'none';
  }
  renderStorageList();
}

/**
 * Clear storage search
 */
function clearStorageSearch() {
  if (storageSearchInput) storageSearchInput.value = '';
  storagePageState.searchTerm = '';
  if (storageSearchClear) storageSearchClear.style.display = 'none';
  renderStorageList();
}

/**
 * Handle storage sort change
 */
function handleStorageSort(e) {
  storagePageState.sortBy = e.target.value;
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

    if (storagePageState.expandedDomains.has(domain)) {
      storagePageState.expandedDomains.delete(domain);
    } else {
      storagePageState.expandedDomains.add(domain);
    }
    item.classList.toggle('expanded');
  }
}

/**
 * Render the storage list based on current state
 */
function renderStorageList() {
  if (!storagePageList) return;

  const { activeTab, searchTerm, sortBy } = storagePageState;
  let data = storagePageState[activeTab] || [];

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
  if (storageDomainsCountEl) storageDomainsCountEl.textContent = totalDomains;
  if (storageKeysCountEl) storageKeysCountEl.textContent = totalKeys;
  if (storageTotalSizeEl) storageTotalSizeEl.textContent = formatBytes(totalSize);

  // Render empty state or list
  if (data.length === 0) {
    const emptyMessage = searchTerm
      ? `No results for "${searchTerm}"`
      : `No ${activeTab === 'indexedDB' ? 'IndexedDB databases' : activeTab.replace('Storage', ' storage')} found`;

    storagePageList.innerHTML = `
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
  storagePageList.innerHTML = domains.map(domain => {
    const isExpanded = storagePageState.expandedDomains.has(domain.domain);
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
              <span>${formatBytes(domain.size)}</span>
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
                <span class="storage-key-size">${formatBytes(key.size)}</span>
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
  storagePageList.innerHTML = databases.map(db => {
    const isExpanded = storagePageState.expandedDomains.has(`${db.domain}-${db.name}`);

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
              <span>${formatBytes(db.size)}</span>
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
      showStatus(`Cleared ${storageType} for ${domain}`, 'success');

      // Remove from state
      if (storageType === 'indexedDB') {
        storagePageState.indexedDB = storagePageState.indexedDB.filter(
          d => `${d.domain}-${d.name}` !== domain
        );
      } else {
        storagePageState[storageType] = storagePageState[storageType].filter(
          d => d.domain !== domain
        );
      }

      // Update tab count
      const countEl = storageType === 'localStorage' ? localStorageCountEl
        : storageType === 'sessionStorage' ? sessionStorageCountEl
          : indexedDBCountEl;
      if (countEl) countEl.textContent = storagePageState[storageType].length;

      renderStorageList();
    } else {
      showStatus(`Failed to clear ${storageType}`, 'error');
    }
  } catch (error) {
    debug.error('Error clearing storage:', error);
    showStatus('Error clearing storage', 'error');
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
      showStatus(`Deleted key "${key}"`, 'success');

      // Remove key from state
      const domainData = storagePageState[storageType].find(d => d.domain === domain);
      if (domainData) {
        domainData.keys = domainData.keys.filter(k => k.key !== key);
        domainData.keyCount = domainData.keys.length;

        // Remove domain if no keys left
        if (domainData.keyCount === 0) {
          storagePageState[storageType] = storagePageState[storageType].filter(
            d => d.domain !== domain
          );

          // Update tab count
          const countEl = storageType === 'localStorage' ? localStorageCountEl
            : sessionStorageCountEl;
          if (countEl) countEl.textContent = storagePageState[storageType].length;
        }
      }

      renderStorageList();
    } else {
      showStatus('Failed to delete key', 'error');
    }
  } catch (error) {
    debug.error('Error deleting key:', error);
    showStatus('Error deleting key', 'error');
  }
}

/**
 * Populate score page with privacy score breakdown
 */
function populateScorePage(data) {
  if (!scorePageTotal || !breakdownList) return;

  const privacyAnalysis = data._privacyAnalysis || data.privacyAnalysis;
  const privacyScore = data.privacyScore || privacyAnalysis?.privacyScore || { score: 0 };
  const scoreValue = typeof privacyScore === 'object' ? privacyScore.score : privacyScore;

  scorePageTotal.textContent = `${scoreValue}/100`;

  if (!privacyAnalysis || !privacyAnalysis.privacyScore) {
    breakdownList.innerHTML = '<div class="no-data">No score breakdown available</div>';
    return;
  }

  const scoreData = privacyAnalysis.privacyScore;

  // Map deduction types to user-friendly labels and improvement tips
  const deductionLabels = {
    'tracking': { label: 'Tracking Cookies', tip: 'Clear tracking cookies regularly or use privacy-focused browser settings', unit: 'cookies' },
    'advertising': { label: 'Advertising Cookies', tip: 'Consider using an ad blocker or clearing ad cookies', unit: 'cookies' },
    'fingerprinting': { label: 'Fingerprinting', tip: 'Use browser fingerprint protection or privacy extensions', unit: 'cookies' },
    'long-lived': { label: 'Long-lived Cookies', tip: 'Clear cookies periodically - some persist for years', unit: 'cookies' },
    'insecure-sensitive': { label: 'Insecure Cookies', tip: 'Be cautious on sites storing sensitive data without HTTPS', unit: 'cookies' },
    'localStorage': { label: 'Excessive Storage', tip: 'Clear site data for sites you no longer use', unit: 'units (100KB each)' }
  };

  // Build deduction list from the deductions array returned by privacy analyzer
  const deductionItems = [];

  if (scoreData.deductions && Array.isArray(scoreData.deductions)) {
    scoreData.deductions.forEach(d => {
      if (d.points > 0) {
        const info = deductionLabels[d.type] || { label: d.type, tip: '' };
        deductionItems.push({
          label: info.label,
          tip: info.tip,
          value: -d.points,
          count: d.count || d.units || null,
          type: d.type
        });
      }
    });
  }

  // Also check for legacy field names (fallback)
  if (deductionItems.length === 0) {
    if (scoreData.trackingDeduction > 0) {
      deductionItems.push({ label: 'Tracking Cookies', value: -scoreData.trackingDeduction, count: scoreData.trackingCount || 0 });
    }
    if (scoreData.advertisingDeduction > 0) {
      deductionItems.push({ label: 'Advertising Cookies', value: -scoreData.advertisingDeduction, count: scoreData.advertisingCount || 0 });
    }
    if (scoreData.fingerprintingDeduction > 0) {
      deductionItems.push({ label: 'Fingerprinting', value: -scoreData.fingerprintingDeduction, count: scoreData.fingerprintingCount || 0 });
    }
    if (scoreData.longLivedDeduction > 0) {
      deductionItems.push({ label: 'Long-lived Cookies', value: -scoreData.longLivedDeduction, count: scoreData.longLivedCount || 0 });
    }
    if (scoreData.insecureDeduction > 0) {
      deductionItems.push({ label: 'Insecure Cookies', value: -scoreData.insecureDeduction, count: scoreData.insecureCount || 0 });
    }
    if (scoreData.storageDeduction > 0) {
      deductionItems.push({ label: 'Large Storage', value: -scoreData.storageDeduction, count: null });
    }
  }

  // If score isn't 100 but no deductions found, calculate implied deduction
  if (deductionItems.length === 0 && scoreValue < 100) {
    const totalDeduction = 100 - scoreValue;
    deductionItems.push({
      label: 'Privacy Issues Detected',
      tip: 'Run a fresh scan to see detailed breakdown',
      value: -totalDeduction,
      count: null
    });
  }

  if (deductionItems.length === 0) {
    breakdownList.innerHTML = '<div class="no-data perfect-score">Perfect score! No privacy concerns detected.</div>';
    return;
  }

  // Sort by severity (highest deduction first)
  deductionItems.sort((a, b) => a.value - b.value);

  breakdownList.innerHTML = deductionItems
    .map(item => `
      <div class="list-item breakdown-item">
        <div class="list-item-main">
          <div class="breakdown-info">
            <div class="list-item-name">${item.label}</div>
            ${item.count !== null ? `<div class="list-item-meta">${item.count} detected</div>` : ''}
            ${item.tip ? `<div class="breakdown-tip">${item.tip}</div>` : ''}
          </div>
          <span class="list-item-badge deduction">${item.value}</span>
        </div>
      </div>
    `)
    .join('');
}

// ============================================================================
// SCORE HISTORY FUNCTIONS
// ============================================================================

/**
 * Setup score history filter listeners
 */
function setupScoreHistoryListeners() {
  document.querySelectorAll('.history-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const range = e.target.dataset.range;

      // Update active state
      document.querySelectorAll('.history-filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      // Update state and re-render
      scoreHistoryState.timeRange = range;
      renderScoreHistory();
    });
  });
}

/**
 * Load score history from storage
 */
async function loadScoreHistory() {
  try {
    const result = await chrome.storage.local.get(['scoreHistory']);
    if (result.scoreHistory && Array.isArray(result.scoreHistory)) {
      scoreHistoryState.scans = result.scoreHistory;
      debug.log(`📜 Loaded ${scoreHistoryState.scans.length} scans from history`);
      renderScoreHistory();
    }
  } catch (error) {
    debug.error('Error loading score history:', error);
  }
}

/**
 * Save a new scan to history
 */
async function saveToScoreHistory(data) {
  try {
    const privacyScore = data.privacyScore || data._privacyAnalysis?.privacyScore || { score: 0 };
    const scoreValue = typeof privacyScore === 'object' ? privacyScore.score : privacyScore;

    const scanRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      privacyScore: scoreValue,
      totalCookies: data.totalCookies || 0,
      trackingCookies: data.trackingCookies || 0,
      uniqueDomains: data.uniqueDomains || 0,
      totalStorageMB: data.totalStorageMB || 0
    };

    // Add to beginning of array
    scoreHistoryState.scans.unshift(scanRecord);

    // Trim to max scans
    if (scoreHistoryState.scans.length > scoreHistoryState.maxScans) {
      scoreHistoryState.scans = scoreHistoryState.scans.slice(0, scoreHistoryState.maxScans);
    }

    // Save to storage
    await chrome.storage.local.set({ scoreHistory: scoreHistoryState.scans });
    debug.log(`💾 Saved scan to history. Total scans: ${scoreHistoryState.scans.length}`);

    // Re-render history
    renderScoreHistory();
  } catch (error) {
    debug.error('Error saving to score history:', error);
  }
}

/**
 * Calculate history statistics for current time range
 */
function calculateHistoryStats() {
  const now = Date.now();
  const cutoffs = {
    '7days': 7 * 24 * 60 * 60 * 1000,
    '30days': 30 * 24 * 60 * 60 * 1000,
    'all': Infinity
  };

  const cutoff = cutoffs[scoreHistoryState.timeRange];
  const filteredScans = scoreHistoryState.scans.filter(scan =>
    now - scan.timestamp < cutoff
  );

  if (filteredScans.length === 0) {
    return {
      average: 0,
      best: 0,
      worst: 0,
      totalCookiesCleared: 0,
      trend: 'stable',
      scans: []
    };
  }

  const scores = filteredScans.map(s => s.privacyScore);
  const average = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  const best = Math.max(...scores);
  const worst = Math.min(...scores);

  // Calculate trend (compare first half to second half)
  let trend = 'stable';
  if (scores.length >= 2) {
    const midpoint = Math.floor(scores.length / 2);
    // Note: scans are sorted newest first, so we need to reverse for trend calculation
    const reversedScores = [...scores].reverse();
    const firstHalf = reversedScores.slice(0, midpoint || 1);
    const secondHalf = reversedScores.slice(midpoint || 1);
    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;

    if (diff > 5) trend = 'improving';
    else if (diff < -5) trend = 'declining';
  }

  // Approximate cookies cleared (difference between consecutive scans)
  let totalCookiesCleared = 0;
  const sortedScans = [...filteredScans].sort((a, b) => a.timestamp - b.timestamp);
  for (let i = 1; i < sortedScans.length; i++) {
    const prev = sortedScans[i - 1];
    const curr = sortedScans[i];
    const cleared = Math.max(0, prev.totalCookies - curr.totalCookies);
    totalCookiesCleared += cleared;
  }

  return {
    average,
    best,
    worst,
    totalCookiesCleared,
    trend,
    scans: filteredScans
  };
}

/**
 * Get score color class
 */
function getScoreColorClass(score) {
  if (score >= 70) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Render score history UI
 */
function renderScoreHistory() {
  const stats = calculateHistoryStats();

  // Update stat values
  if (historyAvgScore) {
    historyAvgScore.textContent = stats.scans.length > 0 ? stats.average : '—';
  }
  if (historyBestScore) {
    historyBestScore.textContent = stats.scans.length > 0 ? stats.best : '—';
  }
  if (historyWorstScore) {
    historyWorstScore.textContent = stats.scans.length > 0 ? stats.worst : '—';
  }
  if (historyCleared) {
    historyCleared.textContent = stats.scans.length > 0 ? stats.totalCookiesCleared : '—';
  }
  if (historyTrend) {
    historyTrend.textContent = stats.scans.length > 0 ? stats.trend : '—';
    historyTrend.className = `stat-value stat-trend ${stats.trend}`;
  }

  // Update trend icon
  if (historyTrendIcon) {
    historyTrendIcon.className = `stat-icon stat-icon-trend ${stats.trend}`;
    const iconSvg = historyTrendIcon.querySelector('svg');
    if (iconSvg) {
      if (stats.trend === 'improving') {
        iconSvg.innerHTML = '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>';
      } else if (stats.trend === 'declining') {
        iconSvg.innerHTML = '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline>';
      } else {
        iconSvg.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>';
      }
    }
  }

  // Render recent scans list
  if (recentScansList) {
    if (stats.scans.length === 0) {
      recentScansList.innerHTML = '<p class="no-data">No scan history yet</p>';
    } else {
      // Show most recent 10 scans
      const recentScans = stats.scans.slice(0, 10);
      recentScansList.innerHTML = recentScans.map(scan => {
        const date = new Date(scan.timestamp);
        const dateStr = date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const colorClass = getScoreColorClass(scan.privacyScore);

        return `
          <div class="scan-history-item">
            <div class="scan-history-left">
              <div class="scan-score-dot ${colorClass}"></div>
              <div class="scan-history-info">
                <span class="scan-history-date">${dateStr}</span>
                <span class="scan-history-meta">${scan.totalCookies} cookies • ${scan.uniqueDomains} domains</span>
              </div>
            </div>
            <span class="scan-history-score ${colorClass}">${scan.privacyScore}</span>
          </div>
        `;
      }).join('');
    }
  }
}

/**
 * Display scan results
 */
function displayResults(data) {
  // Use pre-computed privacy analysis from service worker
  const privacyAnalysis = data._privacyAnalysis || null;
  debug.log('📊 Privacy Analysis:', privacyAnalysis);

  // Update basic metrics
  totalDomainsEl.textContent = data.uniqueDomains || 0;
  totalCookiesEl.textContent = data.totalCookies || 0;
  trackingCookiesEl.textContent = data.trackingCookies || 0;
  totalStorageEl.textContent = `${data.totalStorageMB || 0} MB`;

  // Display privacy score
  const privacyScore = data.privacyScore || privacyAnalysis?.privacyScore || { score: 0 };
  const scoreValue = typeof privacyScore === 'object' ? privacyScore.score : privacyScore;
  privacyScoreEl.textContent = `${scoreValue}/100`;

  // Update privacy card color based on score
  const privacyCard = document.querySelector('.privacy-card');
  if (privacyCard) {
    privacyCard.classList.remove('score-good', 'score-fair', 'score-poor');

    if (scoreValue >= 70) {
      privacyCard.classList.add('score-good');
    } else if (scoreValue >= 40) {
      privacyCard.classList.add('score-fair');
    } else {
      privacyCard.classList.add('score-poor');
    }
  }

  // Store full analysis for detailed view
  if (privacyAnalysis) {
    currentScanData.privacyAnalysis = privacyAnalysis;

    // Display detailed analysis
    displayDetailedAnalysis(privacyAnalysis);
  }

  // Populate all detail pages
  populateCookiesPage(data);
  populateTrackingPage(data);
  populateDomainsPage(data);
  populateStoragePage(data);
  populateScorePage(data);
}

/**
 * Display detailed privacy analysis with collapsible sections
 */
function displayDetailedAnalysis(analysis) {
  // Show the analysis section
  analysisSectionEl.style.display = 'block';

  // Display recommendations
  const recommendations = analysis.recommendations || [];
  recommendationsCount.textContent = recommendations.length;

  if (recommendations.length > 0) {
    recommendationsEl.innerHTML = recommendations
      .slice(0, 5) // Show top 5 recommendations
      .map((rec, index) => {
        const title = typeof rec === 'object' ? rec.title : rec;
        const description = typeof rec === 'object' ? rec.description : '';
        const icon = typeof rec === 'object' ? (rec.icon || '💡') : '💡';
        const severity = typeof rec === 'object' ? (rec.severity || 'medium') : 'medium';
        const action = typeof rec === 'object' ? rec.action : null;
        const items = typeof rec === 'object' ? rec.items : null;

        // Generate expandable details if items exist - using native details element
        const detailsHtml = items && items.length > 0 ? `
          <details class="rec-details-accordion">
            <summary class="rec-details-summary">View ${items.length} item${items.length !== 1 ? 's' : ''}</summary>
            <div class="rec-details-body">
              ${items.slice(0, 8).map(item => {
          const name = item.name || item.domain || item.key || 'Unknown';
          const domain = item.domain || '';
          return `<div class="rec-detail-row">
                  <span class="detail-name" title="${name}">${name}</span>
                  ${domain && domain !== name ? `<span class="detail-domain">${domain}</span>` : ''}
                </div>`;
        }).join('')}
              ${items.length > 8 ? `<div class="rec-detail-more">...and ${items.length - 8} more</div>` : ''}
            </div>
          </details>
        ` : '';

        return `
          <div class="recommendation-item ${severity}">
            <div class="recommendation-badge">${index + 1}</div>
            <div class="recommendation-content">
              <div class="recommendation-header">
                <span class="recommendation-title">${title}</span>
                ${action ? `<button class="recommendation-action-btn" data-action="${action}">Fix</button>` : ''}
              </div>
              ${description ? `<p class="recommendation-desc">${description}</p>` : ''}
              ${detailsHtml}
            </div>
          </div>
        `;
      })
      .join('');

    // Attach event listeners to action buttons
    document.querySelectorAll('.recommendation-action-btn').forEach(btn => {
      btn.addEventListener('click', handleRecommendationAction);
    });

    // Auto-expand if there are recommendations
    recommendationsCard.classList.add('expanded');
    recommendationsHeader.setAttribute('aria-expanded', 'true');
  } else {
    recommendationsEl.innerHTML = '<p class="no-data">No recommendations - your privacy looks good! 🎉</p>';
    recommendationsCard.classList.remove('expanded');
    recommendationsHeader.setAttribute('aria-expanded', 'false');
  }

  // Display high-risk items
  const highRiskItems = analysis.highRiskItems || [];
  highRiskCount.textContent = highRiskItems.length;

  if (highRiskItems.length > 0) {
    highRiskItemsEl.innerHTML = highRiskItems
      .map(item => {
        const severityClass = item.severity || 'medium';
        const severityIcon = item.severity === 'critical' ? '🔴' : '⚠️';

        // Map item types to actions
        const actionMap = {
          'fingerprinting': 'CLEAR_FINGERPRINTING',
          'cross_site_tracking': 'CLEAR_TRACKING',
          'large_storage': 'CLEAR_LOCALSTORAGE',
          'insecure_sensitive': 'CLEAR_INSECURE'
        };

        const action = item.type ? actionMap[item.type] : null;
        const actionLabel = action === 'CLEAR_LOCALSTORAGE' ? 'Clear' :
          action === 'CLEAR_FINGERPRINTING' ? 'Remove' :
            action === 'CLEAR_TRACKING' ? 'Clear' :
              action === 'CLEAR_INSECURE' ? 'Clear' : 'Fix';

        // Generate unique ID for this item's details section
        const itemId = `risk-details-${item.type || Math.random().toString(36).substr(2, 9)}`;

        // Format individual items for expandable details - matching dashboard style
        const detailsHtml = item.items && item.items.length > 0 ? `
          <details class="risk-details-accordion">
            <summary class="risk-details-summary">View ${item.items.length} detected item${item.items.length !== 1 ? 's' : ''}</summary>
            <div class="risk-details-body">
              ${item.items.slice(0, 10).map(detail => {
          // Handle different item structures - prioritize name/tracker over domain for display
          const name = detail.name || detail.tracker || detail.key || (typeof detail === 'string' ? detail : null);
          const domain = detail.domain || '';
          const size = detail.size ? formatBytes(detail.size) : '';

          // If no name found, use domain as name
          const displayName = name || domain || 'Unknown';

          return `<div class="risk-detail-row">
                  <span class="detail-name" title="${displayName}">${displayName}</span>
                  ${domain ? `<span class="detail-domain">${domain}</span>` : ''}
                  ${size ? `<span class="detail-size">${size}</span>` : ''}
                </div>`;
        }).join('')}
              ${item.items.length > 10 ? `<div class="risk-detail-more">...and ${item.items.length - 10} more</div>` : ''}
            </div>
          </details>
        ` : '';

        return `
          <div class="high-risk-item ${severityClass}">
            <div class="risk-header">
              <span class="risk-icon">${severityIcon}</span>
              <strong>${item.title}</strong>
              ${action ? `<button class="high-risk-action-btn" data-action="${action}">${actionLabel}</button>` : ''}
            </div>
            <p class="risk-description">${item.description}</p>
            ${detailsHtml}
          </div>
        `;
      })
      .join('');

    // Attach event listeners to high-risk action buttons
    document.querySelectorAll('.high-risk-action-btn').forEach(btn => {
      btn.addEventListener('click', handleHighRiskAction);
    });

    // Auto-expand if there are high-risk items
    highRiskCard.classList.add('expanded');
    highRiskHeader.setAttribute('aria-expanded', 'true');
  } else {
    highRiskItemsEl.innerHTML = '<p class="no-data">No high-risk items detected ✅</p>';
    highRiskCard.classList.remove('expanded');
    highRiskHeader.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Compute tracker companies from scan data
 */
function computeTrackerCompanies(scanData) {
  if (!scanData?.cookies?.cookies) return [];

  const companyMap = new Map();
  const cookies = scanData.cookies.cookies;

  // Known company patterns (simplified version - service worker has full database)
  const companyPatterns = {
    'Google': [/google/, /doubleclick/, /googlesyndication/, /googleadservices/, /gstatic/, /youtube/],
    'Facebook': [/facebook/, /fb\./, /fbcdn/, /instagram/],
    'Microsoft': [/microsoft/, /bing/, /msn/, /live\.com/, /outlook/],
    'Amazon': [/amazon/, /amazonaws/],
    'Twitter': [/twitter/, /twimg/],
    'Adobe': [/adobe/, /omtrdc/, /demdex/],
    'Oracle': [/bluekai/, /addthis/],
    'Criteo': [/criteo/],
    'LinkedIn': [/linkedin/],
    'TikTok': [/tiktok/, /bytedance/],
    'Pinterest': [/pinterest/],
    'Snapchat': [/snapchat/, /snap\./, /sc-static/],
    'Yahoo': [/yahoo/],
    'Quantcast': [/quantcast/, /quantserve/],
    'Hotjar': [/hotjar/],
    'Mixpanel': [/mixpanel/, /mxpnl/],
    'Segment': [/segment/],
    'Hubspot': [/hubspot/, /hs-analytics/],
    'Salesforce': [/salesforce/, /pardot/, /exacttarget/],
  };

  cookies.forEach(cookie => {
    const domain = cookie.domain.toLowerCase();

    for (const [company, patterns] of Object.entries(companyPatterns)) {
      if (patterns.some(p => p.test(domain))) {
        if (!companyMap.has(company)) {
          companyMap.set(company, {
            name: company,
            domains: [],
            cookieCount: 0,
            category: getCompanyCategory(company),
            risk: getCompanyRisk(company)
          });
        }
        const companyData = companyMap.get(company);
        if (!companyData.domains.includes(cookie.domain)) {
          companyData.domains.push(cookie.domain);
        }
        companyData.cookieCount++;
        break; // Only count once per cookie
      }
    }
  });

  return Array.from(companyMap.values());
}

function getCompanyCategory(company) {
  const categories = {
    'Google': 'Analytics',
    'Facebook': 'Social',
    'Microsoft': 'Advertising',
    'Amazon': 'Advertising',
    'Twitter': 'Social',
    'Adobe': 'Analytics',
    'Oracle': 'Advertising',
    'Criteo': 'Advertising',
    'LinkedIn': 'Social',
    'TikTok': 'Social',
    'Pinterest': 'Social',
    'Snapchat': 'Social',
    'Yahoo': 'Advertising',
    'Quantcast': 'Analytics',
    'Hotjar': 'Analytics',
    'Mixpanel': 'Analytics',
    'Segment': 'Analytics',
    'Hubspot': 'Analytics',
    'Salesforce': 'Advertising',
  };
  return categories[company] || 'Tracking';
}

function getCompanyRisk(company) {
  const highRisk = ['Criteo', 'Oracle', 'Quantcast'];
  const criticalRisk = [];
  if (criticalRisk.includes(company)) return 'critical';
  if (highRisk.includes(company)) return 'high';
  return 'medium';
}

/**
 * Handle delete company trackers button click
 */
async function handleDeleteCompanyTrackers(event) {
  const btn = event.currentTarget;
  const company = btn.dataset.company;
  const domains = btn.dataset.domains.split(',').filter(d => d);

  if (!company || domains.length === 0) return;

  if (!confirm(`Delete all cookies from ${company}? This will remove cookies from ${domains.length} domain${domains.length !== 1 ? 's' : ''}.`)) {
    return;
  }

  // Disable button and show loading
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-small"></span>';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CLEAR_COMPANY_COOKIES',
      data: { company, domains }
    });

    if (response.success) {
      const count = response.data?.removedCount || 0;
      showStatus(`Removed ${count} cookie${count !== 1 ? 's' : ''} from ${company}`, 'success');

      // Refresh data after a short delay
      setTimeout(handleScan, 500);
    } else {
      throw new Error(response.error || 'Failed to delete cookies');
    }
  } catch (error) {
    debug.error('❌ Delete company cookies error:', error);
    showStatus('Failed to delete cookies: ' + error.message, 'error');

    // Re-enable button
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>`;
  }
}

/**
 * Handle recommendation action button click
 */
async function handleRecommendationAction(event) {
  const action = event.target.dataset.action;
  debug.log('🎯 Executing recommendation action:', action);

  if (!action) return;

  // Map actions to message types
  const actionMap = {
    'clear_advertising': { type: 'CLEAR_ADVERTISING', confirmMsg: 'Clear all advertising cookies?' },
    'block_fingerprinting': { type: 'CLEAR_FINGERPRINTING', confirmMsg: 'Clear all fingerprinting trackers?' },
    'remove_facebook_tracking': { type: 'CLEAR_FACEBOOK', confirmMsg: 'Remove Facebook tracking cookies?' },
    'clear_analytics': { type: 'CLEAR_ANALYTICS', confirmMsg: 'Clear all analytics cookies?' },
    'clear_long_lived': { type: 'CLEAR_LONG_LIVED', confirmMsg: 'Clear long-lived tracking cookies?' },
    'clear_localstorage': { type: 'CLEAR_LOCALSTORAGE', confirmMsg: 'Clear excessive localStorage data?' },
  };

  const actionConfig = actionMap[action];
  if (!actionConfig) {
    debug.warn('⚠️ Unknown action:', action);
    return;
  }

  // Confirm action
  if (!confirm(actionConfig.confirmMsg + ' This cannot be undone.')) {
    return;
  }

  // Disable button and show loading
  event.target.disabled = true;
  event.target.textContent = 'Processing...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: actionConfig.type
    });

    if (response.success) {
      const count = response.data?.removedCount || 0;
      debug.log(`✅ Action complete: ${count} items removed`);
      showStatus(`Success! Removed ${count} item${count !== 1 ? 's' : ''}`, 'success');

      // Refresh data after a short delay
      setTimeout(handleScan, 500);
    } else {
      throw new Error(response.error || 'Action failed');
    }
  } catch (error) {
    debug.error('❌ Action error:', error);
    showStatus('Action failed: ' + error.message, 'error');

    // Re-enable button
    event.target.disabled = false;
    event.target.textContent = 'Fix';
  }
}

/**
 * Handle high-risk action button click
 */
async function handleHighRiskAction(event) {
  const action = event.target.dataset.action;
  debug.log('🎯 Executing high-risk action:', action);

  if (!action) return;

  // Map actions to confirmation messages
  const confirmMap = {
    'CLEAR_FINGERPRINTING': 'Remove all fingerprinting trackers? This cannot be undone.',
    'CLEAR_TRACKING': 'Clear all cross-site tracking cookies? This cannot be undone.',
    'CLEAR_LOCALSTORAGE': 'Clear excessive localStorage data? This cannot be undone.',
    'CLEAR_INSECURE': 'Clear insecure cookies on sensitive domains? This cannot be undone.'
  };

  const confirmMsg = confirmMap[action];
  if (!confirmMsg) {
    debug.warn('⚠️ Unknown action:', action);
    return;
  }

  // Confirm action
  if (!confirm(confirmMsg)) {
    return;
  }

  // Disable button and show loading
  event.target.disabled = true;
  const originalText = event.target.textContent;
  event.target.textContent = 'Processing...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: action
    });

    if (response.success) {
      const count = response.data?.removedCount || 0;
      debug.log(`✅ Action complete: ${count} items removed`);
      showStatus(`Success! Removed ${count} item${count !== 1 ? 's' : ''}`, 'success');

      // Refresh data after a short delay
      setTimeout(handleScan, 500);
    } else {
      throw new Error(response.error || 'Action failed');
    }
  } catch (error) {
    debug.error('❌ Action error:', error);
    showStatus('Action failed: ' + error.message, 'error');

    // Re-enable button
    event.target.disabled = false;
    event.target.textContent = originalText;
  }
}

/**
 * Handle clear tracking button click
 */
async function handleClearTracking() {
  if (!confirm('Are you sure you want to clear all tracking cookies? This cannot be undone.')) {
    return;
  }

  debug.log('🗑️ Clearing tracking cookies...');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CLEAR_TRACKING'
    });

    if (response.success) {
      const count = response.data.removedCount;
      debug.log(`✅ Removed ${count} tracking cookies`);
      showStatus(`Removed ${count} tracking cookie${count !== 1 ? 's' : ''}`, 'success');

      // Refresh data after a short delay
      setTimeout(handleScan, 500);
    } else {
      throw new Error(response.error || 'Failed to clear tracking cookies');
    }
  } catch (error) {
    debug.error('❌ Clear tracking error:', error);
    showStatus('Failed to clear tracking cookies', 'error');
  }
}

/**
 * Handle export button click
 */
async function handleExport() {
  debug.log('📤 Exporting data...');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'EXPORT_DATA'
    });

    if (response.success) {
      // Create downloadable JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      // Create temporary download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `storageinsight-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up
      URL.revokeObjectURL(url);

      showStatus('Data exported successfully', 'success');
    } else {
      throw new Error(response.error || 'Export failed');
    }
  } catch (error) {
    debug.error('❌ Export error:', error);
    showStatus('Failed to export data', 'error');
  }
}

/**
 * Open settings view
 */
function openSettings() {
  loadSettings();
  popupContainer.style.display = 'none';
  settingsView.classList.add('active');
}

/**
 * Close settings view
 */
function closeSettings() {
  settingsView.classList.remove('active');
  popupContainer.style.display = 'flex';
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get({
      autoScanEnabled: true,
      scanFrequency: 'daily',
      notifications: true,
      privacyThreshold: 70,
      debugMode: false
    });

    settingsAutoScan.checked = result.autoScanEnabled;
    settingsScanFrequency.value = result.scanFrequency;
    settingsNotifications.checked = result.notifications;
    settingsPrivacyThreshold.value = result.privacyThreshold.toString();
    if (settingsDebugMode) settingsDebugMode.checked = result.debugMode;
  } catch (error) {
    debug.error('Error loading settings:', error);
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  try {
    const debugModeValue = settingsDebugMode?.checked ?? false;

    await chrome.storage.sync.set({
      autoScanEnabled: settingsAutoScan.checked,
      scanFrequency: settingsScanFrequency.value,
      notifications: settingsNotifications.checked,
      privacyThreshold: parseInt(settingsPrivacyThreshold.value, 10),
      debugMode: debugModeValue
    });

    // Also save debugMode to local storage for the debug utility
    await chrome.storage.local.set({ debugMode: debugModeValue });

    showStatus('Settings saved', 'success');
    closeSettings();
  } catch (error) {
    debug.error('Error saving settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  settingsAutoScan.checked = true;
  settingsScanFrequency.value = 'daily';
  settingsNotifications.checked = true;
  settingsPrivacyThreshold.value = '70';
  if (settingsDebugMode) settingsDebugMode.checked = false;
  await chrome.storage.local.set({ debugMode: false });
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  return 'just now';
}

// ============================================================================
// INDEXEDDB BROWSER LOGIC
// ============================================================================

function setupIDBBrowserListeners() {
  if (idbBackBtn) idbBackBtn.addEventListener('click', handleIDBBack);
  if (idbPrevPage) idbPrevPage.addEventListener('click', () => changeIDBPage(-1));
  if (idbNextPage) idbNextPage.addEventListener('click', () => changeIDBPage(1));

  // Delegation for list items
  if (idbContent) {
    idbContent.addEventListener('click', handleIDBContentClick);
  }
}

async function loadIDBDatabases() {
  idbBrowserState.view = 'dbs';
  idbBrowserState.currentDb = null;
  idbBrowserState.currentStore = null;
  updateIDBBreadcrumbs();

  // Use the already-scanned IndexedDB data from storagePageState
  // This avoids trying to relay messages to content scripts which may not be loaded
  if (storagePageState.indexedDB && storagePageState.indexedDB.length > 0) {
    // Transform the scanned data into the format expected by the IDB browser
    idbBrowserState.databases = storagePageState.indexedDB.map(db => ({
      name: db.name || 'Unknown',
      version: db.version || 1,
      domain: db.domain || 'Unknown',
      objectStores: db.objectStores || []
    }));
    renderIDBDatabases();
    return;
  }

  // Fall back to trying to get fresh data if no cached data
  if (idbContent) idbContent.innerHTML = '<div class="scan-loader active"><div class="spinner"></div><span>Loading databases...</span></div>';

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_IDB_DBS' });
    if (response && response.success) {
      idbBrowserState.databases = response.data || [];
      renderIDBDatabases();
    } else {
      // If relay fails, show empty state instead of error
      idbBrowserState.databases = [];
      renderIDBDatabases();
    }
  } catch (error) {
    debug.error('Error loading IDB databases:', error);
    // Show empty state instead of error - relay to content script may not work
    idbBrowserState.databases = [];
    renderIDBDatabases();
  }
}

function renderIDBDatabases() {
  if (!idbContent) return;

  if (idbBrowserState.databases.length === 0) {
    idbContent.innerHTML = '<p class="no-data">No IndexedDB databases found</p>';
    return;
  }

  idbContent.innerHTML = idbBrowserState.databases.map(db => `
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

  if (idbPagination) idbPagination.style.display = 'none';
}

async function loadIDBStores(dbName) {
  idbBrowserState.view = 'stores';
  idbBrowserState.currentDb = dbName;
  updateIDBBreadcrumbs();

  // Try to get stores from already-scanned data first
  const cachedDb = storagePageState.indexedDB.find(db => db.name === dbName);
  if (cachedDb && cachedDb.objectStores && cachedDb.objectStores.length > 0) {
    idbBrowserState.stores = cachedDb.objectStores;
    renderIDBStores();
    return;
  }

  // Fall back to trying to get fresh data
  if (idbContent) idbContent.innerHTML = '<div class="scan-loader active"><div class="spinner"></div><span>Loading object stores...</span></div>';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_IDB_STORES',
      dbName: dbName
    });

    if (response && response.success) {
      idbBrowserState.stores = response.data || [];
      renderIDBStores();
    } else {
      // Show empty state instead of error
      idbBrowserState.stores = [];
      renderIDBStores();
    }
  } catch (error) {
    debug.error('Error loading IDB stores:', error);
    // Show empty state instead of error
    idbBrowserState.stores = [];
    renderIDBStores();
  }
}

function renderIDBStores() {
  if (!idbContent) return;

  if (idbBrowserState.stores.length === 0) {
    idbContent.innerHTML = '<p class="no-data">No object stores found in this database</p>';
    return;
  }

  idbContent.innerHTML = idbBrowserState.stores.map(store => `
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

  if (idbPagination) idbPagination.style.display = 'none';
}

async function loadIDBRecords(dbName, storeName, page = 1) {
  idbBrowserState.view = 'records';
  idbBrowserState.currentDb = dbName;
  idbBrowserState.currentStore = storeName;
  idbBrowserState.page = page;
  updateIDBBreadcrumbs();

  if (idbContent) idbContent.innerHTML = '<div class="scan-loader active"><div class="spinner"></div><span>Loading records...</span></div>';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_INDEXEDDB_PAGE',
      dbName: dbName,
      storeName: storeName,
      page: page,
      pageSize: idbBrowserState.pageSize,
      includeValues: true
    });

    if (response && response.success) {
      idbBrowserState.records = response.data.items || [];
      idbBrowserState.totalRecords = response.data.total || 0;
      renderIDBRecords();
    } else {
      // Show helpful message - browsing records requires active tab with database
      idbBrowserState.records = [];
      idbBrowserState.totalRecords = 0;
      if (idbContent) {
        idbContent.innerHTML = `
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
      if (idbPagination) idbPagination.style.display = 'none';
    }
  } catch (error) {
    debug.error('Error loading IDB records:', error);
    // Show helpful message instead of error
    idbBrowserState.records = [];
    idbBrowserState.totalRecords = 0;
    if (idbContent) {
      idbContent.innerHTML = `
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
    if (idbPagination) idbPagination.style.display = 'none';
  }
}

function renderIDBRecords() {
  if (!idbContent) return;

  if (idbBrowserState.records.length === 0) {
    idbContent.innerHTML = '<p class="no-data">No records found</p>';
    if (idbPagination) idbPagination.style.display = 'none';
    return;
  }

  idbContent.innerHTML = idbBrowserState.records.map(record => {
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

function updateIDBPagination() {
  if (!idbPagination) return;

  const totalPages = Math.ceil(idbBrowserState.totalRecords / idbBrowserState.pageSize);

  if (totalPages > 1) {
    idbPagination.style.display = 'flex';
    if (idbCurrentPage) idbCurrentPage.textContent = `${idbBrowserState.page} of ${totalPages}`;
    if (idbPrevPage) idbPrevPage.disabled = idbBrowserState.page <= 1;
    if (idbNextPage) idbNextPage.disabled = idbBrowserState.page >= totalPages;
  } else {
    idbPagination.style.display = 'none';
  }
}

function changeIDBPage(delta) {
  const newPage = idbBrowserState.page + delta;
  const totalPages = Math.ceil(idbBrowserState.totalRecords / idbBrowserState.pageSize);

  if (newPage >= 1 && newPage <= totalPages) {
    loadIDBRecords(idbBrowserState.currentDb, idbBrowserState.currentStore, newPage);
  }
}

function handleIDBContentClick(e) {
  // Handle DB click
  const dbItem = e.target.closest('.db-item');
  if (dbItem) {
    const dbName = dbItem.dataset.name;
    loadIDBStores(dbName);
    return;
  }

  // Handle Store click
  const storeItem = e.target.closest('.store-item');
  if (storeItem) {
    const storeName = storeItem.dataset.name;
    loadIDBRecords(idbBrowserState.currentDb, storeName);
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

    handleIDBDelete(idbBrowserState.currentDb, idbBrowserState.currentStore, parsedKey);
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
      showStatus('Record deleted successfully', 'success');
      loadIDBRecords(dbName, storeName, idbBrowserState.page);
    } else {
      throw new Error(response.error || 'Failed to delete record');
    }
  } catch (error) {
    debug.error('Error deleting IDB record:', error);
    showStatus('Error deleting record', 'error');
  }
}

function handleIDBBack() {
  if (idbBrowserState.view === 'records') {
    loadIDBStores(idbBrowserState.currentDb);
  } else if (idbBrowserState.view === 'stores') {
    loadIDBDatabases();
  }
}

function updateIDBBreadcrumbs() {
  if (!idbBreadcrumbs) return;

  let html = '<span class="crumb" data-level="dbs">Databases</span>';

  if (idbBrowserState.view === 'stores' || idbBrowserState.view === 'records') {
    html += ` <span class="separator">/</span> <span class="crumb" data-level="stores">${idbBrowserState.currentDb}</span>`;
  }

  if (idbBrowserState.view === 'records') {
    html += ` <span class="separator">/</span> <span class="crumb active">${idbBrowserState.currentStore}</span>`;
  }

  idbBreadcrumbs.innerHTML = html;

  // Add click listeners to crumbs
  const crumbs = idbBreadcrumbs.querySelectorAll('.crumb');
  crumbs.forEach(crumb => {
    crumb.addEventListener('click', () => {
      const level = crumb.dataset.level;
      if (level === 'dbs') loadIDBDatabases();
      if (level === 'stores') loadIDBStores(idbBrowserState.currentDb);
    });
  });

  // Update back button visibility
  if (idbBackBtn) {
    idbBackBtn.style.display = idbBrowserState.view === 'dbs' ? 'none' : 'flex';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

debug.log('✅ Popup script loaded');
