# StorageInsight Browser Extension

<div align="center">

🛡️ **Privacy-focused browser storage manager**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-purple)

</div>

## 📖 Overview

StorageInsight is a Chrome browser extension that helps you understand and manage browser storage across all websites. It scans cookies, localStorage, sessionStorage, and IndexedDB to give you complete visibility and control over your data.

### ✨ Features

- 🔍 **Comprehensive Scanning** - Scan all browser storage types across all websites
- 🍪 **Cookie Analysis** - Identify and categorize tracking cookies
- 🛡️ **Privacy Score** - Get a real-time privacy score (0-100) based on your browser data
- 📊 **Storage Breakdown** - Visual breakdown of storage usage by type
- 🗑️ **Quick Actions** - Clear tracking cookies with one click
- 📤 **Data Export** - Export all scan data as JSON
- ⚙️ **Customizable Settings** - Configure auto-scan, notifications, and thresholds
- 🔒 **Privacy-First** - All analysis happens locally on your device

## 🚀 Installation

### From Source (Developer Mode)

1. **Generate Icons** (required):
   ```bash
   cd assets/icons
   # Follow instructions in ICONS_README.md to generate PNG icons
   # Or use the provided icon.svg with an online converter
   ```

2. **Load Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `storageinsight-extension` folder
   - The extension should now appear in your extensions list

3. **Pin the Extension** (optional):
   - Click the puzzle icon in Chrome toolbar
   - Find "StorageInsight"
   - Click the pin icon to keep it visible

## 📋 Usage

### Basic Scanning

1. Click the StorageInsight icon in your browser toolbar
2. Click "Scan Storage" button
3. View your metrics:
   - Total cookies count
   - Total storage size (MB)
   - Privacy score (color-coded)
   - Tracking cookies count

### Clear Tracking Cookies

1. Open the extension popup
2. Click "Clear Tracking" button
3. Confirm the action
4. Tracking cookies will be removed

### Export Data

1. Open the extension popup
2. Click "Export Data" button
3. JSON file will be downloaded with all scan data

### Configure Settings

1. Click the settings icon (⚙️) in the popup
2. Or right-click extension icon → Options
3. Configure:
   - Auto-scan frequency
   - Notifications
   - Privacy threshold

## 🏗️ Project Structure

```
storageinsight-extension/
├── manifest.json                    # Extension configuration
├── background/
│   └── service-worker.js           # Background tasks & message handling
├── popup/
│   ├── popup.html                  # Extension popup UI
│   ├── popup.js                    # Popup logic
│   └── popup.css                   # Popup styles
├── options/
│   ├── options.html                # Settings page
│   └── options.js                  # Settings logic
├── content/
│   └── content-script.js           # Injected into web pages
├── lib/
│   ├── storage-scanner.js          # Storage scanning logic
│   ├── privacy-analyzer.js         # Privacy analysis & scoring
│   └── tracking-database.js        # Known tracker database
├── assets/
│   └── icons/                      # Extension icons (16, 32, 48, 128px)
└── styles/
    └── common.css                  # Shared styles
```

## 🔐 Permissions Explained

| Permission | Purpose |
|------------|---------|
| `cookies` | Read all cookies across websites for analysis |
| `storage` | Store extension settings and cached data |
| `tabs` | Access tab information for domain-based analysis |
| `activeTab` | Access currently active tab's information |
| `scripting` | Inject scripts to detect localStorage/sessionStorage |
| `alarms` | Schedule periodic scans |
| `host_permissions` | Access all websites for complete storage scan |

**Privacy Note**: All data stays on your device. Nothing is sent to external servers.

## 🛠️ Development

### Prerequisites

- Chrome/Chromium browser
- Basic knowledge of JavaScript
- Icon generation tool (optional)

### Making Changes

1. **Edit Code**:
   - Modify files in the extension directory
   - Changes to popup/options pages: Reload the page
   - Changes to background script: Reload extension in `chrome://extensions`
   - Changes to content script: Reload the webpage

2. **Test Changes**:
   - Open `chrome://extensions`
   - Click reload icon for StorageInsight
   - Test functionality in popup and on websites

3. **Debug**:
   - Background script: `chrome://extensions` → "Inspect views: service worker"
   - Popup: Right-click popup → "Inspect"
   - Content script: Open DevTools on any webpage → Console

### Building for Production

1. Follow the detailed instructions in [PUBLISHING.md](PUBLISHING.md).
2. Run the packaging script: `node scripts/package.js`
3. Upload the generated zip file to the Chrome Web Store.

## 🔗 Integration with Main App

The extension is designed to work alongside the Insight web application:

1. **Web App URL**: http://localhost:3000
2. **Access**: Click "View Full Dashboard" in extension footer
3. **Features**:
   - The web app provides detailed visualizations
   - The extension collects real browser data
   - Future: Two-way sync between extension and web app

### Connecting Extension to Web App (Future)

```javascript
// In extension: Send data to web app
chrome.runtime.sendMessage({
  type: 'SYNC_TO_WEBAPP',
  data: scanResults
});

// In web app: Receive data from extension
window.addEventListener('message', (event) => {
  if (event.data.type === 'EXTENSION_DATA') {
    updateDashboard(event.data.payload);
  }
});
```

## 🐛 Troubleshooting

### Extension Won't Load

- Check that all required files are present
- Ensure icons are generated (see assets/icons/ICONS_README.md)
- Check browser console for errors

### Scan Not Working

- Verify permissions are granted in `chrome://extensions`
- Check that the extension has access to all sites
- Try reloading the extension

### No Data Showing

- Click "Scan Storage" first - data isn't collected automatically
- Check that you have cookies/storage on some websites
- Open browser console to see if there are errors

### Service Worker Inactive

- Service workers sleep when inactive - this is normal
- Click the extension icon to wake it up
- Check "Inspect views: service worker" for errors

## 📊 Privacy Score Algorithm

The privacy score (0-100) is calculated based on:

- **Tracking Cookies** (-30 max): More tracking cookies = lower score
- **Third-party Cookies** (-20 max): Cross-site cookies reduce score
- **Insecure Cookies** (-15 max): Non-HTTPS cookies are penalized
- **Cookie Attributes** (-10 max): Missing httpOnly flags
- **Domain Count** (-15 max): Too many domains tracking you
- **Storage Size** (-10 max): Excessive storage usage

**Score Ranges**:
- 90-100: Excellent privacy
- 70-89: Good privacy
- 50-69: Fair privacy
- 30-49: Poor privacy
- 0-29: Critical privacy issues

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Add more tracking domain patterns
- [ ] Implement IndexedDB size calculation
- [ ] Add cookie whitelisting feature
- [ ] Create detailed cookie viewer
- [ ] Add export formats (CSV, PDF)
- [ ] Implement scheduled reports
- [ ] Add browser action badge updates
- [ ] Create privacy tips/recommendations

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with Chrome Extension Manifest V3
- Icons use purple/blue gradient theme matching the Insight web app
- Tracking domain database inspired by various privacy tools

## 📞 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Web App**: http://localhost:3000
- **Documentation**: See `/docs` folder for detailed guides

---

<div align="center">

**Made with 💜 for privacy-conscious users**

</div>
