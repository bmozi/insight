/**
 * StorageInsight Options Script
 * Handles settings page functionality
 */

// Debug utility (inline for non-module scripts)
let _debugEnabled = false;
try {
  chrome.storage.local.get(['debugMode'], (r) => { _debugEnabled = r?.debugMode || false; });
} catch (e) { /* ignore */ }
const debug = {
  log: (...args) => { if (_debugEnabled) debug.log(...args); },
  warn: (...args) => { console.warn(...args); },
  error: (...args) => { debug.error(...args); }
};

// DOM elements
const autoScanEnabled = document.getElementById('autoScanEnabled');
const scanFrequency = document.getElementById('scanFrequency');
const notifications = document.getElementById('notifications');
const privacyThreshold = document.getElementById('privacyThreshold');
const debugMode = document.getElementById('debugMode');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');

// Default settings
const defaultSettings = {
  scanFrequency: 'manual',
  autoScanEnabled: false,
  notifications: true,
  privacyThreshold: 70,
  debugMode: false,
};

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get('settings');
    const settings = result.settings || defaultSettings;

    // Populate form fields
    autoScanEnabled.checked = settings.autoScanEnabled || false;
    scanFrequency.value = settings.scanFrequency || 'manual';
    notifications.checked = settings.notifications !== false; // default true
    privacyThreshold.value = settings.privacyThreshold || 70;
    debugMode.checked = settings.debugMode || false;
  } catch (error) {
    debug.error('❌ Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  try {
    const settings = {
      autoScanEnabled: autoScanEnabled.checked,
      scanFrequency: scanFrequency.value,
      notifications: notifications.checked,
      privacyThreshold: parseInt(privacyThreshold.value),
      debugMode: debugMode.checked,
    };

    // Also save debugMode separately for the debug utility
    await chrome.storage.local.set({ debugMode: debugMode.checked });

    // Save to storage
    await chrome.storage.local.set({ settings });

    // Send message to background script to update
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: settings,
    });

    debug.log('✅ Settings saved:', settings);
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    debug.error('❌ Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  try {
    await chrome.storage.local.set({ settings: defaultSettings });

    // Reload the form
    await loadSettings();

    debug.log('✅ Settings reset to defaults');
    showStatus('Settings reset to defaults', 'success');
  } catch (error) {
    debug.error('❌ Error resetting settings:', error);
    showStatus('Error resetting settings', 'error');
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

// Event listeners
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);

// Load settings on page load
loadSettings();

debug.log('✅ Options page loaded');
