# Insight Project - Complete Overview

## 🎯 Project Description

**Insight** is a privacy-focused browser storage management system consisting of two components:

1. **Web Dashboard** (Next.js React App) - Visual interface with sample data
2. **Browser Extension** (Chrome Extension) - Collects real browser storage data

Together, they provide users complete visibility and control over their browser storage, cookies, and privacy.

---

## 📁 Project Structure

```
insight/
├── app/                                    # Next.js App Directory
│   ├── page.tsx                           # Main dashboard page
│   ├── layout.tsx                         # Root layout
│   ├── globals.css                        # Global styles with theme
│   └── favicon.ico
├── storageinsight-extension/               # Chrome Extension
│   ├── manifest.json                      # Extension configuration
│   ├── background/
│   │   └── service-worker.js             # Background tasks
│   ├── popup/
│   │   ├── popup.html                    # Extension popup
│   │   ├── popup.js                      # Popup logic
│   │   └── popup.css                     # Popup styles
│   ├── options/
│   │   ├── options.html                  # Settings page
│   │   └── options.js                    # Settings logic
│   ├── content/
│   │   └── content-script.js             # Injected into pages
│   ├── lib/
│   │   ├── storage-scanner.js            # Storage scanning
│   │   ├── privacy-analyzer.js           # Privacy analysis
│   │   └── tracking-database.js          # Tracker database
│   ├── assets/icons/                      # Extension icons
│   ├── styles/
│   │   └── common.css                    # Shared styles
│   ├── README.md                          # Extension documentation
│   ├── SETUP.md                           # Setup instructions
│   └── PERMISSIONS.md                     # Permission explanations
├── public/                                # Static assets
├── node_modules/                          # Dependencies
├── package.json                           # Project dependencies
├── tsconfig.json                          # TypeScript config
└── PROJECT_OVERVIEW.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Chrome/Chromium browser
- Basic understanding of React and browser extensions

### 1. Web Dashboard Setup

```bash
# The Next.js app is already installed and running
# If not running:
npm run dev

# Access at: http://localhost:3000
```

### 2. Browser Extension Setup

```bash
cd storageinsight-extension

# Generate icons (see SETUP.md for options)
# Option 1: Online converter (recommended)
# - Visit https://redketchup.io/icon-converter
# - Upload assets/icons/icon.svg
# - Generate PNG icons: 16, 32, 48, 128px
# - Save in assets/icons/ directory

# Option 2: Use ImageMagick
brew install imagemagick  # macOS
./generate-placeholder-icons.sh

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select storageinsight-extension folder
```

---

## 🎨 Features Comparison

### Web Dashboard (localhost:3000)

| Feature | Status | Notes |
|---------|--------|-------|
| Visual Dashboard | ✅ | Modern, responsive UI |
| Metric Cards | ✅ | Shows sample data |
| Privacy Score | ✅ | Color-coded (red/yellow/green) |
| Storage Chart | ✅ | Interactive pie chart |
| Quick Actions | ⚠️ | UI only, no backend |
| Real Data | ❌ | Shows sample data only |

### Browser Extension

| Feature | Status | Notes |
|---------|--------|-------|
| Cookie Scanning | ✅ | All domains |
| Storage Analysis | ✅ | localStorage, sessionStorage |
| Privacy Score | ✅ | Real calculation |
| Tracker Detection | ✅ | Pattern matching |
| Clear Tracking | ✅ | Remove cookies |
| Data Export | ✅ | JSON download |
| Auto-Scan | ✅ | Configurable schedule |
| Settings Page | ✅ | Customizable |

---

## 🔄 How They Work Together

### Current Flow

1. **Web Dashboard**: Shows beautiful UI with sample data
2. **Extension**: Collects real browser data
3. **Footer Link**: Users can visit dashboard from extension popup

### Future Integration (Planned)

```javascript
// Extension → Web App
chrome.runtime.sendMessage({
  type: 'SYNC_TO_WEBAPP',
  data: scanResults
});

// Web App ← Extension
window.addEventListener('message', (event) => {
  if (event.data.source === 'storageinsight-extension') {
    updateDashboard(event.data.payload);
  }
});
```

---

## 🛡️ Privacy & Security

### Data Handling

- **Local Processing**: All analysis happens on your device
- **No External Servers**: No data sent to third parties
- **No Tracking**: Extension doesn't track users
- **Open Source**: All code is visible and auditable

### Permissions Explained

| Permission | Purpose |
|------------|---------|
| `cookies` | Read cookies for analysis |
| `storage` | Save settings and cache |
| `tabs` | Get domain information |
| `scripting` | Detect localStorage/sessionStorage |
| `alarms` | Schedule auto-scans |
| `<all_urls>` | Scan all websites |

See `storageinsight-extension/PERMISSIONS.md` for details.

---

## 📊 Privacy Score Algorithm

The extension calculates a privacy score (0-100) based on:

```
Initial Score: 100

Deductions:
- Tracking Cookies:     -30 max (based on ratio)
- Third-Party Cookies:  -20 max
- Insecure Cookies:     -15 max
- Non-HttpOnly:         -10 max
- Too Many Domains:     -15 max
- Large Storage:        -10 max

Final Score: 0-100
```

**Ranges**:
- 90-100: Excellent 🟢
- 70-89: Good 🟢
- 50-69: Fair 🟡
- 30-49: Poor 🔴
- 0-29: Critical 🔴

---

## 🎯 Key Technologies

### Web Dashboard
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **TypeScript**: Full type safety

### Browser Extension
- **Manifest**: V3 (latest)
- **Architecture**: Service Worker + Content Scripts
- **Storage**: Chrome Storage API
- **Permissions**: Minimal required set
- **Pure JavaScript**: No build step needed

---

## 🔧 Development

### Web Dashboard

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Browser Extension

```bash
# No build step needed - pure JavaScript

# After making changes:
# 1. Popup/Options: Reload the page
# 2. Service Worker: Reload extension in chrome://extensions
# 3. Content Script: Reload the webpage

# Debug:
# - Service Worker: chrome://extensions → Inspect views
# - Popup: Right-click popup → Inspect
# - Content Script: F12 on webpage → Console
```

---

## 📚 Documentation

- **Web App**: Built-in documentation on dashboard
- **Extension**:
  - `README.md` - Full documentation
  - `SETUP.md` - Installation guide
  - `PERMISSIONS.md` - Privacy & permissions
  - `assets/icons/ICONS_README.md` - Icon generation

---

## 🚧 Future Enhancements

### High Priority
- [ ] Real-time sync between extension and web app
- [ ] Browser API for web app (IndexedDB, localStorage)
- [ ] Cookie whitelisting feature
- [ ] Detailed cookie viewer
- [ ] Privacy reports (PDF export)

### Medium Priority
- [ ] Firefox extension port
- [ ] Safari extension port
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Historical trend charts

### Low Priority
- [ ] Browser profiles comparison
- [ ] Privacy tips & education
- [ ] Community tracking database
- [ ] Chrome Web Store publication

---

## 🤝 Contributing

### For Web Dashboard
1. Fork the repository
2. Create feature branch
3. Make changes to `app/` directory
4. Test thoroughly
5. Submit pull request

### For Extension
1. Follow Chrome Extension best practices
2. Test on multiple websites
3. Verify privacy compliance
4. Update documentation
5. Submit pull request

---

## 📄 License

MIT License - See LICENSE file

---

## 📞 Support & Contact

- **Issues**: GitHub Issues
- **Documentation**: See `/storageinsight-extension/README.md`
- **Web Dashboard**: http://localhost:3000

---

## 🎉 Quick Start Checklist

- [ ] Node.js and npm installed
- [ ] Run `npm run dev` for web dashboard
- [ ] Visit http://localhost:3000
- [ ] Generate extension icons
- [ ] Load extension in Chrome
- [ ] Click extension icon and scan
- [ ] View results in popup
- [ ] Configure settings
- [ ] Test on various websites
- [ ] Check web dashboard banner
- [ ] Review documentation

---

**Made with 💜 for privacy-conscious users**

Built using Claude Code and Next.js
