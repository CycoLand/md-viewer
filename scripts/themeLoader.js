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
                '--primary-color': '#6366f1',
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

    // Text on the primary color: white or near-black, whichever contrasts more
    // (same rule as ThemeManager.pickOnColor).
    const primary = getComputedStyle(root).getPropertyValue('--primary-color').trim();
    const hex = primary.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
        const lum = (rgb) => rgb
            .map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
            .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
        const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        const bg = lum([0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16)));
        root.style.setProperty('--on-primary', ratio(bg, 1) >= ratio(bg, lum([15, 23, 42])) ? '#ffffff' : '#0f172a');
    }

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
