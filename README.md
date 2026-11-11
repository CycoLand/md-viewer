# Ultimate Markdown Viewer

A beautiful, feature-rich Markdown viewer that runs entirely in your browser, with a clean, modern interface and lots of reading aids.

**Live:** https://cycoland.github.io/md-viewer/ (deployed from `main` by GitHub Pages)

## ✨ Features

### 📝 Markdown rendering
- GitHub Flavored Markdown (tables, task lists, strikethrough, autolinks) via marked
- Syntax highlighting for code blocks (highlight.js), colored to match the theme
- Mermaid diagrams, with zoom, a source view, copy and SVG download
- Output sanitized with DOMPurify
- Interactive task lists: click a task to check it off
- Lists where every item starts with ✅ get theme-styled check marks
- Lists where every item is `**Label:** value` become a grid of cards

### 📖 Reading
- **Table of contents** that tracks your scroll position. It appears beside the text whenever there's room for both.
- **Collapsible sections:** click any heading from H2 down to fold its section
- **Reading progress bar** along the top, plus an optional animated "water" progress bar beside the table of contents
- **Reading mode** with adjustable characters per line and line height
- **Views:** rendered, raw Markdown, or a two-page book layout (arrow keys turn pages)
- **Filters** to hide emojis or horizontal rules
- **Prints cleanly:** dark-on-light, every page, without the app's buttons

### 🖍️ Highlights, comments and acronyms
- **Highlights:** drag with the right mouse button to highlight text (a plain right-click still opens the browser menu). Drag a highlight's handles to resize it. Highlights are saved with the document.
- **Comments:** click a highlight (or Tab to it and press Enter) to open a comment box under it. Comments save as you type. A highlight with a comment ends in a speech-bubble icon and shows the comment when you hover it. Remove a highlight from the same box; if it has a comment, you're asked to confirm.
- **Acronym definitions:** click an ALL-CAPS word for its meaning, looked up with the free [STANDS4 Abbreviations API](https://www.abbreviations.com/api.php). Add your own API key under Settings → Acronym Definitions; it's stored only in your browser.

### 📊 Tables
- Click a column header to sort: descending, then ascending, then back to the original order. Sorts stack across columns.
- Tables too wide for the text column get an expand button that opens them full screen.

### 📋 Code blocks
- Copy button and language label
- Collapse a block by clicking its header
- Hide or show comments

### 🎨 Themes
- 8 presets: Default, Dark, Light, Ocean, Sunset, Forest, Blue & Orange, Blue & Pink
- Theme customizer for colors, font, font size, line height, sidebar width and content width
- Import and export themes as JSON

### 📚 Files
- Open `.md`, `.markdown` or `.txt` files, drag and drop them, or paste Markdown (the title is detected from the content)
- Documents are saved in your browser's localStorage and listed with their read time, line count and date
- Search filters the list by document name and content
- Copy a document as Markdown, or export it as a standalone HTML file

### 🤖 Opening content from cycod
Opening the viewer with `?useClipboard=true` creates a new document from the clipboard, so a tool can copy its output and open the page in one step. The browser may ask for permission to read the clipboard.

### ⌨️ Keyboard shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open files |
| `Ctrl+Shift+V` | Paste Markdown |
| `Ctrl+E` | Export to HTML |
| `Ctrl+R` | Switch between rendered and raw view |
| `Ctrl+B` | Show or hide the sidebar |
| `Ctrl+,` | Theme customizer |
| `Esc` | Close panels and dialogs |
| `←` / `→` | Turn pages in the book view |

## 🚀 Running it

There is no build step and nothing to install. The page uses ES modules, so serve the folder over HTTP rather than opening `index.html` from disk:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. Any static server works (for example `npx http-server`).

The libraries (marked, DOMPurify, highlight.js, Mermaid, Font Awesome) and the fonts (Inter, Recursive, JetBrains Mono) load from CDNs, so the first load needs a network connection.

## 🏗️ How it's built

Vanilla JavaScript ES modules and plain CSS, with no framework and no bundler.

```
├── index.html              # Page markup: sidebar, panels, menus, dialogs
├── styles.css              # Entry stylesheet; @imports everything in css/
├── css/
│   ├── tokens.css          # Design tokens: colors, type, spacing (theme variables)
│   ├── base.css, layout.css, sidebar.css, toc.css, markdown.css, ...
│   └── responsive-print.css  # Tablet/phone breakpoints and print styles
└── scripts/
    ├── main.js             # Entry point: wires up modules and shortcuts
    ├── state.js            # Shared state and localStorage keys
    ├── themeLoader.js      # Applies the saved theme before first paint
    ├── themeManager.js     # Presets, customizer, highlight.js theme
    ├── settingsManager.js  # Settings panel and quick menu
    ├── fileManager.js      # Documents: storage, list, export
    ├── markdownRenderer.js # Markdown → HTML, then runs the enhancers below
    ├── codeBlockEnhancer.js, collapsibleSections.js, sortableTables.js,
    │   tableOverlay.js, listCardEnhancer.js, checkmarkLists.js
    ├── tocManager.js, tocScrollSpy.js, tocTrack.js, tocLayout.js
    ├── highlights.js, highlightComments.js, acronyms.js
    ├── progressBar.js, waterProgressBar.js, waterFish.js
    └── paginationManager.js, clipboardAutoLoader.js, uiControls.js, ...
```

- **Themes** are sets of CSS custom properties. `themeManager.js` holds the presets, and `tokens.css` holds the defaults, which match the Default preset.
- **Rendering:** `markdownRenderer.js` parses with marked, sanitizes with DOMPurify, then runs each enhancer over the result.
- **Storage:** documents, highlights, settings and the theme live in localStorage.
- **Modules** talk through direct imports and a few custom DOM events (for example `togglePagination`).

### Adding a feature

1. Add a module under `scripts/` and import it from `main.js` (or from `markdownRenderer.js` if it enhances rendered content).
2. Put its styles in a file under `css/` and `@import` it from `styles.css`.
3. Use the theme variables from `css/tokens.css` for colors, so it works in every preset.

## 🤝 Contributing

Contributions are welcome:

1. Follow the existing code style
2. Update this README when behavior changes
3. Check light and dark presets, a phone-width window and keyboard use
4. Don't show state by color alone; pair it with an icon, text or shape

## 📈 Roadmap

- [ ] TypeScript conversion
- [ ] Unit tests
- [ ] Offline PWA support
- [ ] Markdown editing
- [ ] Export to PDF
- [ ] Plugin system

## 📄 License

MIT License: feel free to use this project however you'd like.

---

**Made with ❤️ using vanilla JavaScript.** *No frameworks were harmed in the making of this application.*
