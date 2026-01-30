# Ultimate Markdown Viewer

A beautiful, feature-rich markdown viewer with powerful customization options and a clean, modern interface.

## ✨ Features

### 📝 Markdown Rendering
- Full GitHub Flavored Markdown (GFM) support
- Syntax highlighting for code blocks (powered by highlight.js)
- Interactive task lists (checkboxes)
- Mermaid diagram support
- Mathematical expressions
- Auto-generated table of contents
- Collapsible sections

### 🎨 Themes & Customization
- 3 built-in themes: Default (Blue), Dark, Light
- Full theme customizer with live preview
- Customize colors, fonts, layout
- Import/export custom themes
- Persistent theme across sessions

### 📚 File Management
- Multiple file support
- Drag & drop file upload
- Paste markdown directly
- File search and filtering
- Auto-save to browser localStorage
- File metadata (word count, read time, last modified)

### 📖 Viewing Modes
- **Rendered View**: Beautiful styled markdown
- **Raw View**: Plain markdown source
- **Pages View**: Book-style two-page layout with pagination
- Content filters (hide emojis, horizontal rules)

### 🎯 Advanced Features
- Collapsible heading sections
- Smooth scroll navigation
- Table of contents with configurable depth
- Code block enhancements:
  - Copy to clipboard
  - Language labels
  - Toggle comments
  - Line numbers
- External link indicators
- Keyboard shortcuts

### ⌨️ Keyboard Shortcuts
- `Ctrl+O` - Open files
- `Ctrl+Shift+V` - Paste markdown
- `Ctrl+E` - Export to HTML
- `Ctrl+R` - Toggle raw mode
- `Ctrl+B` - Toggle sidebar
- `Ctrl+,` - Theme settings
- `Esc` - Close panels/modals
- `Arrow Keys` - Navigate pages (in page view)

## 🏗️ Architecture

This project follows a modern, modular architecture:

- **Vanilla JavaScript** with ES6 modules (no frameworks!)
- **Modular CSS** organization
- **State management** with single source of truth
- **LocalStorage** for data persistence
- **Event-driven** communication between modules

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

### Project Structure

```
├── index.html              # Main HTML
├── styles.css              # Main stylesheet
├── styles/                 # Modular CSS
│   ├── base.css           # Variables, reset
│   └── layout.css         # Layout structure
├── scripts/               # Modular JavaScript
│   ├── main.js            # Entry point
│   ├── state.js           # State management
│   ├── fileManager.js     # File operations
│   ├── markdownRenderer.js # Markdown rendering
│   ├── themeManager.js    # Theme system
│   ├── themeLoader.js     # Theme loading
│   ├── uiControls.js      # UI interactions
│   ├── tocManager.js      # Table of contents
│   ├── codeBlockEnhancer.js # Code features
│   ├── collapsibleSections.js # Collapsible sections
│   ├── paginationManager.js # Pagination
│   └── loadingAnimations.js # Animations
└── ARCHITECTURE.md        # Architecture docs
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser with ES6 module support
- Static file server (or just open index.html directly)

### Installation

1. Clone or download this repository
2. Open `index.html` in your browser

That's it! No build step, no npm install, no dependencies to manage.

### Using a Local Server

For best results, use a local server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (http-server)
npx http-server

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## 📖 Usage

### Adding Files

**Method 1: Drag & Drop**
- Drag `.md` or `.markdown` files onto the welcome screen

**Method 2: File Browser**
- Click "Select Files" button
- Choose one or more markdown files

**Method 3: Paste Content**
- Click "Paste Markdown" or press `Ctrl+Shift+V`
- Paste your markdown content
- Optionally provide a title (auto-detected from content if blank)

### Viewing Files

- Click any file in the sidebar to view it
- Use the document menu (⋮) for view options:
  - View Rendered (styled markdown)
  - View Raw (plain text)
  - View Pages (book layout)
  - Export HTML

### Customizing Themes

1. Click the palette icon (🎨) in the sidebar header
2. Choose a preset or customize colors
3. Adjust typography and layout
4. Export your theme to share or backup

### Collapsible Sections

- Click any heading (H2+) to collapse/expand that section
- All subsections collapse with their parent
- URL hashes auto-expand to target section

### Table of Contents

- Automatically generated for all headings
- Click TOC items for smooth scroll navigation
- Adjust depth filter (H1-H2, H1-H3, H1-H4, All)
- Highlighted current section as you scroll

## 🎨 Customization

### Theme Presets

**Default (Blue & Purple)**
- Modern, professional look
- Vibrant accent colors
- Dark background

**Dark**
- True dark theme
- Reduced contrast
- Easy on the eyes

**Light**
- Clean, bright interface
- High contrast
- Perfect for daytime use

### Custom Themes

Create your own theme:
1. Open theme customizer
2. Adjust colors, fonts, sizes
3. Export as JSON
4. Share with others or import later

## 🔧 Development

### Code Organization

- **Modular ES6**: Each feature is a self-contained module
- **State Management**: Centralized state in `state.js`
- **Event-Driven**: Custom events for cross-module communication
- **No Build Step**: Pure vanilla JavaScript

### Adding Features

1. Create new module in `scripts/`
2. Export functions/classes
3. Import in `main.js`
4. Initialize in `DOMContentLoaded`

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed guidelines.

## 📦 Technologies

- **marked.js** - Markdown parsing
- **DOMPurify** - XSS protection
- **highlight.js** - Syntax highlighting
- **mermaid.js** - Diagram rendering
- **Font Awesome** - Icons
- **Inter & Recursive** - Fonts

## 🤝 Contributing

Contributions welcome! Please:

1. Follow the existing code style
2. Update documentation
3. Test across browsers
4. Consider accessibility

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🙏 Acknowledgments

- Inspired by GitHub's markdown rendering
- Built with modern web standards
- No frameworks, just good code

## 🐛 Known Issues

- None currently! Report issues on GitHub.

## 📈 Roadmap

- [ ] Complete CSS modularization
- [ ] TypeScript conversion
- [ ] Unit tests
- [ ] Offline PWA support
- [ ] Markdown editing
- [ ] Export to PDF
- [ ] Plugin system

---

**Made with ❤️ using vanilla JavaScript**

*No frameworks were harmed in the making of this application*
