/**
 * Theme Loader - Loads theme before page renders
 * This script must run inline in <head> to prevent flash of unstyled content
 */
(function() {
    const savedPreset = localStorage.getItem('markdownViewerThemePreset');
    const savedTheme = localStorage.getItem('markdownViewerTheme');

    // Kept in sync with ThemeManager.presets (only the variables needed before first paint).
    function getPresets() {
        const presets = {
            default: {
                '--primary-color': '#5f63ee',
                '--primary-hover': '#5b5ff1',
                '--bg-color': '#0f172a',
                '--surface-color': '#1e293b',
                '--surface-hover': '#334155',
                '--text-color': '#f8fafc',
                '--text-muted': '#94a3b8',
                '--text-dim': '#64748b',
                '--accent-color': '#06b6d4',
                '--border-color': '#334155',
                '--code-color': '#e5c07b',
                '--success-color': '#10b981',
                '--warning-color': '#f59e0b',
                '--error-color': '#ef4444'
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
                '--border-color': '#374151',
                '--code-color': '#e5c07b',
                '--success-color': '#10b981',
                '--warning-color': '#f59e0b',
                '--error-color': '#ef4444'
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
                '--border-color': '#d1d5db',
                '--code-color': '#c7254e',
                '--success-color': '#10b981',
                '--warning-color': '#f59e0b',
                '--error-color': '#ef4444',
                '--selection-bg': '#fef08a',
                '--selection-color': '#1f2937'
            },
            ocean: {
                '--primary-color': '#14b8a6',
                '--primary-hover': '#0d9488',
                '--bg-color': '#0c1c2c',
                '--surface-color': '#1a2f3f',
                '--surface-hover': '#284557',
                '--text-color': '#f0fdfa',
                '--text-muted': '#99f6e4',
                '--text-dim': '#5eead4',
                '--accent-color': '#06b6d4',
                '--border-color': '#1e3a4c',
                '--code-color': '#5eead4',
                '--success-color': '#10b981',
                '--warning-color': '#fbbf24',
                '--error-color': '#ef4444'
            },
            sunset: {
                '--primary-color': '#f97316',
                '--primary-hover': '#ea580c',
                '--bg-color': '#1a1625',
                '--surface-color': '#2d2438',
                '--surface-hover': '#3d2f4d',
                '--text-color': '#fef3f2',
                '--text-muted': '#fda4af',
                '--text-dim': '#fb923c',
                '--accent-color': '#f472b6',
                '--border-color': '#3d2842',
                '--code-color': '#fbbf24',
                '--success-color': '#10b981',
                '--warning-color': '#fbbf24',
                '--error-color': '#fb7185'
            },
            forest: {
                '--primary-color': '#22c55e',
                '--primary-hover': '#16a34a',
                '--bg-color': '#0f1a14',
                '--surface-color': '#1a2820',
                '--surface-hover': '#243a2d',
                '--text-color': '#f0fdf4',
                '--text-muted': '#86efac',
                '--text-dim': '#4ade80',
                '--accent-color': '#84cc16',
                '--border-color': '#1e3a28',
                '--code-color': '#a3e635',
                '--success-color': '#22c55e',
                '--warning-color': '#fbbf24',
                '--error-color': '#ef4444'
            },
            blueOrange: {
                '--primary-color': '#3b82f6',
                '--primary-hover': '#2563eb',
                '--bg-color': '#0a1929',
                '--surface-color': '#1e3a5f',
                '--surface-hover': '#2d4a70',
                '--text-color': '#f1f5f9',
                '--text-muted': '#94a3b8',
                '--text-dim': '#64748b',
                '--accent-color': '#fb923c',
                '--border-color': '#1e40af',
                '--code-color': '#60a5fa',
                '--success-color': '#10b981',
                '--warning-color': '#fb923c',
                '--error-color': '#ef4444'
            },
            bluePink: {
                '--primary-color': '#60a5fa',
                '--primary-hover': '#3b82f6',
                '--bg-color': '#ffffff',
                '--surface-color': '#fce7f3',
                '--surface-hover': '#fbcfe8',
                '--text-color': '#1e293b',
                '--text-muted': '#64748b',
                '--text-dim': '#94a3b8',
                '--accent-color': '#ec4899',
                '--border-color': '#e0e7ff',
                '--code-color': '#0ea5e9',
                '--success-color': '#10b981',
                '--warning-color': '#f59e0b',
                '--error-color': '#ef4444'
            }
        };
        return presets;
    }

    const presets = getPresets();
    const root = document.documentElement;
    const apply = (vars) => Object.keys(vars).forEach(key => root.style.setProperty(key, vars[key]));

    // No saved preset means the default (dark) preset, same as ThemeManager.
    const presetName = presets[savedPreset] ? savedPreset : 'default';
    apply(presets[presetName]);

    // A custom theme is saved as overrides on top of its preset.
    if (savedTheme) {
        try {
            apply(JSON.parse(savedTheme));
        } catch (e) {
            console.error('Error applying custom theme:', e);
        }
    }

    // Colors derived from the theme so text stays readable at the WCAG 4.5:1
    // contrast minimum. ThemeManager reuses these via window.mdThemeColors
    // whenever a preset or a custom color changes.
    const themeColors = {
        parse(color) {
            const value = (color || '').trim();
            const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
            if (hex) {
                const h = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1];
                return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
            }
            const rgb = value.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
            return rgb ? rgb.slice(1, 4).map(Number) : null;
        },
        luminance(rgb) {
            return rgb
                .map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
                .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
        },
        contrast(a, b) {
            const x = this.luminance(a), y = this.luminance(b);
            return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
        },
        toHex(rgb) {
            return '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
        },
        // Filled controls with text (buttons, filter toggles): white text when the theme
        // color needs at most a slight darkening (15%) for white to pass,
        // otherwise near-black text. Their gradient always shades toward more
        // contrast for that text: darker behind white, lighter behind dark.
        buttonColors(primary) {
            const white = [255, 255, 255], black = [0, 0, 0], dark = [15, 23, 42];
            const p = this.parse(primary);
            if (!p) return { fill: primary, end: primary, text: '#ffffff' };
            const shade = (rgb, t, toward) => rgb.map((v, i) => v + (toward[i] - v) * t);
            let t = 0;
            while (this.contrast(white, shade(p, t, black)) < 4.5 && t < 1) t = Math.min(1, t + 0.02);
            if (t <= 0.15 || this.contrast(dark, p) < 4.5) {
                const fill = shade(p, t, black);
                return { fill: this.toHex(fill), end: this.toHex(shade(fill, 0.1, black)), text: '#ffffff' };
            }
            return { fill: this.toHex(p), end: this.toHex(shade(p, 0.12, white)), text: '#0f172a' };
        },
        // The accent itself when it reads at 4.5:1 on both the page and the
        // panels; otherwise mixed toward white (dark themes) or black (light
        // themes) only as far as needed
        readableAccent(accent, bg, surface) {
            const a = this.parse(accent), b = this.parse(bg), s = this.parse(surface);
            if (!a || !b || !s) return accent;
            const toward = this.contrast(b, [255, 255, 255]) > this.contrast(b, [0, 0, 0]) ? [255, 255, 255] : [0, 0, 0];
            for (let step = 0; step <= 50; step++) {
                const t = step / 50;
                const mixed = a.map((v, i) => v + (toward[i] - v) * t);
                if (this.contrast(mixed, b) >= 4.5 && this.contrast(mixed, s) >= 4.5) return this.toHex(mixed);
            }
            return this.toHex(toward);
        },
        applyDerived(el) {
            const style = getComputedStyle(el);
            const get = name => style.getPropertyValue(name).trim();
            const primary = get('--primary-color');
            const button = this.buttonColors(primary);
            el.style.setProperty('--button-fill', button.fill);
            el.style.setProperty('--button-fill-end', button.end);
            el.style.setProperty('--on-primary', button.text);
            el.style.setProperty('--primary-text', this.readableAccent(primary, get('--bg-color'), get('--surface-color')));
        }
    };
    window.mdThemeColors = themeColors;
    themeColors.applyDerived(root);

    const favicon = document.querySelector('link#dynamic-favicon');
    if (favicon) {
        favicon.href = presetName === 'light' ? 'favicon-light.svg' : presetName === 'dark' ? 'favicon-dark.svg' : 'favicon.svg';
    }

    // Match highlight.js to the preset's light/dark family (keep in sync with ThemeManager.updateHighlightTheme).
    const lightPresets = ['light', 'bluePink'];
    const highlightLink = document.getElementById('highlight-theme');
    if (highlightLink) {
        const hlTheme = lightPresets.includes(presetName) ? 'github' : 'github-dark';
        highlightLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/' + hlTheme + '.min.css';
    }
})();
