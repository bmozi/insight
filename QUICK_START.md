# 🚀 Insight - Quick Start Guide

## What You Have

✅ **Web Dashboard** (Next.js) - Running at http://localhost:3000
✅ **Chrome Extension** - Ready to install in `storageinsight-extension/`

---

## 5-Minute Setup

### Step 1: View Web Dashboard (Already Done!)
```bash
# Server is running at http://localhost:3000
# Open in browser to see the dashboard
```

### Step 2: Install Browser Extension

**Generate Icons First** (Required):
```bash
# Option A: Online (Easiest)
1. Go to https://redketchup.io/icon-converter
2. Upload: storageinsight-extension/assets/icons/icon.svg
3. Generate PNG: 16, 32, 48, 128 pixels
4. Save in: storageinsight-extension/assets/icons/
   - icon-16.png
   - icon-32.png
   - icon-48.png
   - icon-128.png

# Option B: Command Line (if ImageMagick installed)
cd storageinsight-extension
./generate-placeholder-icons.sh
```

**Load Extension**:
```
1. Open Chrome: chrome://extensions/
2. Enable: "Developer mode" (top-right toggle)
3. Click: "Load unpacked"
4. Select: storageinsight-extension folder
5. Done! Extension icon appears in toolbar
```

### Step 3: Test It
1. Click extension icon in Chrome toolbar
2. Click "Scan Storage" button
3. View your real browser metrics!

---

## What Each Component Does

| Component | Purpose | Data |
|-----------|---------|------|
| **Web Dashboard** | Pretty visualization | Sample data |
| **Extension Popup** | Quick metrics view | Real browser data |
| **Extension Settings** | Configure behavior | Your preferences |
| **Content Scripts** | Monitor pages | Injected automatically |
| **Background Worker** | Process scans | Runs in background |

---

## File Structure Cheat Sheet

```
insight/
├── app/page.tsx              ← Web dashboard code
├── storageinsight-extension/
│   ├── manifest.json         ← Extension config
│   ├── popup/popup.js        ← Popup logic
│   ├── background/           ← Background tasks
│   ├── lib/                  ← Core scanning logic
│   └── assets/icons/         ← Extension icons (MUST GENERATE!)
└── PROJECT_OVERVIEW.md       ← Full documentation
```

---

## Common Tasks

### View Web Dashboard
```bash
# Already running at:
http://localhost:3000
```

### Reload Extension After Changes
```
1. Go to chrome://extensions/
2. Find "StorageInsight"
3. Click refresh icon
```

### Debug Extension
```
Popup:          Right-click extension icon → Inspect
Service Worker: chrome://extensions → Inspect views
Content Script: F12 on webpage → Console tab
```

### Update Web Dashboard
```bash
# Edit: app/page.tsx
# Save: Auto-reloads (Next.js hot reload)
```

---

## Troubleshooting

**Extension won't load?**
→ Make sure icons exist in `storageinsight-extension/assets/icons/`

**No data showing?**
→ Click "Scan Storage" button first

**Web dashboard not running?**
→ Run: `npm run dev`

**Icons missing?**
→ See `storageinsight-extension/assets/icons/ICONS_README.md`

---

## Documentation Links

📖 **Web Dashboard**: http://localhost:3000
📖 **Extension Docs**: `storageinsight-extension/README.md`
📖 **Setup Guide**: `storageinsight-extension/SETUP.md`
📖 **Full Overview**: `PROJECT_OVERVIEW.md`

---

## Next Steps

1. ✅ Install and test extension
2. 📊 Scan your real browser data
3. 🎨 Explore web dashboard
4. ⚙️ Configure extension settings
5. 📖 Read full documentation
6. 🚀 Start building new features!

---

**Need Help?**
- Check `PROJECT_OVERVIEW.md` for complete details
- Review `storageinsight-extension/README.md` for extension specifics
- See `storageinsight-extension/SETUP.md` for detailed setup

**Happy Privacy Managing! 🛡️**
