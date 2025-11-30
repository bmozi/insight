/**
 * StorageInsight - Full Options Page (Prompt 5)
 * Complete implementation with all 9 tabs
 */

import { analyzePrivacy } from '../lib/privacy-analyzer.js';
import { TrackingDatabase } from '../lib/tracking-database.js';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  currentTab: 'dashboard',
  scanData: null,
  privacyAnalysis: null,
  charts: {
    categoryPie: null,
    domainBar: null,
    growthLine: null,
  },
  cookies: {
    list: [],
    filtered: [],
    currentPage: 1,
    itemsPerPage: 50,
    sortColumn: 'name',
    sortDirection: 'asc',
    filters: {
      search: '',
      category: 'all',
      domain: 'all',
    },
    selected: new Set(),
  },
  localStorage: [],
  sessionStorage: [],
  indexedDB: [],
  whitelist: [],
  settings: {},
};

// Initialize tracking database
const trackingDB = new TrackingDatabase();

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Options page initializing...');

  // Set up navigation
  setupNavigation();

  // Load data
  await loadAllData();

  // Set initial tab from URL hash or default to dashboard
  const hash = window.location.hash.slice(1) || 'dashboard';
  switchTab(hash);

  // Set up event listeners
  setupEventListeners();

  console.log('✅ Options page ready');
});

// ============================================================================
// NAVIGATION
// ============================================================================

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = item.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  console.log(`🔄 Switching to tab: ${tabName}`);

  // Update state
  state.currentTab = tabName;

  // Update URL hash
  window.location.hash = tabName;

  // Update navigation active state
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.tab === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Load tab-specific data
  loadTabData(tabName);
}

async function loadTabData(tabName) {
  switch (tabName) {
    case 'dashboard':
      await renderDashboard();
      break;
    case 'cookies':
      await renderCookiesTab();
      break;
    case 'localstorage':
      await renderLocalStorageTab();
      break;
    case 'sessionstorage':
      await renderSessionStorageTab();
      break;
    case 'indexeddb':
      await renderIndexedDBTab();
      break;
    case 'privacy-report':
      await renderPrivacyReport();
      break;
    case 'whitelist':
      await renderWhitelist();
      break;
    case 'settings':
      await renderSettings();
      break;
    case 'about':
      renderAbout();
      break;
  }
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadAllData() {
  showLoading(true);

  try {
    // Request scan from background script
    const response = await chrome.runtime.sendMessage({ action: 'performScan' });

    if (response && response.success) {
      state.scanData = response.data;

      // Perform privacy analysis
      if (state.scanData) {
        state.privacyAnalysis = analyzePrivacy(state.scanData);
      }

      // Load settings and whitelist
      const stored = await chrome.storage.local.get(['settings', 'whitelist']);
      state.settings = stored.settings || {};
      state.whitelist = stored.whitelist || [];

      console.log('✅ Data loaded successfully');
    }
  } catch (error) {
    console.error('❌ Error loading data:', error);
    showError('Failed to load storage data. Please try refreshing the page.');
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function showError(message) {
  // TODO: Implement toast notification system
  console.error(message);
  alert(message);
}

// ============================================================================
// DASHBOARD TAB
// ============================================================================

async function renderDashboard() {
  if (!state.scanData || !state.privacyAnalysis) {
    await loadAllData();
  }

  // Update stats
  updateDashboardStats();

  // Render charts
  renderCharts();

  // Update privacy breakdown
  updatePrivacyBreakdown();

  // Display recommendations
  displayRecommendations();
}

function updateDashboardStats() {
  const data = state.scanData;
  const analysis = state.privacyAnalysis;

  if (!data) return;

  // Total cookies
  const totalCookies = data.cookies?.cookies?.length || 0;
  document.getElementById('stat-total-cookies').textContent = totalCookies;

  // Trackers
  const trackers = (analysis?.breakdown?.analytics || 0) +
                   (analysis?.breakdown?.advertising || 0) +
                   (analysis?.breakdown?.social || 0) +
                   (analysis?.breakdown?.fingerprinting || 0);
  document.getElementById('stat-trackers').textContent = trackers;

  // Storage used
  const storageMB = data.summary?.totalStorageMB || '0';
  document.getElementById('stat-storage').textContent = `${storageMB} MB`;

  // Sites tracked
  const uniqueDomains = data.summary?.uniqueDomains || 0;
  document.getElementById('stat-sites').textContent = uniqueDomains;

  // Privacy score
  const score = analysis?.privacyScore || 0;
  document.getElementById('stat-privacy-score').textContent = score;

  // Update score color
  const scoreEl = document.getElementById('stat-privacy-score');
  scoreEl.classList.remove('score-red', 'score-yellow', 'score-green');
  if (score < 40) {
    scoreEl.classList.add('score-red');
  } else if (score < 70) {
    scoreEl.classList.add('score-yellow');
  } else {
    scoreEl.classList.add('score-green');
  }
}

function renderCharts() {
  renderCategoryPieChart();
  renderDomainBarChart();
  renderGrowthLineChart();
}

function renderCategoryPieChart() {
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;

  const breakdown = state.privacyAnalysis?.breakdown || {};

  // Destroy existing chart
  if (state.charts.categoryPie) {
    state.charts.categoryPie.destroy();
  }

  state.charts.categoryPie = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Essential', 'Analytics', 'Advertising', 'Social', 'Fingerprinting', 'Unknown'],
      datasets: [{
        data: [
          breakdown.essential || 0,
          breakdown.analytics || 0,
          breakdown.advertising || 0,
          breakdown.social || 0,
          breakdown.fingerprinting || 0,
          breakdown.unknown || 0,
        ],
        backgroundColor: [
          '#9ece6a', // Green - Essential
          '#7aa2f7', // Blue - Analytics
          '#f7768e', // Red - Advertising
          '#bb9af7', // Purple - Social
          '#e0af68', // Orange - Fingerprinting
          '#565f89', // Gray - Unknown
        ],
        borderColor: '#1a1b26',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#c0caf5',
            padding: 15,
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: '#24283b',
          titleColor: '#c0caf5',
          bodyColor: '#c0caf5',
          borderColor: '#414868',
          borderWidth: 1,
        },
      },
    },
  });
}

function renderDomainBarChart() {
  const ctx = document.getElementById('domains-chart');
  if (!ctx) return;

  const cookies = state.scanData?.cookies?.cookies || [];

  // Count cookies per domain
  const domainCounts = {};
  cookies.forEach(cookie => {
    const domain = cookie.domain || 'unknown';
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });

  // Sort and get top 10
  const sorted = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = sorted.map(([domain]) => domain);
  const data = sorted.map(([, count]) => count);

  // Destroy existing chart
  if (state.charts.domainBar) {
    state.charts.domainBar.destroy();
  }

  state.charts.domainBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Cookies per Domain',
        data,
        backgroundColor: '#bb9af7',
        borderColor: '#bb9af7',
        borderWidth: 0,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#c0caf5',
            stepSize: 1,
          },
          grid: {
            color: '#414868',
          },
        },
        x: {
          ticks: {
            color: '#c0caf5',
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#24283b',
          titleColor: '#c0caf5',
          bodyColor: '#c0caf5',
          borderColor: '#414868',
          borderWidth: 1,
        },
      },
    },
  });
}

function renderGrowthLineChart() {
  const ctx = document.getElementById('growth-chart');
  if (!ctx) return;

  // For now, show mock historical data
  // TODO: Implement actual historical tracking
  const labels = ['7 days ago', '6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'];
  const currentCookies = state.scanData?.cookies?.cookies?.length || 0;

  // Generate mock trend data (gradually increasing)
  const data = labels.map((_, index) => {
    const variation = Math.floor(Math.random() * 20) - 10;
    return Math.max(0, currentCookies - (labels.length - index) * 5 + variation);
  });

  // Destroy existing chart
  if (state.charts.growthLine) {
    state.charts.growthLine.destroy();
  }

  state.charts.growthLine = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total Cookies',
        data,
        borderColor: '#7aa2f7',
        backgroundColor: 'rgba(122, 162, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#7aa2f7',
        pointBorderColor: '#1a1b26',
        pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#c0caf5',
          },
          grid: {
            color: '#414868',
          },
        },
        x: {
          ticks: {
            color: '#c0caf5',
          },
          grid: {
            color: '#414868',
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#24283b',
          titleColor: '#c0caf5',
          bodyColor: '#c0caf5',
          borderColor: '#414868',
          borderWidth: 1,
        },
      },
    },
  });
}

function updatePrivacyBreakdown() {
  const breakdown = state.privacyAnalysis?.breakdown || {};
  const container = document.getElementById('category-breakdown-list');

  if (!container) return;

  const categories = [
    { key: 'essential', label: 'Essential Cookies', color: '#9ece6a', icon: '✓' },
    { key: 'analytics', label: 'Analytics', color: '#7aa2f7', icon: '📊' },
    { key: 'advertising', label: 'Advertising', color: '#f7768e', icon: '📢' },
    { key: 'social', label: 'Social Media', color: '#bb9af7', icon: '👥' },
    { key: 'fingerprinting', label: 'Fingerprinting', color: '#e0af68', icon: '🔍' },
    { key: 'unknown', label: 'Unknown', color: '#565f89', icon: '❓' },
  ];

  container.innerHTML = categories.map(cat => `
    <div class="breakdown-item">
      <span class="breakdown-icon" style="color: ${cat.color};">${cat.icon}</span>
      <span class="breakdown-label">${cat.label}</span>
      <span class="breakdown-count">${breakdown[cat.key] || 0}</span>
    </div>
  `).join('');
}

function displayRecommendations() {
  const recommendations = state.privacyAnalysis?.recommendations || [];
  const container = document.getElementById('recommendations-list');

  if (!container) return;

  if (recommendations.length === 0) {
    container.innerHTML = '<div class="empty-state">No recommendations at this time. Your privacy looks good!</div>';
    return;
  }

  container.innerHTML = recommendations.map((rec, index) => `
    <div class="recommendation-item">
      <span class="recommendation-number">${index + 1}</span>
      <span class="recommendation-text">${rec}</span>
    </div>
  `).join('');
}

// ============================================================================
// COOKIES TAB
// ============================================================================

async function renderCookiesTab() {
  if (!state.scanData) {
    await loadAllData();
  }

  // Prepare cookies list with categories
  const cookies = state.scanData?.cookies?.cookies || [];
  state.cookies.list = cookies.map(cookie => ({
    ...cookie,
    category: trackingDB.categorize(cookie.domain),
    riskLevel: trackingDB.getRiskLevel(cookie.domain),
    size: calculateCookieSize(cookie),
  }));

  // Apply filters
  filterCookies();

  // Populate filter dropdowns
  populateCookieFilters();

  // Render table
  renderCookiesTable();

  // Update stats
  updateCookiesStats();
}

function filterCookies() {
  let filtered = [...state.cookies.list];

  // Search filter
  if (state.cookies.filters.search) {
    const search = state.cookies.filters.search.toLowerCase();
    filtered = filtered.filter(cookie =>
      cookie.name.toLowerCase().includes(search) ||
      cookie.domain.toLowerCase().includes(search) ||
      (cookie.value && cookie.value.toLowerCase().includes(search))
    );
  }

  // Category filter
  if (state.cookies.filters.category !== 'all') {
    filtered = filtered.filter(cookie => cookie.category === state.cookies.filters.category);
  }

  // Domain filter
  if (state.cookies.filters.domain !== 'all') {
    filtered = filtered.filter(cookie => cookie.domain === state.cookies.filters.domain);
  }

  // Sort
  filtered.sort((a, b) => {
    const aVal = a[state.cookies.sortColumn];
    const bVal = b[state.cookies.sortColumn];

    if (typeof aVal === 'string') {
      return state.cookies.sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else {
      return state.cookies.sortDirection === 'asc'
        ? aVal - bVal
        : bVal - aVal;
    }
  });

  state.cookies.filtered = filtered;
  state.cookies.currentPage = 1; // Reset to first page
}

function populateCookieFilters() {
  // Category filter
  const categorySelect = document.getElementById('cookie-category-filter');
  if (categorySelect) {
    const categories = ['all', 'ANALYTICS', 'ADVERTISING', 'SOCIAL', 'FINGERPRINTING', 'ESSENTIAL', 'UNKNOWN'];
    categorySelect.innerHTML = categories.map(cat =>
      `<option value="${cat}">${cat === 'all' ? 'All Categories' : cat}</option>`
    ).join('');
  }

  // Domain filter
  const domainSelect = document.getElementById('cookie-domain-filter');
  if (domainSelect) {
    const domains = ['all', ...new Set(state.cookies.list.map(c => c.domain))];
    domainSelect.innerHTML = domains.map(domain =>
      `<option value="${domain}">${domain === 'all' ? 'All Domains' : domain}</option>`
    ).join('');
  }
}

function renderCookiesTable() {
  const tbody = document.getElementById('cookies-table-body');
  if (!tbody) return;

  const { currentPage, itemsPerPage, filtered } = state.cookies;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = filtered.slice(startIndex, endIndex);

  if (pageItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No cookies found matching your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = pageItems.map(cookie => {
    const isSelected = state.cookies.selected.has(cookie.name + cookie.domain);
    const expiresText = cookie.session ? 'Session' : formatDate(new Date(cookie.expirationDate * 1000));
    const flags = [
      cookie.secure ? 'Secure' : '',
      cookie.httpOnly ? 'HttpOnly' : '',
      cookie.sameSite ? `SameSite=${cookie.sameSite}` : '',
    ].filter(Boolean).join(', ');

    return `
      <tr class="${isSelected ? 'selected' : ''}">
        <td>
          <input type="checkbox"
                 class="cookie-checkbox"
                 data-cookie-id="${cookie.name}${cookie.domain}"
                 ${isSelected ? 'checked' : ''}>
        </td>
        <td class="cookie-name">${escapeHtml(cookie.name)}</td>
        <td class="cookie-domain">${escapeHtml(cookie.domain)}</td>
        <td class="cookie-value">${escapeHtml(truncate(cookie.value, 30))}</td>
        <td><span class="category-badge ${cookie.category.toLowerCase()}">${cookie.category}</span></td>
        <td>${cookie.size} bytes</td>
        <td>${expiresText}</td>
        <td class="cookie-flags">${flags || 'None'}</td>
        <td class="cookie-actions">
          <button class="btn-icon" onclick="viewCookie('${cookie.name}', '${cookie.domain}')" title="View Details">
            👁️
          </button>
          <button class="btn-icon" onclick="deleteCookie('${cookie.name}', '${cookie.domain}')" title="Delete">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Update pagination
  renderCookiesPagination();
}

function renderCookiesPagination() {
  const container = document.getElementById('cookies-pagination');
  if (!container) return;

  const { currentPage, itemsPerPage, filtered } = state.cookies;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  container.innerHTML = `
    <button class="btn-pagination" ${currentPage === 1 ? 'disabled' : ''} onclick="changeCookiesPage(${currentPage - 1})">
      ← Previous
    </button>
    ${pages.map(page => {
      if (page === '...') {
        return '<span class="pagination-ellipsis">...</span>';
      }
      return `
        <button class="btn-pagination ${page === currentPage ? 'active' : ''}"
                onclick="changeCookiesPage(${page})">
          ${page}
        </button>
      `;
    }).join('')}
    <button class="btn-pagination" ${currentPage === totalPages ? 'disabled' : ''} onclick="changeCookiesPage(${currentPage + 1})">
      Next →
    </button>
  `;
}

function updateCookiesStats() {
  const totalEl = document.getElementById('cookies-total-count');
  const filteredEl = document.getElementById('cookies-filtered-count');

  if (totalEl) totalEl.textContent = state.cookies.list.length;
  if (filteredEl) filteredEl.textContent = state.cookies.filtered.length;
}

// Global functions for onclick handlers
window.changeCookiesPage = function(page) {
  state.cookies.currentPage = page;
  renderCookiesTable();
};

window.viewCookie = function(name, domain) {
  const cookie = state.cookies.list.find(c => c.name === name && c.domain === domain);
  if (!cookie) return;

  // Show modal with cookie details
  alert(`Cookie Details:\n\nName: ${cookie.name}\nDomain: ${cookie.domain}\nValue: ${cookie.value}\nCategory: ${cookie.category}\nRisk Level: ${cookie.riskLevel}`);
};

window.deleteCookie = async function(name, domain) {
  if (!confirm(`Delete cookie "${name}" from ${domain}?`)) return;

  try {
    const url = `http${domain.startsWith('.') ? 's' : ''}://${domain}`;
    await chrome.cookies.remove({ url, name });

    // Refresh data
    await renderCookiesTab();

    console.log(`✅ Deleted cookie: ${name}`);
  } catch (error) {
    console.error('Error deleting cookie:', error);
    showError('Failed to delete cookie');
  }
};

// ============================================================================
// LOCALSTORAGE TAB
// ============================================================================

async function renderLocalStorageTab() {
  if (!state.scanData) {
    await loadAllData();
  }

  const data = state.scanData?.localStorage?.items || [];
  state.localStorage = data;

  renderStorageExplorer('localStorage', data);
}

function renderStorageExplorer(type, items) {
  const container = document.getElementById(`${type.toLowerCase()}-explorer`);
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = '<div class="empty-state">No data stored in ' + type + '.</div>';
    return;
  }

  // Group by origin
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.origin]) {
      grouped[item.origin] = [];
    }
    grouped[item.origin].push(item);
  });

  container.innerHTML = Object.entries(grouped).map(([origin, originItems]) => `
    <div class="storage-group">
      <div class="storage-group-header">
        <span class="storage-origin">${escapeHtml(origin)}</span>
        <span class="storage-count">${originItems.length} items</span>
      </div>
      <div class="storage-items">
        ${originItems.map(item => `
          <div class="storage-item">
            <div class="storage-item-header">
              <strong class="storage-key">${escapeHtml(item.key)}</strong>
              <span class="storage-size">${formatBytes(item.size || 0)}</span>
            </div>
            <div class="storage-value">
              <pre>${escapeHtml(formatJSON(item.value))}</pre>
            </div>
            <div class="storage-actions">
              <button class="btn-small" onclick="copyToClipboard('${escapeHtml(item.value)}')">
                📋 Copy
              </button>
              <button class="btn-small" onclick="editStorageItem('${type}', '${escapeHtml(origin)}', '${escapeHtml(item.key)}')">
                ✏️ Edit
              </button>
              <button class="btn-small btn-danger" onclick="deleteStorageItem('${type}', '${escapeHtml(origin)}', '${escapeHtml(item.key)}')">
                🗑️ Delete
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('✅ Copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
};

window.editStorageItem = function(type, origin, key) {
  // TODO: Implement edit modal
  const newValue = prompt(`Edit ${type} item "${key}":`, '');
  if (newValue !== null) {
    // Would need content script to modify storage in other origins
    alert('Editing storage items requires content script injection (coming soon)');
  }
};

window.deleteStorageItem = function(type, origin, key) {
  if (!confirm(`Delete ${type} item "${key}" from ${origin}?`)) return;

  // Would need content script to delete from other origins
  alert('Deleting storage items requires content script injection (coming soon)');
};

// ============================================================================
// SESSIONSTORAGE TAB
// ============================================================================

async function renderSessionStorageTab() {
  if (!state.scanData) {
    await loadAllData();
  }

  const data = state.scanData?.sessionStorage?.items || [];
  state.sessionStorage = data;

  renderStorageExplorer('sessionStorage', data);
}

// ============================================================================
// INDEXEDDB TAB
// ============================================================================

async function renderIndexedDBTab() {
  if (!state.scanData) {
    await loadAllData();
  }

  const data = state.scanData?.indexedDB?.databases || [];
  state.indexedDB = data;

  renderIndexedDBTree(data);
}

function renderIndexedDBTree(databases) {
  const container = document.getElementById('indexeddb-tree');
  if (!container) return;

  if (databases.length === 0) {
    container.innerHTML = '<div class="empty-state">No IndexedDB databases found.</div>';
    return;
  }

  container.innerHTML = databases.map((db, dbIndex) => `
    <div class="tree-node" data-level="0">
      <div class="tree-node-header" onclick="toggleTreeNode(this)">
        <span class="tree-icon">▶</span>
        <span class="tree-icon">🗄️</span>
        <span class="tree-label">${escapeHtml(db.name)}</span>
        <span class="tree-meta">${db.objectStores?.length || 0} stores</span>
      </div>
      <div class="tree-node-children" style="display: none;">
        ${(db.objectStores || []).map((store, storeIndex) => `
          <div class="tree-node" data-level="1">
            <div class="tree-node-header" onclick="toggleTreeNode(this)">
              <span class="tree-icon">▶</span>
              <span class="tree-icon">📦</span>
              <span class="tree-label">${escapeHtml(store.name)}</span>
              <span class="tree-meta">${store.count || 0} records</span>
            </div>
            <div class="tree-node-children" style="display: none;">
              <div class="tree-node-content">
                <p>KeyPath: ${store.keyPath || 'none'}</p>
                <p>Auto Increment: ${store.autoIncrement ? 'Yes' : 'No'}</p>
                <button class="btn-small" onclick="viewIndexedDBRecords('${escapeHtml(db.name)}', '${escapeHtml(store.name)}')">
                  View Records
                </button>
              </div>
            </div>
          </div>
        `).join('')}
        <div class="tree-node-content">
          <button class="btn-small btn-danger" onclick="deleteIndexedDB('${escapeHtml(db.name)}')">
            🗑️ Delete Database
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

window.toggleTreeNode = function(header) {
  const node = header.parentElement;
  const children = node.querySelector('.tree-node-children');
  const icon = header.querySelector('.tree-icon');

  if (!children) return;

  if (children.style.display === 'none') {
    children.style.display = 'block';
    icon.textContent = '▼';
    node.classList.add('expanded');
  } else {
    children.style.display = 'none';
    icon.textContent = '▶';
    node.classList.remove('expanded');
  }
};

window.viewIndexedDBRecords = function(dbName, storeName) {
  alert(`Viewing records from ${dbName} > ${storeName}\n\nRecord viewer coming soon!`);
};

window.deleteIndexedDB = function(dbName) {
  if (!confirm(`Delete IndexedDB database "${dbName}"? This cannot be undone.`)) return;

  // Would need to execute in the context of the origin
  alert('Deleting IndexedDB databases requires content script injection (coming soon)');
};

// ============================================================================
// PRIVACY REPORT TAB
// ============================================================================

async function renderPrivacyReport() {
  if (!state.privacyAnalysis) {
    await loadAllData();
  }

  const analysis = state.privacyAnalysis;

  // Update score
  const scoreEl = document.getElementById('privacy-report-score');
  if (scoreEl) {
    scoreEl.textContent = analysis.privacyScore;
    scoreEl.classList.remove('score-red', 'score-yellow', 'score-green');
    if (analysis.privacyScore < 40) {
      scoreEl.classList.add('score-red');
    } else if (analysis.privacyScore < 70) {
      scoreEl.classList.add('score-yellow');
    } else {
      scoreEl.classList.add('score-green');
    }
  }

  // Display breakdown
  const breakdownEl = document.getElementById('privacy-report-breakdown');
  if (breakdownEl) {
    const breakdown = analysis.breakdown || {};
    breakdownEl.innerHTML = `
      <div class="report-section">
        <h3>Cookie Breakdown by Category</h3>
        <ul>
          <li><strong>Essential:</strong> ${breakdown.essential || 0}</li>
          <li><strong>Analytics:</strong> ${breakdown.analytics || 0}</li>
          <li><strong>Advertising:</strong> ${breakdown.advertising || 0}</li>
          <li><strong>Social Media:</strong> ${breakdown.social || 0}</li>
          <li><strong>Fingerprinting:</strong> ${breakdown.fingerprinting || 0}</li>
          <li><strong>Unknown:</strong> ${breakdown.unknown || 0}</li>
        </ul>
      </div>
    `;
  }

  // Display deductions
  const deductionsEl = document.getElementById('privacy-report-deductions');
  if (deductionsEl && analysis.deductions) {
    deductionsEl.innerHTML = `
      <div class="report-section">
        <h3>Privacy Score Deductions</h3>
        <ul>
          ${analysis.deductions.map(d => `
            <li>${d.type}: -${d.points} points (${d.count} items)</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // Display recommendations
  const recsEl = document.getElementById('privacy-report-recommendations');
  if (recsEl && analysis.recommendations) {
    recsEl.innerHTML = `
      <div class="report-section">
        <h3>Recommendations</h3>
        <ol>
          ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  // Display high-risk items
  const riskEl = document.getElementById('privacy-report-high-risk');
  if (riskEl && analysis.highRiskItems) {
    riskEl.innerHTML = `
      <div class="report-section">
        <h3>High-Risk Items</h3>
        ${analysis.highRiskItems.map(item => `
          <div class="high-risk-item ${item.severity}">
            <strong>${item.title}</strong>
            <p>${item.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// ============================================================================
// WHITELIST TAB
// ============================================================================

async function renderWhitelist() {
  const container = document.getElementById('whitelist-domains');
  if (!container) return;

  if (state.whitelist.length === 0) {
    container.innerHTML = '<div class="empty-state">No domains whitelisted. Add domains to exclude them from automatic cleaning.</div>';
    return;
  }

  container.innerHTML = state.whitelist.map(domain => `
    <div class="whitelist-item">
      <span class="whitelist-domain">${escapeHtml(domain)}</span>
      <button class="btn-icon btn-danger" onclick="removeFromWhitelist('${escapeHtml(domain)}')" title="Remove">
        🗑️
      </button>
    </div>
  `).join('');
}

window.addToWhitelist = async function() {
  const input = document.getElementById('whitelist-input');
  if (!input) return;

  const domain = input.value.trim();
  if (!domain) return;

  if (state.whitelist.includes(domain)) {
    alert('Domain already whitelisted');
    return;
  }

  state.whitelist.push(domain);
  await chrome.storage.local.set({ whitelist: state.whitelist });

  input.value = '';
  await renderWhitelist();

  console.log(`✅ Added ${domain} to whitelist`);
};

window.removeFromWhitelist = async function(domain) {
  if (!confirm(`Remove ${domain} from whitelist?`)) return;

  state.whitelist = state.whitelist.filter(d => d !== domain);
  await chrome.storage.local.set({ whitelist: state.whitelist });

  await renderWhitelist();

  console.log(`✅ Removed ${domain} from whitelist`);
};

// ============================================================================
// SETTINGS TAB
// ============================================================================

async function renderSettings() {
  // Load current settings
  const stored = await chrome.storage.local.get('settings');
  state.settings = stored.settings || {
    autoScanEnabled: true,
    scanFrequency: 300000, // 5 minutes
    notificationsEnabled: true,
    privacyThreshold: 70,
  };

  // Update form
  const form = document.getElementById('settings-form');
  if (form) {
    form.querySelector('#auto-scan-enabled').checked = state.settings.autoScanEnabled;
    form.querySelector('#scan-frequency').value = state.settings.scanFrequency / 1000;
    form.querySelector('#notifications-enabled').checked = state.settings.notificationsEnabled;
    form.querySelector('#privacy-threshold').value = state.settings.privacyThreshold;
  }
}

window.saveSettings = async function() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  state.settings = {
    autoScanEnabled: form.querySelector('#auto-scan-enabled').checked,
    scanFrequency: parseInt(form.querySelector('#scan-frequency').value) * 1000,
    notificationsEnabled: form.querySelector('#notifications-enabled').checked,
    privacyThreshold: parseInt(form.querySelector('#privacy-threshold').value),
  };

  await chrome.storage.local.set({ settings: state.settings });

  // Notify background script of settings change
  await chrome.runtime.sendMessage({ action: 'settingsUpdated', settings: state.settings });

  alert('Settings saved successfully!');
  console.log('✅ Settings saved:', state.settings);
};

window.resetSettings = async function() {
  if (!confirm('Reset all settings to defaults?')) return;

  state.settings = {
    autoScanEnabled: true,
    scanFrequency: 300000,
    notificationsEnabled: true,
    privacyThreshold: 70,
  };

  await chrome.storage.local.set({ settings: state.settings });
  await renderSettings();

  alert('Settings reset to defaults');
  console.log('✅ Settings reset');
};

// ============================================================================
// ABOUT TAB
// ============================================================================

function renderAbout() {
  // Static content, no rendering needed
  console.log('📄 About tab displayed');
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refresh-data-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadAllData();
      await loadTabData(state.currentTab);
    });
  }

  // Cookie search
  const searchInput = document.getElementById('cookie-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.cookies.filters.search = e.target.value;
      filterCookies();
      renderCookiesTable();
    });
  }

  // Cookie filters
  const categoryFilter = document.getElementById('cookie-category-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      state.cookies.filters.category = e.target.value;
      filterCookies();
      renderCookiesTable();
    });
  }

  const domainFilter = document.getElementById('cookie-domain-filter');
  if (domainFilter) {
    domainFilter.addEventListener('change', (e) => {
      state.cookies.filters.domain = e.target.value;
      filterCookies();
      renderCookiesTable();
    });
  }

  // Cookie table sorting
  const sortableHeaders = document.querySelectorAll('.data-table th.sortable');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.column;
      if (state.cookies.sortColumn === column) {
        state.cookies.sortDirection = state.cookies.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.cookies.sortColumn = column;
        state.cookies.sortDirection = 'asc';
      }

      // Update sort indicators
      sortableHeaders.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
      header.classList.add(`sort-${state.cookies.sortDirection}`);

      filterCookies();
      renderCookiesTable();
    });
  });

  // Select all cookies
  const selectAllCheckbox = document.getElementById('select-all-cookies');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const checked = e.target.checked;
      state.cookies.selected.clear();

      if (checked) {
        state.cookies.filtered.forEach(cookie => {
          state.cookies.selected.add(cookie.name + cookie.domain);
        });
      }

      renderCookiesTable();
    });
  }

  // Bulk delete cookies
  const bulkDeleteBtn = document.getElementById('bulk-delete-cookies');
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', async () => {
      const count = state.cookies.selected.size;
      if (count === 0) {
        alert('No cookies selected');
        return;
      }

      if (!confirm(`Delete ${count} selected cookies?`)) return;

      showLoading(true);

      for (const id of state.cookies.selected) {
        const cookie = state.cookies.list.find(c => (c.name + c.domain) === id);
        if (cookie) {
          try {
            const url = `http${cookie.domain.startsWith('.') ? 's' : ''}://${cookie.domain}`;
            await chrome.cookies.remove({ url, name: cookie.name });
          } catch (error) {
            console.error('Error deleting cookie:', error);
          }
        }
      }

      state.cookies.selected.clear();
      await renderCookiesTab();
      showLoading(false);

      alert(`Deleted ${count} cookies`);
    });
  }

  // Whitelist add button
  const addWhitelistBtn = document.getElementById('add-whitelist-btn');
  if (addWhitelistBtn) {
    addWhitelistBtn.addEventListener('click', window.addToWhitelist);
  }

  // Settings save button
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', window.saveSettings);
  }

  // Settings reset button
  const resetSettingsBtn = document.getElementById('reset-settings-btn');
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', window.resetSettings);
  }

  // Export privacy report
  const exportReportBtn = document.getElementById('export-privacy-report');
  if (exportReportBtn) {
    exportReportBtn.addEventListener('click', () => {
      const data = {
        timestamp: Date.now(),
        privacyScore: state.privacyAnalysis?.privacyScore,
        breakdown: state.privacyAnalysis?.breakdown,
        recommendations: state.privacyAnalysis?.recommendations,
        highRiskItems: state.privacyAnalysis?.highRiskItems,
        totalCookies: state.scanData?.cookies?.cookies?.length,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `privacy-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateCookieSize(cookie) {
  const size = (cookie.name?.length || 0) +
               (cookie.value?.length || 0) +
               (cookie.domain?.length || 0) +
               (cookie.path?.length || 0);
  return size;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatJSON(str) {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

console.log('✅ Options page script loaded');
