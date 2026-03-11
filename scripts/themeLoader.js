/**
 * Theme Loader - Loads theme before page renders
 * This script must run inline in <head> to prevent flash of unstyled content
 */
(function() {
    const savedPreset = localStorage.getItem('markdownViewerThemePreset');
    const savedTheme = localStorage.getItem('markdownViewerTheme');
    
    console.log('Inline script running - savedPreset:', savedPreset, 'savedTheme:', savedTheme);
    
    if (savedTheme) {
        try {
            const theme = JSON.parse(savedTheme);
            const root = document.documentElement;
            Object.keys(theme).forEach(key => {
                root.style.setProperty(key, theme[key]);
            });
            console.log('Applied custom theme from localStorage');
        } catch (e) {
            console.error('Error applying custom theme:', e);
        }
    } else if (savedPreset) {
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
        
        const preset = presets[savedPreset];
        if (preset) {
            const root = document.documentElement;
            Object.keys(preset).forEach(key => {
                root.style.setProperty(key, preset[key]);
            });
            console.log('Applied preset theme:', savedPreset);
        }
        var favicon = document.querySelector('link#dynamic-favicon');
        if (favicon) {
            favicon.href = savedPreset === 'light' ? 'favicon-light.svg' : savedPreset === 'dark' ? 'favicon-dark.svg' : 'favicon.svg';
        }
    }
    
    // Also update highlight.js theme
    if (savedPreset === 'light') {
        const highlightLink = document.getElementById('highlight-theme');
        console.log('Attempting to update highlight theme, element found:', !!highlightLink);
        if (highlightLink) {
            highlightLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
        }
    }
})();
