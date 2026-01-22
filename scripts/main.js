// Main entry point - brings all modules together
import { state } from './state.js';
import { ThemeManager } from './themeManager.js';
import { FileManager } from './fileManager.js';
import { PaginationManager } from './paginationManager.js';
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
    handleFiles
} from './uiControls.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    const themeManager = new ThemeManager();
    const paginationManager = new PaginationManager();

    // Initialize drag and drop
    initializeDragAndDrop(FileManager);

    // Load files from localStorage
    FileManager.loadFiles();

    // File input handler
    document.getElementById('file-input').addEventListener('change', function(e) {
        handleFiles(e.target.files, FileManager);
    });

    // Button handlers
    document.getElementById('add-files-btn').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });

    document.getElementById('paste-content-btn').addEventListener('click', showPasteModal);
    document.getElementById('welcome-paste-btn').addEventListener('click', showPasteModal);

    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-toggle-header').addEventListener('click', toggleSidebar);
    document.getElementById('theme-toggle').addEventListener('click', toggleThemePanel);
    document.getElementById('close-theme-panel').addEventListener('click', closeThemePanel);

    document.getElementById('export-html-btn').addEventListener('click', () => FileManager.exportCurrentFileAsHtml());
    document.getElementById('toggle-raw-btn').addEventListener('click', () => toggleRawMode(FileManager));

    document.getElementById('overlay').addEventListener('click', closeThemePanel);

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

    // Pagination controls
    const togglePaginationBtn = document.getElementById('toggle-pagination-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');

    if (togglePaginationBtn) {
        togglePaginationBtn.addEventListener('click', () => {
            paginationManager.toggle();
        });
    }

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
            if (document.getElementById('theme-panel').classList.contains('open')) {
                closeThemePanel();
            }
            if (document.getElementById('paste-modal').classList.contains('show')) {
                closePasteModal();
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
    if (window.innerWidth <= 768) {
        state.sidebarCollapsed = true;
        document.getElementById('sidebar').classList.add('collapsed');
    }

    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
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
