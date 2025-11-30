# Extension Icons

## Required Icons

The extension requires PNG icons in the following sizes:
- 16x16 pixels (icon-16.png)
- 32x32 pixels (icon-32.png)
- 48x48 pixels (icon-48.png)
- 128x128 pixels (icon-128.png)

## How to Generate Icons

### Option 1: Use an Online Tool
1. Go to https://redketchup.io/icon-converter
2. Upload the `icon.svg` file
3. Select PNG format
4. Generate icons in all required sizes
5. Save them in this directory with the correct names

### Option 2: Use ImageMagick (Command Line)
```bash
# Install ImageMagick if not installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Generate all sizes from SVG
convert icon.svg -resize 16x16 icon-16.png
convert icon.svg -resize 32x32 icon-32.png
convert icon.svg -resize 48x48 icon-48.png
convert icon.svg -resize 128x128 icon-128.png
```

### Option 3: Use Inkscape (Cross-platform)
1. Install Inkscape (free vector graphics editor)
2. Open `icon.svg` in Inkscape
3. File > Export PNG Image
4. Set width/height to desired size
5. Export each size

### Option 4: Design Your Own
Create your own icon designs using:
- Figma (https://figma.com)
- Canva (https://canva.com)
- Adobe Illustrator
- Affinity Designer

## Temporary Placeholders

For development and testing, you can use simple placeholder images.
The extension will work without proper icons, but they won't look professional.

## Icon Design Guidelines

- Use the purple (#8b5cf6) and blue (#3b82f6) gradient theme
- Include a shield symbol to represent privacy/security
- Keep the design simple and recognizable at small sizes
- Ensure good contrast for visibility
- Use transparent background (PNG with alpha channel)
