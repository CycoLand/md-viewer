// Theme management
export class ThemeManager {
    constructor() {
        this.presets = {
            default: {
                '--primary-color': '#6366f1',
                '--primary-hover': '#5b5ff1',
                '--bg-color': '#0f172a',
                '--surface-color': '#1e293b',
                '--surface-hover': '#334155',
                '--text-color': '#f8fafc',
                '--text-muted': '#94a3b8',
                '--text-dim': '#64748b',
                '--accent-color': '#06b6d4',
                '--border-color': '#334155'
            },
            dark: {
                '--primary-color': '#9ca3af',
                '--primary-hover': '#6b7280',
                '--bg-color': '#111827',
                '--surface-color': '#1f2937',
                '--surface-hover': '#374151',
                '--text-color': '#f9fafb',
                '--text-muted': '#9ca3af',
                '--text-dim': '#6b7280',
                '--accent-color': '#6b7280',
                '--border-color': '#374151'
            },
            light: {
                '--primary-color': '#3b82f6',
                '--primary-hover': '#2563eb',
                '--bg-color': '#ffffff',
                '--surface-color': '#f3f4f6',
                '--surface-hover': '#e5e7eb',
                '--text-color': '#1f2937',
                '--text-muted': '#6b7280',
                '--text-dim': '#9ca3af',
                '--accent-color': '#2563eb',
                '--border-color': '#d1d5db'
            }
        };
        
        this.loadTheme();
        this.initializeThemePanel();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('markdownViewerTheme');
        const savedPreset = localStorage.getItem('markdownViewerThemePreset');
        
        if (savedTheme) {
            try {
                const theme = JSON.parse(savedTheme);
                this.applyTheme(theme);
            } catch (error) {
                console.error('Error loading saved theme:', error);
            }
        }
        
        // Load the highlight.js theme based on saved preset
        if (savedPreset) {
            this.updateHighlightTheme(savedPreset);
            // Update active state on preset buttons after DOM is ready
            setTimeout(() => {
                document.querySelectorAll('.theme-preset-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.theme === savedPreset);
                });
            }, 0);
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
    
    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;
        
        this.applyTheme(preset);
        this.saveTheme();
        
        // Save the preset name
        localStorage.setItem('markdownViewerThemePreset', presetName);
        
        this.updateThemeInputs();
        
        // Update active state on preset buttons
        document.querySelectorAll('.theme-preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === presetName);
        });
        
        // Switch highlight.js theme based on the preset
        this.updateHighlightTheme(presetName);
        
        // Re-highlight all code blocks with the new theme
        this.rehighlightCode();
    }
    
    updateHighlightTheme(presetName) {
        const highlightLink = document.getElementById('highlight-theme');
        if (!highlightLink) return;
        
        // Use light theme for light preset, dark theme for others
        const themeName = presetName === 'light' ? 'github' : 'github-dark';
        highlightLink.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${themeName}.min.css`;
    }
    
    rehighlightCode() {
        // Wait a bit for the CSS to load, then re-highlight
        setTimeout(() => {
            document.querySelectorAll('pre code').forEach((block) => {
                if (window.hljs) {
                    hljs.highlightElement(block);
                }
            });
        }, 100);
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
        // Preset theme buttons
        document.querySelectorAll('.theme-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeName = btn.dataset.theme;
                this.applyPreset(themeName);
            });
        });
        
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
