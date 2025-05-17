#!/bin/bash

# Parse arguments
while getopts v: flag; do
    case "${flag}" in
    v) VER=${OPTARG} ;;
    esac
done

if [ -z "$VER" ]; then
    echo "Usage: $0 -v VERSION"
    exit 1
fi

SRC_DIR="./src"
DEST_DIR="./chrome"
ZIP_NAME="yt-focus-${VER}-chrome.zip"

# Create temp files to track files
TEMP_FILE=$(mktemp)
CURRENT_FILES=$(mktemp)

# Save list of existing files in chrome (relative paths)
(
    cd "$DEST_DIR" || exit 1
    find . -type f
) >"$TEMP_FILE"

# Copy new/updated files from src to chrome
cp -r "$SRC_DIR/"* "$DEST_DIR/"

# Replace VERSION_NUM in manifest.json with provided version
MANIFEST_FILE="${DEST_DIR}/manifest.json"
if [ -f "$MANIFEST_FILE" ]; then
    sed -i.bak "s/VERSION_NUM/${VER}/g" "$MANIFEST_FILE"
fi

# Save list of current files after copy
(
    cd "$DEST_DIR" || exit 1
    find . -type f
) >"$CURRENT_FILES"

# Find new files (not present in original list)
NEW_FILES=$(comm -13 <(sort "$TEMP_FILE") <(sort "$CURRENT_FILES"))

# Zip contents of chrome folder (not the folder itself)
cd "$DEST_DIR" || exit 1
zip -r "../$ZIP_NAME" ./*
cd - >/dev/null

# Restore original manifest.json
if [ -f "${MANIFEST_FILE}.bak" ]; then
    mv "${MANIFEST_FILE}.bak" "$MANIFEST_FILE"
fi

# Delete only newly added files
cd "$DEST_DIR" || exit 1
while IFS= read -r file; do
    rm -f "$file"
    # Remove empty parent directories
    dir=$(dirname "$file")
    while [ "$dir" != "." ] && [ "$dir" != "/" ]; do
        rmdir --ignore-fail-on-non-empty "$dir" 2>/dev/null
        dir=$(dirname "$dir")
    done
done <<<"$NEW_FILES"
cd - >/dev/null

# Clean up temp files
rm "$TEMP_FILE" "$CURRENT_FILES"

echo "Build complete: $ZIP_NAME"
