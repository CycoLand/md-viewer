// Settings Manager
// Handles user preferences and settings

import { state, SETTINGS_KEY } from './state.js';
import { getProgressBar } from './progressBar.js';

export class SettingsManager {
    constructor() {
        this.settingsPanel = document.getElementById('settings-panel');
        this.settingsToggle = document.getElementById('settings-toggle');
        this.closeSettingsBtn = document.getElementById('close-settings-panel');
        this.quickMenu = document.getElementById('settings-quick-menu');
        this.openFullPanelBtn = document.getElementById('open-full-settings-panel');
        
        // Setting toggles (full panel)
        this.progressBarToggle = document.getElementById('toggle-progress-bar');
        this.tocToggle = document.getElementById('toggle-toc');
        
        // Quick toggles
        this.quickProgressBarToggle = document.getElementById('quick-toggle-progress-bar');
        this.quickTocToggle = document.getElementById('quick-toggle-toc');
        
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
        
        // Initialize quick menu
        this.initializeQuickMenu();
    }
    
    /**
     * Initialize quick menu
     */
    initializeQuickMenu() {
        // Toggle quick menu on settings button click
        this.settingsToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.quickMenu?.classList.toggle('show');
            
            // Close theme quick menu if open
            const themeQuickMenu = document.getElementById('theme-quick-menu');
            themeQuickMenu?.classList.remove('show');
        });
        
        // Quick toggle handlers
        this.quickProgressBarToggle?.addEventListener('change', (e) => {
            state.settings.showProgressBar = e.target.checked;
            // Sync with full panel toggle
            if (this.progressBarToggle) {
                this.progressBarToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyProgressBarSetting();
        });
        
        this.quickTocToggle?.addEventListener('change', (e) => {
            state.settings.showTOC = e.target.checked;
            // Sync with full panel toggle
            if (this.tocToggle) {
                this.tocToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyTOCSetting();
        });
        
        // Open full settings panel
        this.openFullPanelBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.quickMenu?.classList.remove('show');
            this.openPanel();
        });
        
        // Close quick menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.settingsToggle?.contains(e.target) && !this.quickMenu?.contains(e.target)) {
                this.quickMenu?.classList.remove('show');
            }
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Panel close button
        this.closeSettingsBtn?.addEventListener('click', () => this.closePanel());
        
        // Full panel setting toggles
        this.progressBarToggle?.addEventListener('change', (e) => {
            state.settings.showProgressBar = e.target.checked;
            // Sync with quick toggle
            if (this.quickProgressBarToggle) {
                this.quickProgressBarToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyProgressBarSetting();
        });
        
        this.tocToggle?.addEventListener('change', (e) => {
            state.settings.showTOC = e.target.checked;
            // Sync with quick toggle
            if (this.quickTocToggle) {
                this.quickTocToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyTOCSetting();
        });
    }
    
    /**
     * Open settings panel
     */
    openPanel() {
        this.settingsPanel?.classList.add('open');
        
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
        
        // Update all toggle states
        if (this.progressBarToggle) {
            this.progressBarToggle.checked = state.settings.showProgressBar;
        }
        if (this.tocToggle) {
            this.tocToggle.checked = state.settings.showTOC;
        }
        if (this.quickProgressBarToggle) {
            this.quickProgressBarToggle.checked = state.settings.showProgressBar;
        }
        if (this.quickTocToggle) {
            this.quickTocToggle.checked = state.settings.showTOC;
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
