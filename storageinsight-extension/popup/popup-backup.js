/**
 * StorageInsight Popup Script
 * Handles the extension popup UI and interactions
 */

// Privacy analysis is already computed by the service worker

// DOM elements
const scanBtn = document.getElementById('scanBtn');
const scanLoader = document.getElementById('scanLoader');
const settingsBtn = document.getElementById('settingsBtn');
const clearTrackingBtn = document.getElementById('clearTrackingBtn');
const exportBtn = document.getElementById('exportBtn');
const statusMessage = document.getElementById('statusMessage');

// Metric elements
const totalDomainsEl = document.getElementById('totalDomains');
const totalCookiesEl = document.getElementById('totalCookies');
const totalStorageEl = document.getElementById('totalStorage');
const privacyScoreEl = document.getElementById('privacyScore');
const trackingCookiesEl = document.getElementById('trackingCookies');

// Analysis elements
const analysisSectionEl = document.getElementById('analysisSection');
const recommendationsEl = document.getElementById('recommendations');
const highRiskItemsEl = document.getElementById('highRiskItems');

// State
let currentScanData = null;

/**
 * Initialize popup
 */
async function init() {
  console.log('🚀 Popup initializing...');

  // Attach event listeners
  scanBtn.addEventListener('click', handleScan);
  settingsBtn.addEventListener('click', openSettings);
  clearTrackingBtn.addEventListener('click', handleClearTracking);
  exportBtn.addEventListener('click', handleExport);

  // Try to load cached data
  await loadCachedData();
}

/**
 * Load cached scan data if available
 */
async function loadCachedData() {
  try {
    const result = await chrome.storage.local.get(['lastScanData', 'lastScanTime']);

    if (result.lastScanData && result.lastScanTime) {
      // Always show cached data immediately - don't worry about age
      console.log('📦 Loading cached scan data from:', new Date(result.lastScanTime).toLocaleString());
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
    console.error('Error loading cached data:', error);
  }
}

/**
 * Handle scan button click
 */
async function handleScan() {
  console.log('🔍 Starting scan...');

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
      console.log('✅ Scan complete:', response.data);
      currentScanData = response.data;

      // Cache the results
      await chrome.storage.local.set({
        lastScanData: response.data,
        lastScanTime: Date.now()
      });

      // Display results
      displayResults(response.data);

      // Show success message
      showStatus('Scan complete!', 'success');
    } else {
      throw new Error(response.error || 'Scan failed');
    }
  } catch (error) {
    console.error('❌ Scan error:', error);
    showStatus('Scan failed: ' + error.message, 'error');
  } finally {
    // Hide loading state
    scanLoader.classList.remove('active');
    scanBtn.style.display = 'flex';
  }
}

/**
 * Display scan results
 */
function displayResults(data) {
  // Use pre-computed privacy analysis from service worker
  const privacyAnalysis = data._privacyAnalysis || null;
  console.log('📊 Privacy Analysis:', privacyAnalysis);

  // Update basic metrics
  totalDomainsEl.textContent = data.uniqueDomains || 0;
  totalCookiesEl.textContent = data.totalCookies || 0;
  trackingCookiesEl.textContent = data.trackingCookies || 0;
  totalStorageEl.textContent = `${data.totalStorageMB || 0} MB`;

  // Display privacy score (already computed by service worker)
  const privacyScore = data.privacyScore || privacyAnalysis?.privacyScore || { score: 0 };
  const scoreValue = typeof privacyScore === 'object' ? privacyScore.score : privacyScore;
  privacyScoreEl.textContent = `${scoreValue}/100`;

  // Update privacy card color based on score
  const privacyCard = document.querySelector('.privacy-card');
  privacyCard.classList.remove('score-good', 'score-fair', 'score-poor');

  if (scoreValue >= 70) {
    privacyCard.classList.add('score-good');
  } else if (scoreValue >= 40) {
    privacyCard.classList.add('score-fair');
  } else {
    privacyCard.classList.add('score-poor');
  }

  // Store full analysis for detailed view
  if (privacyAnalysis) {
    currentScanData.privacyAnalysis = privacyAnalysis;

    // Display detailed analysis
    displayDetailedAnalysis(privacyAnalysis);
  }
}

/**
 * Display detailed privacy analysis (recommendations and high-risk items)
 */
function displayDetailedAnalysis(analysis) {
  // Show the analysis section
  analysisSectionEl.style.display = 'block';

  // Display recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    recommendationsEl.innerHTML = analysis.recommendations
      .slice(0, 5) // Show top 5 recommendations
      .map((rec, index) => {
        const title = typeof rec === 'object' ? rec.title : rec;
        const description = typeof rec === 'object' ? rec.description : '';
        const icon = typeof rec === 'object' ? (rec.icon || '💡') : '💡';
        const severity = typeof rec === 'object' ? (rec.severity || 'medium') : 'medium';
        const action = typeof rec === 'object' ? rec.action : null;

        return `
          <div class="recommendation-item ${severity}" title="${description}">
            <span class="recommendation-number">${icon}</span>
            <span class="recommendation-text">${title}</span>
            ${action ? `<button class="recommendation-action-btn" data-action="${action}">Fix</button>` : ''}
          </div>
        `;
      })
      .join('');

    // Attach event listeners to action buttons
    document.querySelectorAll('.recommendation-action-btn').forEach(btn => {
      btn.addEventListener('click', handleRecommendationAction);
    });
  } else {
    recommendationsEl.innerHTML = '<p class="no-data">No recommendations - your privacy looks good! 🎉</p>';
  }

  // Display high-risk items
  if (analysis.highRiskItems && analysis.highRiskItems.length > 0) {
    highRiskItemsEl.innerHTML = analysis.highRiskItems
      .map(item => {
        const severityClass = item.severity || 'medium';
        const severityIcon = item.severity === 'critical' ? '🔴' : '⚠️';

        // Map item types to actions
        const actionMap = {
          'fingerprinting': 'CLEAR_FINGERPRINTING',
          'cross_site_tracking': 'CLEAR_TRACKING',
          'large_storage': 'CLEAR_LOCALSTORAGE'
        };

        const action = item.type ? actionMap[item.type] : null;
        const actionLabel = action === 'CLEAR_LOCALSTORAGE' ? 'Clear' :
                           action === 'CLEAR_FINGERPRINTING' ? 'Remove' :
                           action === 'CLEAR_TRACKING' ? 'Clear' : 'Fix';

        return `
          <div class="high-risk-item ${severityClass}">
            <div class="risk-header">
              <span class="risk-icon">${severityIcon}</span>
              <strong>${item.title}</strong>
              ${action ? `<button class="high-risk-action-btn" data-action="${action}">${actionLabel}</button>` : ''}
            </div>
            <p class="risk-description">${item.description}</p>
            ${item.items && item.items.length > 0 ? `
              <div class="risk-items-summary">
                ${item.items.length} item${item.items.length !== 1 ? 's' : ''} detected
              </div>
            ` : ''}
          </div>
        `;
      })
      .join('');

    // Attach event listeners to high-risk action buttons
    document.querySelectorAll('.high-risk-action-btn').forEach(btn => {
      btn.addEventListener('click', handleHighRiskAction);
    });
  } else {
    highRiskItemsEl.innerHTML = '<p class="no-data">No high-risk items detected ✅</p>';
  }
}


/**
 * Handle recommendation action button click
 */
async function handleRecommendationAction(event) {
  const action = event.target.dataset.action;
  console.log('🎯 Executing recommendation action:', action);

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
    console.warn('⚠️ Unknown action:', action);
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
      console.log(`✅ Action complete: ${count} items removed`);
      showStatus(`Success! Removed ${count} item${count !== 1 ? 's' : ''}`, 'success');

      // Refresh data after a short delay
      setTimeout(handleScan, 500);
    } else {
      throw new Error(response.error || 'Action failed');
    }
  } catch (error) {
    console.error('❌ Action error:', error);
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
  console.log('🎯 Executing high-risk action:', action);

  if (!action) return;

  // Map actions to confirmation messages
  const confirmMap = {
    'CLEAR_FINGERPRINTING': 'Remove all fingerprinting trackers? This cannot be undone.',
    'CLEAR_TRACKING': 'Clear all cross-site tracking cookies? This cannot be undone.',
    'CLEAR_LOCALSTORAGE': 'Clear excessive localStorage data? This cannot be undone.'
  };

  const confirmMsg = confirmMap[action];
  if (!confirmMsg) {
    console.warn('⚠️ Unknown action:', action);
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
      console.log(`✅ Action complete: ${count} items removed`);
      showStatus(`Success! Removed ${count} item${count !== 1 ? 's' : ''}`, 'success');

      // Refresh data after a short delay
      setTimeout(handleScan, 500);
    } else {
      throw new Error(response.error || 'Action failed');
    }
  } catch (error) {
    console.error('❌ Action error:', error);
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

  console.log('🗑️ Clearing tracking cookies...');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CLEAR_TRACKING'
    });

    if (response.success) {
      const count = response.data.removedCount;
      console.log(`✅ Removed ${count} tracking cookies`);
      showStatus(`Removed ${count} tracking cookie${count !== 1 ? 's' : ''}`, 'success');

      // Refresh data after a short delay
      setTimeout(handleScan, 500);
    } else {
      throw new Error(response.error || 'Failed to clear tracking cookies');
    }
  } catch (error) {
    console.error('❌ Clear tracking error:', error);
    showStatus('Failed to clear tracking cookies', 'error');
  }
}

/**
 * Handle export button click
 */
async function handleExport() {
  console.log('📤 Exporting data...');

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
    console.error('❌ Export error:', error);
    showStatus('Failed to export data', 'error');
  }
}

/**
 * Open settings page
 */
function openSettings() {
  chrome.runtime.openOptionsPage();
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('✅ Popup script loaded');
