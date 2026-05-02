// Main entry point - brings all modules together
import { state } from './state.js';
import { ThemeManager } from './themeManager.js';
import { SettingsManager } from './settingsManager.js';
import { FileManager } from './fileManager.js';
import { PaginationManager } from './paginationManager.js';
import { ClipboardAutoLoader } from './clipboardAutoLoader.js';
import { initProgressBar, getProgressBar } from './progressBar.js';
import { WaterProgressBar } from './waterProgressBar.js';
import './loadingAnimations.js'; // Initialize loading animations
import {
    toggleSidebar,
    toggleThemePanel,
    closeThemePanel,
    toggleRawMode,
    showPasteModal,
    closePasteModal,
    autoDetectTitle,
    addPastedContent,
    initializeDragAndDrop,
    handleFiles,
    showAddDocumentModal,
    closeAddDocumentModal,
    handleModalFileSelect,
    clearSelectedFile,
    createDocumentFromModal
} from './uiControls.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    const themeManager = new ThemeManager();
    const settingsManager = new SettingsManager();
    const paginationManager = new PaginationManager();
    
    // Initialize progress bar
    const progressBar = initProgressBar();
    
    // Initialize water progress bar
    const waterProgressBar = new WaterProgressBar();

    // Initialize drag and drop
    initializeDragAndDrop(FileManager);

    // Load files from localStorage BEFORE clipboard loader
    FileManager.loadFiles();
    
    // NOW initialize clipboard auto-loader (after FileManager is ready)
    const clipboardAutoLoader = new ClipboardAutoLoader();

    // Load files from localStorage
    FileManager.loadFiles();

    // Search functionality
    const globalSearchInput = document.getElementById('global-search');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', function(e) {
            const query = e.target.value;
            FileManager.renderFileList(query);
        });
    }

    // File input handler
    document.getElementById('file-input').addEventListener('change', function(e) {
        handleFiles(e.target.files, FileManager);
    });

    // Button handlers
    const addDocBtn = document.getElementById('add-document-btn');
    
    if (addDocBtn) {
        addDocBtn.addEventListener('click', () => {
            showAddDocumentModal();
        });
    }

    // Add Document Modal handlers
    document.getElementById('close-add-document-modal')?.addEventListener('click', closeAddDocumentModal);
    document.getElementById('cancel-add-document-btn')?.addEventListener('click', closeAddDocumentModal);
    document.getElementById('create-document-btn')?.addEventListener('click', () => createDocumentFromModal(FileManager));
    
    document.getElementById('browse-file-btn')?.addEventListener('click', () => {
        document.getElementById('file-input').click();
    });
    
    document.getElementById('clear-file-btn')?.addEventListener('click', clearSelectedFile);
    
    // File input change
    document.getElementById('file-input')?.addEventListener('change', handleModalFileSelect);
    
    // Auto-generate title from pasted content
    document.getElementById('paste-markdown-input')?.addEventListener('input', function(e) {
        const titleInput = document.getElementById('document-title-input');
        const createBtn = document.getElementById('create-document-btn');
        const content = e.target.value;
        
        if (content.trim() && !titleInput.dataset.userEdited) {
            const detectedTitle = autoDetectTitle(content);
            titleInput.value = detectedTitle;
            
            // Focus the create button after title is generated
            setTimeout(() => {
                createBtn.focus();
            }, 50);
        }
    });
    
    // Track if user manually edited the title
    document.getElementById('document-title-input')?.addEventListener('input', function() {
        this.dataset.userEdited = 'true';
    });
    

    // Handle Enter key on create button
    document.getElementById('create-document-btn')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            createDocumentFromModal(FileManager);
        }
    });

    // Close modal on clicking backdrop
    document.getElementById('add-document-modal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeAddDocumentModal();
        }
    });
    document.getElementById('welcome-paste-btn').addEventListener('click', showPasteModal);

    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('close-theme-panel').addEventListener('click', closeThemePanel);

    // Collapsed sidebar control buttons - show quick menus
    const collapsedSidebarToggle = document.getElementById('collapsed-sidebar-toggle');
    const collapsedNewDocBtn = document.getElementById('collapsed-new-doc-btn');
    const collapsedSettingsBtn = document.getElementById('collapsed-settings-btn');
    const collapsedThemeBtn = document.getElementById('collapsed-theme-btn');
    
    console.log('Collapsed buttons found:', {
        sidebarToggle: !!collapsedSidebarToggle,
        newDoc: !!collapsedNewDocBtn,
        settings: !!collapsedSettingsBtn,
        theme: !!collapsedThemeBtn
    });
    
    collapsedSidebarToggle?.addEventListener('click', toggleSidebar);
    
    collapsedNewDocBtn?.addEventListener('click', () => {
        console.log('Collapsed new doc clicked');
        showAddDocumentModal();
    });
    
    collapsedSettingsBtn?.addEventListener('click', (e) => {
        console.log('Collapsed settings clicked');
        e.stopPropagation();
        const quickMenu = document.getElementById('settings-quick-menu');
        const themeQuickMenu = document.getElementById('theme-quick-menu');
        
        // Close theme menu if open (keep positioning classes for smooth fade)
        themeQuickMenu?.classList.remove('show');
        
        // Set positioning for collapsed state BEFORE toggling show
        quickMenu?.classList.remove('from-collapsed-theme');
        quickMenu?.classList.add('from-collapsed-settings');
        
        // Toggle settings quick menu
        quickMenu?.classList.toggle('show');
        
        console.log('Settings quick menu toggled:', quickMenu?.classList.contains('show'));
    });
    
    collapsedThemeBtn?.addEventListener('click', (e) => {
        console.log('Collapsed theme clicked');
        e.stopPropagation();
        const quickMenu = document.getElementById('theme-quick-menu');
        const settingsQuickMenu = document.getElementById('settings-quick-menu');
        
        // Close settings menu if open (keep positioning classes for smooth fade)
        settingsQuickMenu?.classList.remove('show');
        
        // Set positioning for collapsed state BEFORE toggling show
        quickMenu?.classList.remove('from-collapsed-settings');
        quickMenu?.classList.add('from-collapsed-theme');
        
        // Toggle theme quick menu
        quickMenu?.classList.toggle('show');
        
        console.log('Theme quick menu toggled:', quickMenu?.classList.contains('show'));
    });

    // Overlay is no longer used for theme/settings panels

    document.getElementById('paste-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closePasteModal();
        }
    });

    // Paste modal - add content button
    document.getElementById('add-paste-btn')?.addEventListener('click', () => addPastedContent(FileManager));
    document.getElementById('close-paste-modal')?.addEventListener('click', closePasteModal);
    document.getElementById('cancel-paste-btn')?.addEventListener('click', closePasteModal);

    // Auto-fill filename when markdown content is pasted/typed
    document.getElementById('markdown-input').addEventListener('input', function(e) {
        const nameInput = document.getElementById('file-name-input');
        const content = e.target.value;
        
        if (!nameInput.value.trim() && content.trim()) {
            const detectedTitle = autoDetectTitle(content);
            nameInput.value = detectedTitle;
        }
    });

    // Pagination keyboard and page navigation controls
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');


    // Listen for custom pagination toggle event from document menu
    document.addEventListener('togglePagination', () => {
        paginationManager.toggle();
    });

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            paginationManager.prevPage();
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            paginationManager.nextPage();
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'o':
                    e.preventDefault();
                    document.getElementById('file-input').click();
                    break;
                case 'v':
                    if (e.shiftKey) {
                        e.preventDefault();
                        showPasteModal();
                    }
                    break;
                case 'e':
                    if (state.currentFileId) {
                        e.preventDefault();
                        FileManager.exportCurrentFileAsHtml();
                    }
                    break;
                case 'r':
                    if (state.currentFileId) {
                        e.preventDefault();
                        toggleRawMode(FileManager);
                    }
                    break;
                case 'b':
                    e.preventDefault();
                    toggleSidebar();
                    break;
                case ',':
                    e.preventDefault();
                    toggleThemePanel();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            if (document.getElementById('settings-panel').classList.contains('open')) {
                settingsManager.closePanel();
            }
            if (document.getElementById('theme-panel').classList.contains('open')) {
                closeThemePanel();
            }
            if (document.getElementById('paste-modal').classList.contains('show')) {
                closePasteModal();
            }
            if (document.getElementById('add-document-modal').classList.contains('show')) {
                closeAddDocumentModal();
            }
        }

        // Pagination keyboard navigation
        if (paginationManager.paginationActive) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                paginationManager.prevPage();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                paginationManager.nextPage();
            }
        }
    });

    // Responsive sidebar
    if (window.innerWidth <= 800) {
        state.sidebarCollapsed = true;
        document.getElementById('sidebar').classList.add('collapsed');
    }

    window.addEventListener('resize', function() {
        if (window.innerWidth <= 800) {
            if (!state.sidebarCollapsed) {
                toggleSidebar();
            }
        }
    });

    console.log('🎉 Ultimate Markdown Viewer initialized!');
    console.log('💡 Keyboard shortcuts:');
    console.log('   Ctrl+O: Open files');
    console.log('   Ctrl+Shift+V: Paste markdown');
    console.log('   Ctrl+E: Export HTML');
    console.log('   Ctrl+R: Toggle raw mode');
    console.log('   Ctrl+B: Toggle sidebar');
    console.log('   Ctrl+,: Theme settings');
    console.log('   Escape: Close panels');
});
