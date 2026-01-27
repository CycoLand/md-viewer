# Cycodum Learning Blocks - Setup Guide

This website can be run in multiple ways to avoid CORS issues. Choose the method that works best for you!

## 🎯 Method 1: Embedded Mode (Recommended - No Server Required!)

This is the **easiest method** - just double-click `index.html` and it works!

### Setup (One-time):

1. Make sure you have Node.js installed
2. Run the build script:
   - **Windows**: Double-click `build.bat`
   - **Mac/Linux**: Run `./build.sh` (or `bash build.sh`)
   - **Manual**: Run `node build-embedded.js`

3. Open `index.html` in your browser - that&apos;s it!

### When to rebuild:
Run the build script again whenever you modify any markdown files in the `modified_blocks` folder.

### How it works:
The build script reads all markdown files and embeds them as JavaScript data in `blocks-data.js`. This eliminates the need for fetching files, so no server is required!

---

## 🌐 Method 2: Local Web Server

If you prefer keeping the files separate or want live reloading, you can use a local web server.

### Option A: Python (Easiest)
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

### Option B: Node.js (http-server)
```bash
# Install globally (one-time)
npm install -g http-server

# Run
http-server

# Then open: http://localhost:8080
```

### Option C: VS Code Live Server Extension
1. Install &quot;Live Server&quot; extension in VS Code
2. Right-click `index.html` → &quot;Open with Live Server&quot;

### Option D: Node.js (live-server with auto-reload)
```bash
# Install globally (one-time)
npm install -g live-server

# Run
live-server

# Browser automatically opens and reloads on file changes!
```

---

## 📊 Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **Embedded Mode** | ✅ No server needed&lt;br&gt;✅ Works offline&lt;br&gt;✅ Easy to share | ❌ Need to rebuild after changes&lt;br&gt;❌ Larger file size | Sharing, offline use, simple deployment |
| **Web Server** | ✅ No build step&lt;br&gt;✅ Instant updates&lt;br&gt;✅ Smaller files | ❌ Need to run server&lt;br&gt;❌ Need internet for CDN resources | Development, frequent content updates |

---

## 🔧 Files Explained

- **`index.html`** - Main HTML file, open this in your browser
- **`script.js`** - Main application JavaScript (supports both modes)
- **`styles.css`** - All the styling
- **`blocks-data.js`** - Generated file with embedded markdown (for Method 1)
- **`build-embedded.js`** - Build script that generates blocks-data.js
- **`build.bat`** / **`build.sh`** - Convenient build scripts for Windows/Linux/Mac
- **`modified_blocks/`** - Folder containing all the markdown block files

---

## 🎨 Features

- **Theme Customizer**: Click the palette icon to customize colors, fonts, and layout
- **Search**: Search across all blocks
- **Filters**: Filter blocks by technology, deployment type, etc.
- **Grid/List Views**: Toggle between different viewing layouts
- **Progressive Navigation**: Navigate between blocks with previous/next buttons

---

## 🐛 Troubleshooting

### Problem: Blocks won&apos;t load when opening index.html directly

**Solution**: You haven&apos;t run the build script yet!
- Run `build.bat` (Windows) or `build.sh` (Mac/Linux)
- Or run `node build-embedded.js`
- Make sure `blocks-data.js` is created

### Problem: Build script doesn&apos;t work

**Check**: Do you have Node.js installed?
- Download from https://nodejs.org/
- Test with `node --version` in terminal

### Problem: Changes to markdown files don&apos;t appear

**Solution**: Run the build script again!
- The embedded mode requires rebuilding after any content changes
- Or switch to using a web server for instant updates during development

---

## 📝 Notes

- The website automatically detects if `blocks-data.js` is available and uses embedded mode
- If `blocks-data.js` is not found, it falls back to fetching (requires a web server)
- Both modes work identically - the user experience is the same
- Theme customizations are saved to browser localStorage

---

## 🚀 Quick Start (TL;DR)

```bash
# One-time setup
node build-embedded.js

# Open index.html in your browser - Done! 🎉
```

Or for development with live reload:
```bash
python -m http.server 8000
# Open http://localhost:8000
```