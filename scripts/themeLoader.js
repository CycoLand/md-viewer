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
