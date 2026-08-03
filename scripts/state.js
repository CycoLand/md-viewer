// Global state management
export const state = {
    files: new Map(),
    currentFileId: null,
    sidebarCollapsed: false,
    rawMode: false,
    renderCache: new Map(), // fileId -> sanitized HTML string
    contentFilters: {
        emojis: false,
        hr: false
    },
    settings: {
        showProgressBar: true,
        showTOC: true,
        showWaterProgressBar: false,
        plainTextHeadings: true,
        readingMode: false,
        charactersPerLine: 68,
        lineHeight: 1.625,
        acronymUid: '',
        acronymTokenId: '',
        acronymAlwaysUnderline: false
    }
};

export const STORAGE_KEY = 'markdownViewerDocs';
export const SETTINGS_KEY = 'markdownViewerSettings';
export const ACRONYM_CACHE_KEY = 'markdownViewerAcronymCache';
