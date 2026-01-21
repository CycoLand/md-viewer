// Global variables
let files = new Map();
let currentFileId = null;
let sidebarCollapsed = false;
let rawMode = false;
const STORAGE_KEY = 'markdownViewerDocs';
const renderCache = new Map(); // fileId -> sanitized HTML string

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
            '--font-family': computedStyle.getPropertyValue('---font-family').trim(),
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
            modified: new Date().toISOString()
        });
        this.saveFiles();
        this.renderFileList();
        return fileId;
    }

    static removeFile(fileId) {
        files.delete(fileId);
        if (currentFileId === fileId) {
            currentFileId = null;
            this.showWelcomeScreen();
        }
        this.saveFiles();
        this.renderFileList();
    }

    static getFile(fileId) {
        return files.get(fileId);
    }

    static saveFiles() {
        try {
            const fileArray = Array.from(files.values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fileArray));
        } catch (err) {
            console.error('Error saving files to localStorage:', err);
        }
    }

    static loadFiles() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            this.renderFileList();
            return;
        }
        try {
            const fileArray = JSON.parse(saved);
            files = new Map();
            fileArray.forEach(f => {
                const id = f.id || this.generateId();
                files.set(id, {
                    id,
                    name: f.name || 'Untitled.md',
                    content: typeof f.content === 'string' ? f.content : '',
                    modified: f.modified || new Date().toISOString()
                });
            });
            this.renderFileList();
        } catch (err) {
            console.error('Error loading files from localStorage:', err);
            this.renderFileList();
        }
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

    static buildCollapsibleSections(mdEl) {
        if (!this.collapseState) this.collapseState = new Map();
        const state = this.collapseState.get(currentFileId) || {};

        const children = Array.from(mdEl.children);
        const sections = [];
        const stack = []; // {section, level, body}

        children.forEach(node => {
            const isHeading = node.tagName && /^H[1-6]$/.test(node.tagName);
            if (isHeading) {
                const level = parseInt(node.tagName.substring(1), 10);
                const section = document.createElement('div');
                section.className = 'md-section';

                const headingEl = node; // original heading
                const icon = document.createElement('span');
                icon.className = 'md-toggle-icon';
                const iconInner = document.createElement('i');
                iconInner.className = 'fas fa-chevron-right';
                if (!state[headingEl.id]) {
                    // expanded -> hide chevron
                    icon.classList.add('hidden');
                }
                icon.appendChild(iconInner);
                headingEl.classList.add('md-heading');
                headingEl.prepend(icon);

                // Insert section before heading, then move heading into section
                mdEl.insertBefore(section, headingEl);
                section.appendChild(headingEl);

                // Create animated body wrapper
                const body = document.createElement('div');
                body.className = 'md-section-body';
                section.appendChild(body);

                // Manage hierarchy: nest within parent section if exists
                while (stack.length && stack[stack.length - 1].level >= level) {
                    stack.pop();
                }
                const parentEntry = stack.length ? stack[stack.length - 1] : null;
                if (parentEntry) {
                    parentEntry.body.appendChild(section);
                }

                sections.push({ section, headingId: headingEl.id, level, body });
                stack.push({ section, level, body });
            } else {
                // Append non-heading content to the current top section
                if (stack.length) {
                    const top = stack[stack.length - 1];
                    top.body.appendChild(node);
                }
            }
        });

        // Measure bodies initially to capture natural heights
        sections.forEach(({ body }) => {
            body.style.maxHeight = body.scrollHeight + 'px';
        });

        // Apply collapsed state and attach listeners
        sections.forEach(({ section, headingId, body }) => {
            const collapsed = !!state[headingId];
            const heading = section.querySelector('.md-heading');
            const iconWrap = heading.querySelector('.md-toggle-icon');
            const icon = heading.querySelector('.md-toggle-icon i');

            // Initialize chevron visibility
            if (collapsed) {
                section.classList.add('collapsed');
                if (iconWrap) iconWrap.classList.remove('hidden');
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                }
            } else {
                if (iconWrap) iconWrap.classList.add('hidden');
                if (icon) {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                }
            }

            const remeasure = (rootSection) => {
                const bodies = rootSection.querySelectorAll('.md-section-body');
                bodies.forEach(b => {
                    b.style.maxHeight = 'none';
                    const h = b.scrollHeight;
                    b.style.maxHeight = h + 'px';
                });
            };

            heading.addEventListener('click', () => {
                const nowCollapsed = !section.classList.contains('collapsed');
                // Update state first
                const curState = this.collapseState.get(currentFileId) || {};
                curState[headingId] = nowCollapsed;
                this.collapseState.set(currentFileId, curState);

                if (nowCollapsed) {
                    // Collapse: set class and chevron, animate to 0
                    section.classList.add('collapsed');
                    if (iconWrap) iconWrap.classList.remove('hidden');
                    if (icon) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-right');
                    }
                    // Animate collapse
                    const bodyEl = section.querySelector('.md-section-body');
                    if (bodyEl) {
                        // set to current height then 0 to animate
                        bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px';
                        requestAnimationFrame(() => {
                            bodyEl.style.maxHeight = '0px';
                        });
                    }
                } else {
                    // Expand
                    const level = parseInt(heading.tagName.substring(1), 10);
                    if (currentFileId && renderCache.has(currentFileId) && level === 1) {
                        // Rebuild from cache, then animate the same heading's section
                        FileManager.rebuildFromCache();
                        const newHeading = document.getElementById(headingId);
                        const newSection = newHeading ? newHeading.closest('.md-section') : null;
                        const newIconWrap = newHeading ? newHeading.querySelector('.md-toggle-icon') : null;
                        const newIcon = newHeading ? newHeading.querySelector('.md-toggle-icon i') : null;
                        if (newSection) {
                            newSection.classList.remove('collapsed');
                            const bodyEl = newSection.querySelector('.md-section-body');
                            if (newIconWrap) newIconWrap.classList.add('hidden');
                            if (newIcon) {
                                newIcon.classList.remove('fa-chevron-right');
                                newIcon.classList.add('fa-chevron-down');
                            }
                            if (bodyEl) {
                                // start at 0 then animate to full height
                                bodyEl.style.maxHeight = '0px';
                                requestAnimationFrame(() => {
                                    bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px';
                                });
                            }
                        }
                    } else {
                        // Non-H1: animate existing section
                        section.classList.remove('collapsed');
                        if (iconWrap) iconWrap.classList.add('hidden');
                        if (icon) {
                            icon.classList.remove('fa-chevron-right');
                            icon.classList.add('fa-chevron-down');
                        }
                        const bodyEl = section.querySelector('.md-section-body');
                        if (bodyEl) {
                            bodyEl.style.maxHeight = '0px';
                            requestAnimationFrame(() => {
                                bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px';
                            });
                        } else {
                            requestAnimationFrame(() => remeasure(section));
                        }
                    }
                }
            });
        });
    }

    static showRenderedContent(content) {
        const mdEl = document.getElementById('markdown-content');
        const rawEl = document.getElementById('raw-content');
        const tocEl = document.getElementById('toc');
        mdEl.style.display = 'block';
        rawEl.style.display = 'none';
        if (tocEl) tocEl.style.display = 'block';
        
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
        mdEl.innerHTML = sanitizedHtml;
        if (currentFileId) {
            renderCache.set(currentFileId, sanitizedHtml);
        }

        const headings = mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const usedIds = new Set();
        headings.forEach(h => {
            let base = (h.id || h.textContent || '').toLowerCase().trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-');
            if (!base) base = 'section';
            let id = base;
            let i = 1;
            while (usedIds.has(id)) {
                id = `${base}-${i++}`;
            }
            h.id = id;
            usedIds.add(id);
        });

        // Apply syntax highlighting and enhance code blocks FIRST (before measuring heights)
        mdEl.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
            
            // Get language from class
            const languageClass = Array.from(block.classList).find(cls => cls.startsWith('language-'));
            const language = languageClass ? languageClass.replace('language-', '') : 'text';
            
            // Wrap code block with header
            const pre = block.parentElement;
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            
            // Create header with language and copy button
            const header = document.createElement('div');
            header.className = 'code-block-header';
            
            const langLabel = document.createElement('span');
            langLabel.className = 'code-language';
            langLabel.textContent = language.toUpperCase();
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'code-copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            copyBtn.title = 'Copy to clipboard';
            
            // Copy functionality
            copyBtn.addEventListener('click', () => {
                const code = block.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                });
            });
            
            header.appendChild(langLabel);
            header.appendChild(copyBtn);
            
            // Insert wrapper before pre, then move pre into wrapper
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });

        this.buildCollapsibleSections(mdEl);
        mdEl.querySelectorAll('.md-section-body').forEach(b => {
            b.style.maxHeight = b.scrollHeight + 'px';
        });

        if (tocEl) {
            const items = Array.from(mdEl.querySelectorAll('.md-heading')).map(h => {
                const level = parseInt(h.tagName.substring(1), 10);
                return { id: h.id, text: h.textContent.replace(/^\s*▶\s*/,'').replace(/^\s*▼\s*/,''), level };
            });
            if (items.length === 0) {
                tocEl.innerHTML = '';
            } else {
                const tocHtml = `
                    <h4>Contents</h4>
                    <ul>
                        ${items.map(it => `
                            <li class="indent-${Math.min(5, Math.max(0, it.level - 1))}">
                                <a href="#${it.id}" data-target="${it.id}">${it.text}</a>
                            </li>
                        `).join('')}
                    </ul>
                `;
                tocEl.innerHTML = tocHtml;

                tocEl.querySelectorAll('a').forEach(a => {
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetId = a.getAttribute('data-target');
                        const el = document.getElementById(targetId);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    });
                });

                this.setupScrollSpy(headings, tocEl);
            }
        }
    }

    static rebuildFromCache() {
        if (!currentFileId) return;
        const mdEl = document.getElementById('markdown-content');
        const tocEl = document.getElementById('toc');
        const cached = renderCache.get(currentFileId);
        if (!cached) return;

        mdEl.innerHTML = cached;

        const headings = mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const usedIds = new Set();
        headings.forEach(h => {
            let base = (h.id || h.textContent || '').toLowerCase().trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-');
            if (!base) base = 'section';
            let id = base;
            let i = 1;
            while (usedIds.has(id)) {
                id = `${base}-${i++}`;
            }
            h.id = id;
            usedIds.add(id);
        });

        // Apply syntax highlighting and enhance code blocks FIRST (before measuring heights)
        mdEl.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
            
            // Get language from class
            const languageClass = Array.from(block.classList).find(cls => cls.startsWith('language-'));
            const language = languageClass ? languageClass.replace('language-', '') : 'text';
            
            // Wrap code block with header
            const pre = block.parentElement;
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            
            // Create header with language and copy button
            const header = document.createElement('div');
            header.className = 'code-block-header';
            
            const langLabel = document.createElement('span');
            langLabel.className = 'code-language';
            langLabel.textContent = language.toUpperCase();
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'code-copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            copyBtn.title = 'Copy to clipboard';
            
            // Copy functionality
            copyBtn.addEventListener('click', () => {
                const code = block.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                });
            });
            
            header.appendChild(langLabel);
            header.appendChild(copyBtn);
            
            // Insert wrapper before pre, then move pre into wrapper
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });

        this.buildCollapsibleSections(mdEl);
        mdEl.querySelectorAll('.md-section-body').forEach(b => {
            b.style.maxHeight = b.scrollHeight + 'px';
        });

        if (tocEl) {
            const items = Array.from(mdEl.querySelectorAll('.md-heading')).map(h => {
                const level = parseInt(h.tagName.substring(1), 10);
                return { id: h.id, text: h.textContent, level };
            });
            const tocHtml = items.length ? `
                <h4>Contents</h4>
                <ul>
                    ${items.map(it => `
                        <li class="indent-${Math.min(5, Math.max(0, it.level - 1))}">
                            <a href="#${it.id}" data-target="${it.id}">${it.text}</a>
                        </li>
                    `).join('')}
                </ul>
            ` : '';
            tocEl.innerHTML = tocHtml;
            tocEl.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = a.getAttribute('data-target');
                    const el = document.getElementById(targetId);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }
    }

    static setupScrollSpy(headingsNodeList, tocEl) {
        const links = Array.from(tocEl.querySelectorAll('a'));
        const linkById = new Map(links.map(l => [l.dataset.target, l]));

        function setActive(id) {
            links.forEach(l => l.classList.toggle('active', l.dataset.target === id));
        }

        const observer = new IntersectionObserver((entries) => {
            let currentId = null;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    currentId = entry.target.id;
                }
            });
            if (currentId && linkById.has(currentId)) {
                setActive(currentId);
            }
        }, {
            root: document.querySelector('.markdown-content'),
            rootMargin: '0px 0px -70% 0px',
            threshold: 0.01
        });

        Array.from(headingsNodeList).forEach(h => observer.observe(h));

        const first = headingsNodeList[0];
        if (first && linkById.has(first.id)) setActive(first.id);
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
    const mainContent = document.querySelector('.main-content');
    const headerToggleBtn = document.getElementById('sidebar-toggle-header');
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
        if (headerToggleBtn) headerToggleBtn.classList.add('show');
    } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('sidebar-collapsed');
        if (headerToggleBtn) headerToggleBtn.classList.remove('show');
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

// Auto-detect title from markdown content
function autoDetectTitle(content) {
    if (!content || !content.trim()) {
        return 'Untitled.md';
    }
    
    const lines = content.trim().split('\n');
    
    // Strategy 1: Look for first H1 heading
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match && h1Match[1]) {
        return sanitizeFilename(h1Match[1].trim()) + '.md';
    }
    
    // Strategy 2: Look for first H2 heading
    const h2Match = content.match(/^##\s+(.+)$/m);
    if (h2Match && h2Match[1]) {
        return sanitizeFilename(h2Match[1].trim()) + '.md';
    }
    
    // Strategy 3: Use first non-empty line if it's reasonably short
    const firstLine = lines.find(line => line.trim().length > 0);
    if (firstLine && firstLine.trim().length <= 60) {
        // Remove markdown formatting from first line
        const cleaned = firstLine.trim()
            .replace(/^#+\s*/, '')  // Remove heading markers
            .replace(/[*_~`]/g, '') // Remove emphasis markers
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Remove links, keep text
        
        if (cleaned.length > 0 && cleaned.length <= 60) {
            return sanitizeFilename(cleaned) + '.md';
        }
    }
    
    // Strategy 4: Take first few words
    const words = content.trim()
        .replace(/^#+\s*/, '')  // Remove heading markers
        .replace(/[*_~`#]/g, '') // Remove markdown syntax
        .split(/\s+/)
        .filter(w => w.length > 0)
        .slice(0, 5)
        .join(' ');
    
    if (words) {
        return sanitizeFilename(words) + '.md';
    }
    
    return 'Untitled.md';
}

function sanitizeFilename(name) {
    return name
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid filename chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Collapse multiple hyphens
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 100) // Limit length
        || 'untitled';
}

function addPastedContent() {
    const nameInput = document.getElementById('file-name-input');
    const contentInput = document.getElementById('markdown-input');
    
    const manualName = nameInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!content) {
        alert('Please enter some markdown content');
        return;
    }

    // Auto-detect title if no manual name provided
    const name = manualName || autoDetectTitle(content);
    
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

    // Load files from localStorage
    FileManager.loadFiles();

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
    document.getElementById('sidebar-toggle-header').addEventListener('click', toggleSidebar);
    document.getElementById('theme-toggle').addEventListener('click', toggleThemePanel);
    document.getElementById('close-theme-panel').addEventListener('click', closeThemePanel);

    document.getElementById('export-html-btn').addEventListener('click', FileManager.exportCurrentFileAsHtml);
    document.getElementById('toggle-raw-btn').addEventListener('click', toggleRawMode);

    document.getElementById('overlay').addEventListener('click', closeThemePanel);

    document.getElementById('paste-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closePasteModal();
        }
    });

    // Auto-fill filename when markdown content is pasted/typed
    document.getElementById('markdown-input').addEventListener('input', function(e) {
        const nameInput = document.getElementById('file-name-input');
        const content = e.target.value;
        
        // Only auto-fill if the name field is empty
        if (!nameInput.value.trim() && content.trim()) {
            const detectedTitle = autoDetectTitle(content);
            nameInput.value = detectedTitle;
        }
    });

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

    if (window.innerWidth <= 768) {
        sidebarCollapsed = true;
        document.getElementById('sidebar').classList.add('collapsed');
    }

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

// Pagination System
class PaginationManager {
    constructor() {
        this.pages = [];
        this.currentPageIndex = 0;
        this.paginationActive = false;
        this.pageHeight = 0;
    }

    toggle() {
        this.paginationActive = !this.paginationActive;
        const btn = document.getElementById('toggle-pagination-btn');
        const contentBody = document.querySelector('.content-body');
        const pageNav = document.getElementById('page-navigation');
        const markdownContent = document.getElementById('markdown-content');
        const toc = document.getElementById('toc');

        if (this.paginationActive) {
            // Reset to first page
            this.currentPageIndex = 0;
            
            // First create pages while content is still visible
            this.createPages();
            
            // Then update UI
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-scroll"></i> Scroll';
            contentBody.classList.add('paginated');
            pageNav.classList.add('active');
            markdownContent.style.display = 'none';
            if (toc) toc.style.display = 'none';
            
            this.renderPages();
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-book-open"></i> Pages';
            contentBody.classList.remove('paginated');
            pageNav.classList.remove('active');
            markdownContent.style.display = 'block';
            if (toc) toc.style.display = 'block';
        }
    }

    createPages() {
        const markdownContent = document.getElementById('markdown-content');
        if (!markdownContent) {
            console.error('Markdown content not found');
            return;
        }

        // Calculate available height from CSS
        // The page container has: height: calc(100vh - 200px)
        const viewportHeight = window.innerHeight;
        const availableHeight = (viewportHeight - 200) * 1.0; // Use full height, let overflow handle it
        
        console.log(`Available page height: ${availableHeight}px`);

        // Get all content - handle both regular and collapsible section structures
        let children = [];
        
        // Check if we have collapsible sections
        const sections = markdownContent.querySelectorAll('.md-section');
        if (sections.length > 0) {
            // We have collapsible sections - extract the actual content
            console.log('Found collapsible sections, extracting content');
            
            // Get all headings and their bodies
            sections.forEach(section => {
                const heading = section.querySelector('.md-heading');
                const body = section.querySelector('.md-section-body');
                
                if (heading) {
                    // Clone heading without the toggle icon
                    const headingClone = heading.cloneNode(true);
                    const toggleIcon = headingClone.querySelector('.md-toggle-icon');
                    if (toggleIcon) toggleIcon.remove();
                    children.push(headingClone);
                }
                
                if (body) {
                    // Get all children from the body
                    Array.from(body.children).forEach(child => {
                        if (!child.classList.contains('md-section')) {
                            children.push(child.cloneNode(true));
                        }
                    });
                }
            });
        } else {
            // No collapsible sections - use direct children
            children = Array.from(markdownContent.children).map(child => child.cloneNode(true));
        }
        
        if (children.length === 0) {
            console.error('No content to paginate');
            // Fallback: just clone the entire content
            const pageDiv = document.createElement('div');
            pageDiv.className = 'markdown-content';
            pageDiv.innerHTML = markdownContent.innerHTML;
            this.pages = [pageDiv];
            console.log('Created 1 page with all content as fallback');
            return;
        }

        console.log(`Creating pages from ${children.length} elements`);

        // Create a temporary container for measuring heights
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '800px'; // Match the page width
        tempContainer.style.padding = '3rem 2rem'; // Match page container padding
        document.body.appendChild(tempContainer);

        this.pages = [];
        let currentPage = document.createElement('div');
        currentPage.className = 'markdown-content';

        children.forEach((child, index) => {
            // Test adding this child to see if it fits
            const testContent = currentPage.cloneNode(true);
            testContent.appendChild(child.cloneNode(true));
            
            // Measure the content
            tempContainer.innerHTML = '';
            tempContainer.appendChild(testContent);
            
            const newHeight = tempContainer.scrollHeight;
            
            // Only create a new page if:
            // 1. We already have content on the current page
            // 2. Adding this would significantly exceed available height (by more than 10%)
            // 3. The element itself isn't already too tall (if it is, we have to include it anyway)
            
            // Measure just this element alone
            tempContainer.innerHTML = '';
            const singleElementDiv = document.createElement('div');
            singleElementDiv.className = 'markdown-content';
            singleElementDiv.appendChild(child.cloneNode(true));
            tempContainer.appendChild(singleElementDiv);
            const elementHeight = tempContainer.scrollHeight;
            
            const wouldExceedSignificantly = newHeight > availableHeight * 1.1;
            const elementFitsAlone = elementHeight <= availableHeight * 1.1;
            
            if (wouldExceedSignificantly && currentPage.children.length > 0 && elementFitsAlone) {
                // Save current page and start a new one
                this.pages.push(currentPage);
                console.log(`Page ${this.pages.length} created with ${currentPage.children.length} elements (${newHeight}px would exceed ${availableHeight}px)`);
                
                currentPage = document.createElement('div');
                currentPage.className = 'markdown-content';
                currentPage.appendChild(child);
            } else {
                // Add to current page (even if it overflows a bit)
                currentPage.appendChild(child);
            }
        });

        // Add the last page if it has content
        if (currentPage.children.length > 0) {
            this.pages.push(currentPage);
            console.log(`Final page ${this.pages.length} created with ${currentPage.children.length} elements`);
        }

        // Clean up temp container
        document.body.removeChild(tempContainer);

        console.log(`Created ${this.pages.length} pages with smart pagination`);
    }

    renderPages() {
        const leftPage = document.getElementById('left-page');
        const rightPage = document.getElementById('right-page');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');

        if (!leftPage || !rightPage) {
            console.error('Page containers not found');
            return;
        }

        // Clear existing content
        leftPage.innerHTML = '';
        rightPage.innerHTML = '';
        leftPage.classList.remove('visible', 'single');
        rightPage.classList.remove('visible', 'single');

        const totalPages = this.pages.length;
        console.log(`Rendering pages: current=${this.currentPageIndex}, total=${totalPages}`);
        
        if (totalPages === 0) {
            console.error('No pages to render');
            return;
        }

        // Determine which pages to show
        if (totalPages === 1) {
            // Single page - show centered
            console.log('Showing single page');
            const content = this.pages[0].cloneNode(true);
            leftPage.appendChild(content);
            leftPage.classList.add('visible', 'single');
            console.log('Left page HTML length:', leftPage.innerHTML.length);
            console.log('Left page classes:', leftPage.className);
        } else if (this.currentPageIndex === 0) {
            // First page only (show centered)
            console.log('Showing first page centered');
            const content = this.pages[0].cloneNode(true);
            leftPage.appendChild(content);
            leftPage.classList.add('visible', 'single');
            console.log('Left page HTML length:', leftPage.innerHTML.length);
            console.log('Left page classes:', leftPage.className);
        } else {
            // Show two pages
            const leftPageIndex = this.currentPageIndex;
            const rightPageIndex = this.currentPageIndex + 1;
            console.log(`Showing pages ${leftPageIndex} and ${rightPageIndex}`);

            if (leftPageIndex < totalPages) {
                const leftContent = this.pages[leftPageIndex].cloneNode(true);
                leftPage.appendChild(leftContent);
                leftPage.classList.add('visible');
                console.log('Left page added, HTML length:', leftPage.innerHTML.length);
            }

            if (rightPageIndex < totalPages) {
                const rightContent = this.pages[rightPageIndex].cloneNode(true);
                rightPage.appendChild(rightContent);
                rightPage.classList.add('visible');
                console.log('Right page added, HTML length:', rightPage.innerHTML.length);
            }
        }

        // Update button states
        prevBtn.disabled = this.currentPageIndex === 0;
        nextBtn.disabled = this.currentPageIndex >= totalPages - 2 && totalPages > 1 || 
                          (totalPages === 1 && this.currentPageIndex >= 0);

        console.log(`Button states - prev: ${prevBtn.disabled}, next: ${nextBtn.disabled}`);

        // Re-apply syntax highlighting to the pages
        leftPage.querySelectorAll('pre code').forEach(block => {
            if (window.hljs) hljs.highlightElement(block);
        });
        rightPage.querySelectorAll('pre code').forEach(block => {
            if (window.hljs) hljs.highlightElement(block);
        });
        
        console.log('Render complete');
    }

    nextPage() {
        const totalPages = this.pages.length;
        
        if (totalPages === 1) {
            return; // Can't go next if only one page
        }
        
        if (this.currentPageIndex === 0) {
            // From first page, go to pages 1-2 (indices 1 and 2)
            this.currentPageIndex = 1;
        } else {
            // From any other position, advance by 2
            this.currentPageIndex += 2;
        }
        
        // Don't go beyond the last page
        if (this.currentPageIndex >= totalPages) {
            this.currentPageIndex = Math.max(1, totalPages - 2);
        }
        
        this.renderPages();
    }

    prevPage() {
        if (this.currentPageIndex === 1) {
            // Go back to first page only
            this.currentPageIndex = 0;
        } else {
            // Go back by 2 pages
            this.currentPageIndex = Math.max(0, this.currentPageIndex - 2);
        }
        
        this.renderPages();
    }
}

// Initialize pagination manager
const paginationManager = new PaginationManager();

// Add event listeners for pagination
document.addEventListener('DOMContentLoaded', function() {
    const togglePaginationBtn = document.getElementById('toggle-pagination-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');

    if (togglePaginationBtn) {
        togglePaginationBtn.addEventListener('click', () => {
            paginationManager.toggle();
        });
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            paginationManager.prevPage();
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            paginationManager.nextPage();
        });
    }

    // Keyboard navigation for pages
    document.addEventListener('keydown', (e) => {
        if (paginationManager.paginationActive) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                paginationManager.prevPage();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                paginationManager.nextPage();
            }
        }
    });
});