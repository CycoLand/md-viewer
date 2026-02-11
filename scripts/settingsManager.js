// Settings Manager
// Handles user preferences and settings

import { state, SETTINGS_KEY } from './state.js';
import { getProgressBar } from './progressBar.js';

export class SettingsManager {
    constructor() {
        this.settingsPanel = document.getElementById('settings-panel');
        this.settingsToggle = document.getElementById('settings-toggle');
        this.closeSettingsBtn = document.getElementById('close-settings-panel');
        this.overlay = document.getElementById('overlay');
        
        // Setting toggles
        this.progressBarToggle = document.getElementById('toggle-progress-bar');
        this.tocToggle = document.getElementById('toggle-toc');
        
        this.init();
    }
    
    /**
     * Initialize settings manager
     */
    init() {
        // Load settings from localStorage
        this.loadSettings();
        
        // Apply initial settings
        this.applySettings();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Panel toggle
        this.settingsToggle?.addEventListener('click', () => this.openPanel());
        this.closeSettingsBtn?.addEventListener('click', () => this.closePanel());
        
        // Close on overlay click
        this.overlay?.addEventListener('click', () => {
            if (this.settingsPanel?.classList.contains('open')) {
                this.closePanel();
            }
        });
        
        // Setting toggles
        this.progressBarToggle?.addEventListener('change', (e) => {
            state.settings.showProgressBar = e.target.checked;
            this.saveSettings();
            this.applyProgressBarSetting();
        });
        
        this.tocToggle?.addEventListener('change', (e) => {
            state.settings.showTOC = e.target.checked;
            this.saveSettings();
            this.applyTOCSetting();
        });
    }
    
    /**
     * Open settings panel
     */
    openPanel() {
        this.settingsPanel?.classList.add('open');
        this.overlay?.classList.add('show');
        
        // Close theme panel if open
        const themePanel = document.getElementById('theme-panel');
        if (themePanel?.classList.contains('open')) {
            themePanel.classList.remove('open');
        }
    }
    
    /**
     * Close settings panel
     */
    closePanel() {
        this.settingsPanel?.classList.remove('open');
        this.overlay?.classList.remove('show');
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                const settings = JSON.parse(saved);
                // Merge saved settings with defaults
                state.settings = {
                    ...state.settings,
                    ...settings
                };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        
        // Update toggle states
        if (this.progressBarToggle) {
            this.progressBarToggle.checked = state.settings.showProgressBar;
        }
        if (this.tocToggle) {
            this.tocToggle.checked = state.settings.showTOC;
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    /**
     * Apply all settings
     */
    applySettings() {
        this.applyProgressBarSetting();
        this.applyTOCSetting();
    }
    
    /**
     * Apply progress bar setting
     */
    applyProgressBarSetting() {
        const progressBar = getProgressBar();
        
        if (!progressBar) return;
        
        if (state.settings.showProgressBar) {
            // Show progress bar if conditions are met
            progressBar.updateVisibility();
        } else {
            // Force hide progress bar immediately
            progressBar.hide();
        }
    }
    
    /**
     * Apply TOC setting
     */
    applyTOCSetting() {
        const toc = document.getElementById('toc');
        
        if (toc) {
            if (state.settings.showTOC) {
                toc.classList.remove('force-hidden');
            } else {
                toc.classList.add('force-hidden');
            }
        }
    }
}
