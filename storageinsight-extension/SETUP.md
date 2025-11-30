# StorageInsight Extension Setup Guide

## Quick Start

### 1. Generate Icons (Required)

The extension needs PNG icons before it can be loaded. Choose one of these methods:

#### Option A: Online Converter (Easiest)
1. Go to https://redketchup.io/icon-converter
2. Upload `assets/icons/icon.svg`
3. Select PNG format
4. Generate sizes: 16, 32, 48, 128 pixels
5. Download and save in `assets/icons/` with names:
   - `icon-16.png`
   - `icon-32.png`
   - `icon-48.png`
   - `icon-128.png`

#### Option B: Use ImageMagick (Command Line)
```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Linux

# Run the generation script
./generate-placeholder-icons.sh
```

#### Option C: Temporary Placeholders
For quick testing, you can create simple placeholder files:
```bash
cd assets/icons
# Create simple 1x1 colored pixels and scale them
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > icon-16.png
cp icon-16.png icon-32.png
cp icon-16.png icon-48.png
cp icon-16.png icon-128.png
```

### 2. Load Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `storageinsight-extension` folder
5. Extension should appear with the name "StorageInsight"

### 3. Test the Extension

1. Click the StorageInsight icon in toolbar
2. Click "Scan Storage" button
3. View your privacy metrics
4. Try the quick actions (Clear Tracking, Export Data)
5. Access settings via the gear icon

## Verification Checklist

- [ ] Icons are generated (check `assets/icons/` directory)
- [ ] Extension loaded without errors in `chrome://extensions`
- [ ] Popup opens when clicking extension icon
- [ ] Scan button works and shows results
- [ ] Settings page opens and saves preferences
- [ ] No console errors in service worker or popup

## Troubleshooting

### "Extension manifest is not valid"
- Make sure all icon files exist in `assets/icons/`
- Check that icon file names match those in `manifest.json`

### Service Worker Errors
- Click "Inspect views: service worker" in `chrome://extensions`
- Check console for specific error messages
- Make sure all `.js` files are present

### Popup Not Working
- Right-click extension icon → Inspect popup
- Check console for errors
- Verify `popup.html`, `popup.js`, and `popup.css` exist

### Storage Scan Returns No Data
- This is normal if you haven't visited many websites
- Try visiting a few popular sites first
- Some storage types may require permissions

## Next Steps

Once the extension is loaded and working:

1. **Visit the web dashboard**: http://localhost:3000
2. **Customize settings**: Right-click extension → Options
3. **Test on various websites**: Browse normally and scan periodically
4. **Check privacy score**: Aim for 70+ for good privacy

## Development Notes

- Changes to popup/options: Just reload the page
- Changes to service worker: Reload extension in `chrome://extensions`
- Changes to content scripts: Reload the webpage
- Always test on multiple sites before considering it production-ready

## Need Help?

- Check `README.md` for detailed documentation
- Review `PERMISSIONS.md` to understand why each permission is needed
- See `assets/icons/ICONS_README.md` for more icon generation options
