/**
 * StorageInsight Popup - Prompt 4 Complete Implementation
 * Full dashboard UI with all features
 */

import { analyzePrivacy } from '../lib/privacy-analyzer.js';

// DOM Elements
const elements = {
  // Header
  currentDomain: document.getElementById('currentDomain'),
  extensionToggle: document.getElementById('extensionToggle'),
  settingsBtn: document.getElementById('settingsBtn'),

  // Privacy Score
  privacyScoreCard: document.getElementById('privacyScoreCard'),
  scoreValue: document.getElementById('scoreValue'),
  progressBar: document.getElementById('progressBar'),
  scoreTapHint: document.getElementById('scoreTapHint'),

  // Quick Stats
  totalCookies: document.getElementById('totalCookies'),
  trackersFound: document.getElementById('trackersFound'),
  storageUsed: document.getElementById('storageUsed'),
  sitesTracked: document.getElementById('sitesTracked'),

  // Category
  categoryBar: document.getElementById('categoryBar'),
  necessaryCount: document.getElementById('necessaryCount'),
  analyticsCount: document.getElementById('analyticsCount'),
  advertisingCount: document.getElementById('advertisingCount'),
  socialCount: document.getElementById('socialCount'),
  otherCount: document.getElementById('otherCount'),

  // Actions
  clearAllTrackers: document.getElementById('clearAllTrackers'),
  clearCurrentSite: document.getElementById('clearCurrentSite'),
  scanNow: document.getElementById('scanNow'),
  viewAllStorage: document.getElementById('viewAllStorage'),

  // Activity
  activityFeed: document.getElementById('activityFeed'),

  // Footer
  fullDashboardLink: document.getElementById('fullDashboardLink'),
  version: document.getElementById('version'),

  // Loading
  loadingOverlay: document.getElementById('loadingOverlay'),
};

// State
let currentTabId = null;
let currentScanData = null;
let recentActivities = [];

/**
 * Initialize popup
 */
async function init() {
  console.log('🚀 StorageInsight Popup initializing...');

  // Get current tab
  await updateCurrentSite();

  // Load extension state
  await loadExtensionState();

  // Load cached data
  await loadCachedData();

  // Load recent activities
  await loadRecentActivities();

  // Setup event listeners
  setupEventListeners();

  // Auto-scan on open if no cached data
  if (!currentScanData) {
    performScan();
  }
}

/**
 * Update current site indicator
 */
async function updateCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      currentTabId = tab.id;
      const url = new URL(tab.url);
      elements.currentDomain.textContent = url.hostname;
    } else {
      elements.currentDomain.textContent = 'No active tab';
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
    elements.currentDomain.textContent = 'Unknown';
  }
}

/**
 * Load extension enabled/disabled state
 */
async function loadExtensionState() {
  try {
    const result = await chrome.storage.local.get(['extensionEnabled']);
    const isEnabled = result.extensionEnabled !== false; // Default to true
    elements.extensionToggle.checked = isEnabled;
  } catch (error) {
    console.error('Error loading extension state:', error);
  }
}

/**
 * Load cached scan data
 */
async function loadCachedData() {
  try {
    const result = await chrome.storage.local.get(['lastScanData', 'lastScanTime']);

    if (result.lastScanData && result.lastScanTime) {
      const timeDiff = Date.now() - result.lastScanTime;
      const fiveMinutes = 5 * 60 * 1000;

      if (timeDiff < fiveMinutes) {
        console.log('📦 Loading cached scan data');
        currentScanData = result.lastScanData;
        displayResults(result.lastScanData);
      }
    }
  } catch (error) {
    console.error('Error loading cached data:', error);
  }
}

/**
 * Load recent activities
 */
async function loadRecentActivities() {
  try {
    const result = await chrome.storage.local.get(['recentActivities']);
    recentActivities = result.recentActivities || [];
    displayRecentActivities();
  } catch (error) {
    console.error('Error loading activities:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Extension toggle
  elements.extensionToggle.addEventListener('change', handleExtensionToggle);

  // Settings
  elements.settingsBtn.addEventListener('click', openSettings);

  // Privacy score card
  elements.privacyScoreCard.addEventListener('click', showPrivacyBreakdown);

  // Quick actions
  elements.clearAllTrackers.addEventListener('click', handleClearAllTrackers);
  elements.clearCurrentSite.addEventListener('click', handleClearCurrentSite);
  elements.scanNow.addEventListener('click', handleScanNow);
  elements.viewAllStorage.addEventListener('click', openOptionsPage);

  // Category legend items
  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', () => handleCategoryFilter(item.dataset.category));
  });

  // Full dashboard link
  elements.fullDashboardLink.addEventListener('click', openFullDashboard);
}

/**
 * Handle extension toggle
 */
async function handleExtensionToggle(event) {
  const isEnabled = event.target.checked;

  try {
    await chrome.storage.local.set({ extensionEnabled: isEnabled });
    console.log(`Extension ${isEnabled ? 'enabled' : 'disabled'}`);

    // Show feedback
    showToast(isEnabled ? 'Extension enabled' : 'Extension disabled');

    // Add activity
    addActivity(isEnabled ? 'Extension enabled' : 'Extension disabled', 'system');
  } catch (error) {
    console.error('Error toggling extension:', error);
  }
}

/**
 * Perform storage scan
 */
async function performScan() {
  console.log('🔍 Starting scan...');
  showLoading(true);

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SCAN_STORAGE'
    });

    if (response.success) {
      console.log('✅ Scan complete:', response.data);
      currentScanData = response.data;

      // Cache the results
      await chrome.storage.local.set({
        lastScanData: response.data,
        lastScanTime: Date.now()
      });

      // Display results
      displayResults(response.data);

      // Add activity
      addActivity(`Scanned ${response.data.totalCookies || 0} cookies`, 'scan');
    } else {
      throw new Error(response.error || 'Scan failed');
    }
  } catch (error) {
    console.error('❌ Scan error:', error);
    showToast('Scan failed: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Display scan results
 */
function displayResults(data) {
  // Run privacy analysis
  let privacyAnalysis = null;
  try {
    privacyAnalysis = analyzePrivacy(data);
    console.log('📊 Privacy Analysis:', privacyAnalysis);
  } catch (error) {
    console.error('Error analyzing privacy:', error);
  }

  // Update privacy score with animation
  const score = privacyAnalysis ? privacyAnalysis.privacyScore : 0;
  updatePrivacyScore(score);

  // Update quick stats
  elements.totalCookies.textContent = data.totalCookies || 0;

  // Calculate trackers (advertising + fingerprinting + social + analytics)
  const trackersCount = privacyAnalysis
    ? privacyAnalysis.breakdown.advertising +
      privacyAnalysis.breakdown.fingerprinting +
      privacyAnalysis.breakdown.social +
      privacyAnalysis.breakdown.analytics
    : 0;
  elements.trackersFound.textContent = trackersCount;

  // Storage used
  const storageMB = parseFloat(data.totalStorageMB || 0);
  elements.storageUsed.textContent = storageMB < 1
    ? `${(storageMB * 1024).toFixed(0)}KB`
    : `${storageMB.toFixed(1)}MB`;

  // Sites tracked (unique domains)
  elements.sitesTracked.textContent = data.uniqueDomains || 0;

  // Update category breakdown
  if (privacyAnalysis) {
    updateCategoryBreakdown(privacyAnalysis.breakdown);
  }
}

/**
 * Update privacy score with animated circular progress
 */
function updatePrivacyScore(score) {
  // Update value
  elements.scoreValue.textContent = score;

  // Calculate progress (534 is circumference of circle with r=85)
  const circumference = 534;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  // Animate progress bar
  elements.progressBar.style.strokeDashoffset = offset;

  // Update color based on score
  elements.progressBar.classList.remove('score-red', 'score-yellow', 'score-green');
  if (score < 40) {
    elements.progressBar.classList.add('score-red');
  } else if (score < 70) {
    elements.progressBar.classList.add('score-yellow');
  } else {
    elements.progressBar.classList.add('score-green');
  }
}

/**
 * Update category breakdown
 */
function updateCategoryBreakdown(breakdown) {
  const total = breakdown.analytics + breakdown.advertising + breakdown.social +
                breakdown.essential + breakdown.fingerprinting + breakdown.unknown;

  if (total === 0) {
    // Show empty state
    document.querySelectorAll('.category-segment').forEach(seg => {
      seg.style.width = '0%';
    });
    return;
  }

  // Calculate percentages
  const percentages = {
    necessary: ((breakdown.essential / total) * 100).toFixed(1),
    analytics: ((breakdown.analytics / total) * 100).toFixed(1),
    advertising: ((breakdown.advertising / total) * 100).toFixed(1),
    social: ((breakdown.social / total) * 100).toFixed(1),
    other: (((breakdown.fingerprinting + breakdown.unknown) / total) * 100).toFixed(1),
  };

  // Update bar segments
  document.querySelector('.category-segment.necessary').style.width = `${percentages.necessary}%`;
  document.querySelector('.category-segment.analytics').style.width = `${percentages.analytics}%`;
  document.querySelector('.category-segment.advertising').style.width = `${percentages.advertising}%`;
  document.querySelector('.category-segment.social').style.width = `${percentages.social}%`;
  document.querySelector('.category-segment.other').style.width = `${percentages.other}%`;

  // Update counts
  elements.necessaryCount.textContent = breakdown.essential;
  elements.analyticsCount.textContent = breakdown.analytics;
  elements.advertisingCount.textContent = breakdown.advertising;
  elements.socialCount.textContent = breakdown.social;
  elements.otherCount.textContent = breakdown.fingerprinting + breakdown.unknown;
}

/**
 * Display recent activities
 */
function displayRecentActivities() {
  if (recentActivities.length === 0) {
    elements.activityFeed.innerHTML = `
      <div class="activity-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <p>No recent activity</p>
      </div>
    `;
    return;
  }

  // Show last 5 activities
  const recent = recentActivities.slice(0, 5);
  elements.activityFeed.innerHTML = recent.map(activity => `
    <div class="activity-item">
      <div class="activity-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${getActivityIcon(activity.type)}
        </svg>
      </div>
      <div class="activity-content">
        <div class="activity-text">${activity.text}</div>
        <div class="activity-time">${formatRelativeTime(activity.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Get activity icon SVG path
 */
function getActivityIcon(type) {
  const icons = {
    scan: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>',
    clear: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
    block: '<circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>',
    system: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6"></path>',
  };
  return icons[type] || icons.system;
}

/**
 * Add activity to recent activities
 */
async function addActivity(text, type = 'system') {
  const activity = {
    text,
    type,
    timestamp: Date.now(),
  };

  recentActivities.unshift(activity);

  // Keep only last 20
  if (recentActivities.length > 20) {
    recentActivities = recentActivities.slice(0, 20);
  }

  // Save to storage
  try {
    await chrome.storage.local.set({ recentActivities });
    displayRecentActivities();
  } catch (error) {
    console.error('Error saving activity:', error);
  }
}

/**
 * Handle clear all trackers
 */
async function handleClearAllTrackers() {
  if (!confirm('Are you sure you want to clear all tracking cookies? This cannot be undone.')) {
    return;
  }

  showLoading(true);

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CLEAR_TRACKING'
    });

    if (response.success) {
      const count = response.data.removedCount;
      console.log(`✅ Removed ${count} tracking cookies`);
      showToast(`Removed ${count} tracking cookie${count !== 1 ? 's' : ''}`);

      // Add activity
      addActivity(`Cleared ${count} tracking cookies`, 'clear');

      // Refresh data
      setTimeout(performScan, 500);
    } else {
      throw new Error(response.error || 'Failed to clear tracking cookies');
    }
  } catch (error) {
    console.error('❌ Clear tracking error:', error);
    showToast('Failed to clear tracking cookies', 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Handle clear current site
 */
async function handleClearCurrentSite() {
  if (!currentTabId) {
    showToast('No active tab', 'error');
    return;
  }

  const domain = elements.currentDomain.textContent;
  if (!confirm(`Clear all cookies and storage for ${domain}?`)) {
    return;
  }

  showLoading(true);

  try {
    // Clear cookies for current domain
    const cookies = await chrome.cookies.getAll({ domain });
    let removed = 0;

    for (const cookie of cookies) {
      const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      await chrome.cookies.remove({ url, name: cookie.name });
      removed++;
    }

    showToast(`Cleared ${removed} items from ${domain}`);
    addActivity(`Cleared data for ${domain}`, 'clear');

    // Refresh
    setTimeout(performScan, 500);
  } catch (error) {
    console.error('Error clearing site:', error);
    showToast('Failed to clear site data', 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Handle scan now
 */
function handleScanNow() {
  performScan();
}

/**
 * Handle category filter
 */
function handleCategoryFilter(category) {
  console.log('Filter by category:', category);
  // This would open options page with filter applied
  chrome.runtime.openOptionsPage();
}

/**
 * Show privacy breakdown
 */
function showPrivacyBreakdown() {
  console.log('Show privacy breakdown');
  // This could expand a detailed view or open options page
  chrome.runtime.openOptionsPage();
}

/**
 * Open settings
 */
function openSettings() {
  chrome.runtime.openOptionsPage();
}

/**
 * Open options page
 */
function openOptionsPage() {
  chrome.runtime.openOptionsPage();
}

/**
 * Open full dashboard
 */
function openFullDashboard() {
  chrome.tabs.create({ url: 'http://localhost:3000' });
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
  if (show) {
    elements.loadingOverlay.classList.add('active');
  } else {
    elements.loadingOverlay.classList.remove('active');
  }
}

/**
 * Show toast message
 */
function showToast(message, type = 'success') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    padding: 12px 16px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-bg-tertiary);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 12px;
    z-index: 2000;
    animation: slideInUp 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('✅ Popup script loaded');
