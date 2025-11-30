#!/bin/bash

# Generate placeholder PNG icons for the extension
# These are simple colored squares - replace with proper icons later!

echo "🎨 Generating placeholder icons..."

cd "$(dirname "$0")/assets/icons"

# Function to create a colored PNG placeholder
create_icon() {
  size=$1
  filename="icon-${size}.png"

  # Create a simple colored square using ImageMagick
  # If ImageMagick is not installed, this will fail gracefully
  if command -v convert &> /dev/null; then
    convert -size ${size}x${size} xc:'#8b5cf6' \
      -gravity center \
      -pointsize $((size/2)) \
      -fill white \
      -annotate +0+0 "🛡️" \
      "$filename" 2>/dev/null || \
    convert -size ${size}x${size} xc:'#8b5cf6' "$filename"
    echo "✅ Created $filename"
  else
    echo "⚠️  ImageMagick not found. Please install it or use an online icon generator."
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo ""
    echo "   Or convert icon.svg manually using:"
    echo "   - https://redketchup.io/icon-converter"
    echo "   - https://www.aconvert.com/icon/svg-to-ico/"
    exit 1
  fi
}

# Generate all required sizes
create_icon 16
create_icon 32
create_icon 48
create_icon 128

echo ""
echo "✅ Placeholder icons generated!"
echo "⚠️  These are simple placeholders. For production:"
echo "   1. Use the icon.svg file"
echo "   2. Convert to PNG in multiple sizes"
echo "   3. See ICONS_README.md for instructions"
