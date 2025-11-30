/**
 * StorageInsight Options Script
 * Handles settings page functionality
 */

// DOM elements
const autoScanEnabled = document.getElementById('autoScanEnabled');
const scanFrequency = document.getElementById('scanFrequency');
const notifications = document.getElementById('notifications');
const privacyThreshold = document.getElementById('privacyThreshold');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');

// Default settings
const defaultSettings = {
  scanFrequency: 'manual',
  autoScanEnabled: false,
  notifications: true,
  privacyThreshold: 70,
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

    console.log('✅ Settings loaded:', settings);
  } catch (error) {
    console.error('❌ Error loading settings:', error);
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
    };

    // Save to storage
    await chrome.storage.local.set({ settings });

    // Send message to background script to update
    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: settings,
    });

    console.log('✅ Settings saved:', settings);
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('❌ Error saving settings:', error);
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

    console.log('✅ Settings reset to defaults');
    showStatus('Settings reset to defaults', 'success');
  } catch (error) {
    console.error('❌ Error resetting settings:', error);
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

console.log('✅ Options page loaded');
