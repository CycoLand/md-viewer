// Settings Manager
// Handles user preferences and settings

import { state, SETTINGS_KEY } from './state.js';
import { getProgressBar } from './progressBar.js';
import { getWaterProgressBar } from './waterProgressBar.js';
import { refreshRenderedView } from './markdownRenderer.js';
import {
    TYPOGRAPHY_DEFAULTS,
    applyTypography,
    syncThemeTypographyInputs,
    syncReadingTypographyInputs,
    parseCharactersPerLine,
    parseLineHeight
} from './typography.js';

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
        this.waterProgressBarToggle = document.getElementById('toggle-water-progress-bar');
        this.plainTextHeadingsToggle = document.getElementById('toggle-plain-text-headings');
        this.readingModeToggle = document.getElementById('toggle-reading-mode');
        this.charactersPerLineSlider = document.getElementById('reading-characters-per-line');
        this.lineHeightSlider = document.getElementById('reading-line-height');
        
        // Quick toggles
        this.quickProgressBarToggle = document.getElementById('quick-toggle-progress-bar');
        this.quickTocToggle = document.getElementById('quick-toggle-toc');
        this.quickWaterProgressBarToggle = document.getElementById('quick-toggle-water-progress-bar');
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.applySettings();
        this.setupEventListeners();
        this.initializeQuickMenu();
    }
    
    initializeQuickMenu() {
        this.settingsToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const isCurrentlyOpen = this.quickMenu?.classList.contains('show');
            
            if (!isCurrentlyOpen) {
                this.quickMenu?.classList.remove('from-collapsed-settings', 'from-collapsed-theme');
            }
            
            this.quickMenu?.classList.toggle('show');
            
            const themeQuickMenu = document.getElementById('theme-quick-menu');
            themeQuickMenu?.classList.remove('show');
        });
        
        this.quickProgressBarToggle?.addEventListener('change', (e) => {
            state.settings.showProgressBar = e.target.checked;
            if (this.progressBarToggle) {
                this.progressBarToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyProgressBarSetting();
        });
        
        this.quickTocToggle?.addEventListener('change', (e) => {
            state.settings.showTOC = e.target.checked;
            if (this.tocToggle) {
                this.tocToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyTOCSetting();
        });

        this.quickWaterProgressBarToggle?.addEventListener('change', (e) => {
            state.settings.showWaterProgressBar = e.target.checked;
            if (this.waterProgressBarToggle) {
                this.waterProgressBarToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyWaterProgressBarSetting();
        });
        
        this.openFullPanelBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.quickMenu?.classList.remove('show');
            this.openPanel();
        });
        
        document.addEventListener('click', (e) => {
            const collapsedSettingsBtn = document.getElementById('collapsed-settings-btn');
            if (!this.settingsToggle?.contains(e.target) && 
                !this.quickMenu?.contains(e.target) &&
                !collapsedSettingsBtn?.contains(e.target)) {
                this.quickMenu?.classList.remove('show');
            }
        });
    }
    
    setupEventListeners() {
        this.closeSettingsBtn?.addEventListener('click', () => this.closePanel());
        
        this.progressBarToggle?.addEventListener('change', (e) => {
            state.settings.showProgressBar = e.target.checked;
            if (this.quickProgressBarToggle) {
                this.quickProgressBarToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyProgressBarSetting();
        });
        
        this.tocToggle?.addEventListener('change', (e) => {
            state.settings.showTOC = e.target.checked;
            if (this.quickTocToggle) {
                this.quickTocToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyTOCSetting();
        });

        this.waterProgressBarToggle?.addEventListener('change', (e) => {
            state.settings.showWaterProgressBar = e.target.checked;
            if (this.quickWaterProgressBarToggle) {
                this.quickWaterProgressBarToggle.checked = e.target.checked;
            }
            this.saveSettings();
            this.applyWaterProgressBarSetting();
        });

        this.plainTextHeadingsToggle?.addEventListener('change', (e) => {
            state.settings.plainTextHeadings = e.target.checked;
            this.saveSettings();
            refreshRenderedView();
        });

        this.readingModeToggle?.addEventListener('change', (e) => {
            state.settings.readingMode = e.target.checked;
            const preset = e.target.checked
                ? TYPOGRAPHY_DEFAULTS.reading
                : TYPOGRAPHY_DEFAULTS.standard;

            state.settings.charactersPerLine = preset.charactersPerLine;
            state.settings.lineHeight = preset.lineHeight;
            this.saveSettings();
            this.applyReadingSettings();
        });

        this.charactersPerLineSlider?.addEventListener('input', (e) => {
            state.settings.charactersPerLine = parseInt(e.target.value, 10);
            this.saveSettings();
            this.applyReadingSettings({ updateSliders: false });
            syncReadingTypographyInputs(
                state.settings.charactersPerLine,
                state.settings.lineHeight
            );
        });

        this.lineHeightSlider?.addEventListener('input', (e) => {
            state.settings.lineHeight = parseFloat(e.target.value);
            this.saveSettings();
            this.applyReadingSettings({ updateSliders: false });
            syncReadingTypographyInputs(
                state.settings.charactersPerLine,
                state.settings.lineHeight
            );
        });
    }
    
    openPanel() {
        this.settingsPanel?.classList.add('open');
        
        const themePanel = document.getElementById('theme-panel');
        if (themePanel?.classList.contains('open')) {
            themePanel.classList.remove('open');
        }
    }
    
    closePanel() {
        this.settingsPanel?.classList.remove('open');
    }
    
    togglePanel() {
        if (this.settingsPanel?.classList.contains('open')) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                const settings = JSON.parse(saved);
                state.settings = {
                    ...state.settings,
                    ...settings
                };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }

        if (!Number.isFinite(state.settings.charactersPerLine)) {
            state.settings.charactersPerLine = TYPOGRAPHY_DEFAULTS.standard.charactersPerLine;
        }
        if (!Number.isFinite(state.settings.lineHeight)) {
            state.settings.lineHeight = TYPOGRAPHY_DEFAULTS.standard.lineHeight;
        }
        if (typeof state.settings.readingMode !== 'boolean') {
            state.settings.readingMode = false;
        }
        if (typeof state.settings.plainTextHeadings !== 'boolean') {
            state.settings.plainTextHeadings = true;
        }
        if (typeof state.settings.showWaterProgressBar !== 'boolean') {
            state.settings.showWaterProgressBar = false;
        }
        
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
        if (this.waterProgressBarToggle) {
            this.waterProgressBarToggle.checked = state.settings.showWaterProgressBar;
        }
        if (this.quickWaterProgressBarToggle) {
            this.quickWaterProgressBarToggle.checked = state.settings.showWaterProgressBar;
        }
        if (this.readingModeToggle) {
            this.readingModeToggle.checked = state.settings.readingMode;
        }
        if (this.plainTextHeadingsToggle) {
            this.plainTextHeadingsToggle.checked = state.settings.plainTextHeadings;
        }

        syncReadingTypographyInputs(
            state.settings.charactersPerLine,
            state.settings.lineHeight
        );
    }
    
    saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    applySettings() {
        this.applyProgressBarSetting();
        this.applyTOCSetting();
        this.applyWaterProgressBarSetting();
        this.applyReadingSettings();
    }

    applyReadingSettings({ updateSliders = true } = {}) {
        const { charactersPerLine, lineHeight, readingMode } = state.settings;

        applyTypography(charactersPerLine, lineHeight);
        document.documentElement.classList.toggle('reading-mode', readingMode);

        if (updateSliders) {
            syncReadingTypographyInputs(charactersPerLine, lineHeight);
        }

        syncThemeTypographyInputs(charactersPerLine, lineHeight);
    }

    updateTypographyFromTheme(contentMaxWidth, lineHeight) {
        state.settings.charactersPerLine = parseCharactersPerLine(contentMaxWidth);
        state.settings.lineHeight = parseLineHeight(lineHeight);
        state.settings.readingMode = this.matchesReadingPreset(
            state.settings.charactersPerLine,
            state.settings.lineHeight
        );

        if (this.readingModeToggle) {
            this.readingModeToggle.checked = state.settings.readingMode;
        }

        document.documentElement.classList.toggle('reading-mode', state.settings.readingMode);
        syncReadingTypographyInputs(
            state.settings.charactersPerLine,
            state.settings.lineHeight
        );
        this.saveSettings();
    }

    matchesReadingPreset(charactersPerLine, lineHeight) {
        const { reading } = TYPOGRAPHY_DEFAULTS;
        return charactersPerLine === reading.charactersPerLine
            && Math.abs(lineHeight - reading.lineHeight) < 0.001;
    }
    
    applyProgressBarSetting() {
        const progressBar = getProgressBar();
        
        if (!progressBar) return;
        
        if (state.settings.showProgressBar) {
            progressBar.updateVisibility();
        } else {
            progressBar.hide();
        }
    }
    
    applyTOCSetting() {
        const toc = document.getElementById('toc');
        
        if (toc) {
            if (state.settings.showTOC) {
                toc.classList.remove('force-hidden');
            } else {
                toc.classList.add('force-hidden');
            }
        }

        this.applyWaterProgressBarSetting();
    }

    applyWaterProgressBarSetting() {
        document.documentElement.classList.toggle(
            'water-progress-enabled',
            Boolean(state.settings.showWaterProgressBar)
        );

        const waterProgressBar = getWaterProgressBar();

        if (!waterProgressBar) return;

        waterProgressBar.updateVisibility();
    }
}

export function getSettingsManager() {
    return window.__settingsManager ?? null;
}

export function registerSettingsManager(manager) {
    window.__settingsManager = manager;
}
