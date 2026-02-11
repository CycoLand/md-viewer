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
        showTOC: true
    }
};

export const STORAGE_KEY = 'markdownViewerDocs';
export const SETTINGS_KEY = 'markdownViewerSettings';
