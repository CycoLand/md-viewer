// Global variables
let files = new Map();
let currentFileId = null;
let sidebarCollapsed = false;
let rawMode = false;

// Theme management
class ThemeManager {
    constructor() {
        this.loadTheme();
        this.initializeThemePanel();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('markdownViewerTheme');
        if (savedTheme) {
            try {
                const theme = JSON.parse(savedTheme);
                this.applyTheme(theme);
            } catch (error) {
                console.error('Error loading saved theme:', error);
            }
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    getCurrentTheme() {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        return {
            '--primary-color': computedStyle.getPropertyValue('--primary-color').trim(),
            '--bg-color': computedStyle.getPropertyValue('--bg-color').trim(),
            '--surface-color': computedStyle.getPropertyValue('--surface-color').trim(),
            '--text-color': computedStyle.getPropertyValue('--text-color').trim(),
            '--accent-color': computedStyle.getPropertyValue('--accent-color').trim(),
            '--font-family': computedStyle.getPropertyValue('--font-family').trim(),
            '--font-size': computedStyle.getPropertyValue('--font-size').trim(),
            '--line-height': computedStyle.getPropertyValue('--line-height').trim(),
            '--sidebar-width': computedStyle.getPropertyValue('--sidebar-width').trim(),
            '--content-max-width': computedStyle.getPropertyValue('--content-max-width').trim(),
        };
    }

    saveTheme() {
        const theme = this.getCurrentTheme();
        localStorage.setItem('markdownViewerTheme', JSON.stringify(theme));
    }

    resetTheme() {
        localStorage.removeItem('markdownViewerTheme');
        location.reload();
    }

    exportTheme() {
        const theme = this.getCurrentTheme();
        const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'markdown-viewer-theme.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    initializeThemePanel() {
        // Color inputs
        document.getElementById('primary-color').addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--primary-color', e.target.value);
            document.documentElement.style.setProperty('--primary-hover', this.adjustBrightness(e.target.value, -10));
            this.saveTheme();
        });

        document.getElementById('bg-color').addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--bg-color', e.target.value);
            this.saveTheme();
        });

        document.getElementById('surface-color').addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--surface-color', e.target.value);
            this.saveTheme();
        });

        document.getElementById('text-color').addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--text-color', e.target.value);
            this.saveTheme();
        });

        document.getElementById('accent-color').addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--accent-color', e.target.value);
            this.saveTheme();
        });

        // Typography inputs
        document.getElementById('font-family').addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--font-family', e.target.value);
            this.saveTheme();
        });

        document.getElementById('font-size').addEventListener('input', (e) => {
            const value = e.target.value + 'px';
            document.documentElement.style.setProperty('--font-size', value);
            document.getElementById('font-size-value').textContent = value;
            this.saveTheme();
        });

        document.getElementById('line-height').addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--line-height', e.target.value);
            document.getElementById('line-height-value').textContent = e.target.value;
            this.saveTheme();
        });

        // Layout inputs
        document.getElementById('sidebar-width').addEventListener('input', (e) => {
            const value = e.target.value + 'px';
            document.documentElement.style.setProperty('--sidebar-width', value);
            document.getElementById('sidebar-width-value').textContent = value;
            this.saveTheme();
        });

        document.getElementById('content-width').addEventListener('input', (e) => {
            const value = e.target.value + 'px';
            document.documentElement.style.setProperty('--content-max-width', value);
            document.getElementById('content-width-value').textContent = value;
            this.saveTheme();
        });

        // Theme actions
        document.getElementById('reset-theme').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the theme to default?')) {
                this.resetTheme();
            }
        });

        document.getElementById('export-theme').addEventListener('click', () => {
            this.exportTheme();
        });

        document.getElementById('import-theme-btn').addEventListener('click', () => {
            document.getElementById('import-theme').click();
        });

        document.getElementById('import-theme').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const theme = JSON.parse(event.target.result);
                        this.applyTheme(theme);
                        this.saveTheme();
                        this.updateThemeInputs();
                    } catch (error) {
                        alert('Error importing theme: Invalid JSON file');
                    }
                };
                reader.readAsText(file);
            }
        });

        this.updateThemeInputs();
    }

    updateThemeInputs() {
        const theme = this.getCurrentTheme();
        
        document.getElementById('primary-color').value = this.rgbToHex(theme['--primary-color']);
        document.getElementById('bg-color').value = this.rgbToHex(theme['--bg-color']);
        document.getElementById('surface-color').value = this.rgbToHex(theme['--surface-color']);
        document.getElementById('text-color').value = this.rgbToHex(theme['--text-color']);
        document.getElementById('accent-color').value = this.rgbToHex(theme['--accent-color']);
        
        document.getElementById('font-family').value = theme['--font-family'].replace(/'/g, '');
        document.getElementById('font-size').value = parseInt(theme['--font-size']);
        document.getElementById('font-size-value').textContent = theme['--font-size'];
        document.getElementById('line-height').value = parseFloat(theme['--line-height']);
        document.getElementById('line-height-value').textContent = theme['--line-height'];
        
        document.getElementById('sidebar-width').value = parseInt(theme['--sidebar-width']);
        document.getElementById('sidebar-width-value').textContent = theme['--sidebar-width'];
        document.getElementById('content-width').value = parseInt(theme['--content-max-width']);
        document.getElementById('content-width-value').textContent = theme['--content-max-width'];
    }

    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        
        const values = rgb.match(/\d+/g);
        if (!values) return '#000000';
        
        const hex = values.map(val => {
            const hex = parseInt(val).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        
        return '#' + hex;
    }

    adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
}

// File management
class FileManager {
    static generateId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static addFile(name, content, id = null) {
        const fileId = id || this.generateId();
        files.set(fileId, {
            id: fileId,
            name: name,
            content: content,
            modified: new Date()
        });
        this.renderFileList();
        return fileId;
    }

    static removeFile(fileId) {
        files.delete(fileId);
        if (currentFileId === fileId) {
            currentFileId = null;
            this.showWelcomeScreen();
        }
        this.renderFileList();
    }

    static getFile(fileId) {
        return files.get(fileId);
    }

    static renderFileList() {
        const fileList = document.getElementById('file-list');
        
        if (files.size === 0) {
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-text"></i>
                    <p>No files loaded</p>
                    <p class="subtitle">Add some markdown files to get started</p>
                </div>
            `;
            return;
        }

        const fileArray = Array.from(files.values()).sort((a, b) => a.name.localeCompare(b.name));
        
        fileList.innerHTML = fileArray.map(file => `
            <div class="file-item ${currentFileId === file.id ? 'active' : ''}" data-file-id="${file.id}">
                <i class="fas fa-file-markdown file-icon"></i>
                <span class="file-name" title="${file.name}">${file.name}</span>
                <div class="file-actions">
                    <button class="btn btn-icon" onclick="FileManager.removeFile('${file.id}')" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add click handlers
        fileList.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.file-actions')) {
                    const fileId = item.dataset.fileId;
                    this.selectFile(fileId);
                }
            });
        });
    }

    static selectFile(fileId) {
        const file = this.getFile(fileId);
        if (!file) return;

        currentFileId = fileId;
        this.renderFileList();
        this.showFile(file);
    }

    static showFile(file) {
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('content-area').style.display = 'flex';
        document.getElementById('current-file-name').textContent = file.name;

        if (rawMode) {
            this.showRawContent(file.content);
        } else {
            this.showRenderedContent(file.content);
        }
    }

    static showRenderedContent(content) {
        document.getElementById('markdown-content').style.display = 'block';
        document.getElementById('raw-content').style.display = 'none';
        
        // Configure marked options
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {}
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });

        const html = marked.parse(content);
        const sanitizedHtml = DOMPurify.sanitize(html);
        document.getElementById('markdown-content').innerHTML = sanitizedHtml;
    }

    static showRawContent(content) {
        document.getElementById('markdown-content').style.display = 'none';
        document.getElementById('raw-content').style.display = 'block';
        document.getElementById('raw-markdown').textContent = content;
    }

    static showWelcomeScreen() {
        document.getElementById('welcome-screen').style.display = 'flex';
        document.getElementById('content-area').style.display = 'none';
        currentFileId = null;
    }

    static exportCurrentFileAsHtml() {
        if (!currentFileId) return;
        
        const file = this.getFile(currentFileId);
        if (!file) return;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        pre {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #ddd;
            margin: 0;
            padding: 0 1rem;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 0.5rem;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
        }
    </style>
</head>
<body>
${marked.parse(file.content)}
</body>
</html>
        `;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.md$/, '.html');
        a.click();
        URL.revokeObjectURL(url);
    }
}

// UI Controls
function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    } else {
        sidebar.classList.remove('collapsed');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    }
}

function toggleThemePanel() {
    const panel = document.getElementById('theme-panel');
    const overlay = document.getElementById('overlay');
    
    panel.classList.toggle('open');
    overlay.classList.toggle('show');
}

function closeThemePanel() {
    document.getElementById('theme-panel').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}

function toggleRawMode() {
    rawMode = !rawMode;
    const btn = document.getElementById('toggle-raw-btn');
    
    if (rawMode) {
        btn.innerHTML = '<i class="fas fa-eye"></i> Rendered';
        btn.classList.add('active');
    } else {
        btn.innerHTML = '<i class="fas fa-code"></i> Raw';
        btn.classList.remove('active');
    }

    if (currentFileId) {
        const file = FileManager.getFile(currentFileId);
        if (file) {
            FileManager.showFile(file);
        }
    }
}

function showPasteModal() {
    const modal = document.getElementById('paste-modal');
    modal.classList.add('show');
}

function closePasteModal() {
    const modal = document.getElementById('paste-modal');
    modal.classList.remove('show');
    document.getElementById('file-name-input').value = '';
    document.getElementById('markdown-input').value = '';
}

function addPastedContent() {
    const nameInput = document.getElementById('file-name-input');
    const contentInput = document.getElementById('markdown-input');
    
    const name = nameInput.value.trim() || 'Untitled.md';
    const content = contentInput.value.trim();
    
    if (!content) {
        alert('Please enter some markdown content');
        return;
    }

    const fileId = FileManager.addFile(name, content);
    FileManager.selectFile(fileId);
    closePasteModal();
}

// Drag and drop functionality
function initializeDragAndDrop() {
    const dragArea = document.getElementById('drag-drop-area');
    const body = document.body;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        body.addEventListener(eventName, preventDefaults, false);
        dragArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        body.addEventListener(eventName, () => dragArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        body.addEventListener(eventName, () => dragArea.classList.remove('drag-over'), false);
    });

    body.addEventListener('drop', handleDrop, false);
    dragArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(fileList) {
    Array.from(fileList).forEach(file => {
        if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = function(e) {
                const fileId = FileManager.addFile(file.name, e.target.result);
                FileManager.selectFile(fileId);
            };
            reader.readAsText(file);
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme manager
    new ThemeManager();

    // Initialize drag and drop
    initializeDragAndDrop();

    // File input handler
    document.getElementById('file-input').addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });

    // Button handlers
    document.getElementById('add-files-btn').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });

    document.getElementById('paste-content-btn').addEventListener('click', showPasteModal);
    document.getElementById('welcome-paste-btn').addEventListener('click', showPasteModal);

    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('theme-toggle').addEventListener('click', toggleThemePanel);
    document.getElementById('close-theme-panel').addEventListener('click', closeThemePanel);

    document.getElementById('export-html-btn').addEventListener('click', FileManager.exportCurrentFileAsHtml);
    document.getElementById('toggle-raw-btn').addEventListener('click', toggleRawMode);

    // Overlay click handler
    document.getElementById('overlay').addEventListener('click', closeThemePanel);

    // Modal click outside to close
    document.getElementById('paste-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closePasteModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'o':
                    e.preventDefault();
                    document.getElementById('file-input').click();
                    break;
                case 'v':
                    if (e.shiftKey) {
                        e.preventDefault();
                        showPasteModal();
                    }
                    break;
                case 'e':
                    if (currentFileId) {
                        e.preventDefault();
                        FileManager.exportCurrentFileAsHtml();
                    }
                    break;
                case 'r':
                    if (currentFileId) {
                        e.preventDefault();
                        toggleRawMode();
                    }
                    break;
                case 'b':
                    e.preventDefault();
                    toggleSidebar();
                    break;
                case ',':
                    e.preventDefault();
                    toggleThemePanel();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            if (document.getElementById('theme-panel').classList.contains('open')) {
                closeThemePanel();
            }
            if (document.getElementById('paste-modal').classList.contains('show')) {
                closePasteModal();
            }
        }
    });

    // Mobile responsive behavior
    if (window.innerWidth <= 768) {
        sidebarCollapsed = true;
        document.getElementById('sidebar').classList.add('collapsed');
    }

    // Window resize handler
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            if (!sidebarCollapsed) {
                toggleSidebar();
            }
        }
    });

    console.log('🎉 Ultimate Markdown Viewer initialized!');
    console.log('💡 Keyboard shortcuts:');
    console.log('   Ctrl+O: Open files');
    console.log('   Ctrl+Shift+V: Paste markdown');
    console.log('   Ctrl+E: Export HTML');
    console.log('   Ctrl+R: Toggle raw mode');
    console.log('   Ctrl+B: Toggle sidebar');
    console.log('   Ctrl+,: Theme settings');
    console.log('   Escape: Close panels');
});