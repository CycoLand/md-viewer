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
    }
};

export const STORAGE_KEY = 'markdownViewerDocs';
