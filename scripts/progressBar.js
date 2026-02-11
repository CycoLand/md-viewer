// Reading Progress Bar
// Tracks scroll position and displays progress at the top of the viewport

import { state } from './state.js';

export class ProgressBar {
    constructor() {
        this.progressBar = document.getElementById('reading-progress-bar');
        this.contentArea = null;
        this.isActive = false;
        this.throttleTimeout = null;
        this.throttleDelay = 16; // ~60fps
        
        // Initialize
        this.init();
    }

    /**
     * Initialize the progress bar
     */
    init() {
        // Wait for content to be loaded
        this.setupScrollListener();
        
        // Listen for view mode changes
        this.setupViewModeListeners();
        
        // Initial update
        this.updateProgress();
    }

    /**
     * Set up scroll listener with throttling for performance
     */
    setupScrollListener() {
        // The content-area is the scrollable container
        const contentArea = document.getElementById('content-area');
        
        if (contentArea) {
            contentArea.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        }
        
        // Fallback to document scroll as well
        document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }

    /**
     * Handle scroll event with throttling
     */
    handleScroll() {
        if (this.throttleTimeout) return;
        
        this.throttleTimeout = setTimeout(() => {
            this.updateProgress();
            this.throttleTimeout = null;
        }, this.throttleDelay);
    }

    /**
     * Listen for view mode changes to show/hide progress bar
     */
    setupViewModeListeners() {
        // Listen for pagination toggle
        document.addEventListener('togglePagination', () => {
            // When pagination is toggled, update visibility
            setTimeout(() => this.updateVisibility(), 100);
        });
        
        // Watch for changes to rawMode in state
        // This is a simple polling approach - could be improved with a proper state observer
        setInterval(() => {
            this.updateVisibility();
        }, 500);
    }

    /**
     * Update progress bar visibility based on current view mode
     */
    updateVisibility() {
        const paginationActive = document.querySelector('.page-navigation')?.classList.contains('active') || false;
        const isRawMode = state.rawMode;
        const hasContent = state.currentFileId !== null;
        const settingEnabled = state.settings.showProgressBar;
        
        // Show progress bar only in rendered view mode with content AND if setting is enabled
        const shouldShow = hasContent && !isRawMode && !paginationActive && settingEnabled;
        
        if (shouldShow) {
            this.show();
            this.updateProgress();
        } else {
            this.hide();
        }
    }

    /**
     * Calculate and update the progress bar width
     */
    updateProgress() {
        if (!this.isActive) return;
        
        // Get the scrollable container - content-area is the main scrollable element
        const contentArea = document.getElementById('content-area');
        
        if (!contentArea) {
            this.progressBar.style.width = '0px';
            return;
        }
        
        // Calculate scroll progress
        const scrollTop = contentArea.scrollTop;
        const scrollHeight = contentArea.scrollHeight;
        const clientHeight = contentArea.clientHeight;
        
        // Calculate percentage (0-100)
        const maxScroll = scrollHeight - clientHeight;
        let scrollPercentage = 0;
        
        if (maxScroll > 0) {
            scrollPercentage = (scrollTop / maxScroll) * 100;
            scrollPercentage = Math.min(100, Math.max(0, scrollPercentage)); // Clamp between 0-100
        } else {
            // Content is not scrollable (shorter than viewport) or just loaded
            // Check if we actually have content
            const markdownContent = document.getElementById('markdown-content');
            if (markdownContent && markdownContent.children.length > 0) {
                // Content exists but fits in viewport - show 100%
                scrollPercentage = 100;
            } else {
                // No content yet
                scrollPercentage = 0;
            }
        }
        
        // Calculate the actual pixel width to fill the available space
        // The progress bar starts at the sidebar edge and should fill to the right edge
        const sidebar = document.getElementById('sidebar');
        const sidebarWidth = sidebar && !sidebar.classList.contains('collapsed') 
            ? sidebar.offsetWidth 
            : 0;
        
        const availableWidth = window.innerWidth - sidebarWidth;
        const progressPixels = (scrollPercentage / 100) * availableWidth;
        
        // Update the progress bar width in pixels
        if (this.progressBar) {
            this.progressBar.style.width = `${progressPixels}px`;
        }
    }

    /**
     * Show the progress bar
     */
    show() {
        if (this.isActive) return;
        
        this.isActive = true;
        if (this.progressBar) {
            this.progressBar.classList.remove('hidden');
        }
    }

    /**
     * Hide the progress bar
     */
    hide() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.progressBar) {
            this.progressBar.classList.add('hidden');
        }
    }

    /**
     * Reset the progress bar to 0%
     */
    reset() {
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
    }

    /**
     * Update progress when file changes
     */
    onFileChange() {
        this.reset();
        this.updateVisibility();
        
        // Wait for content to render, then update
        setTimeout(() => {
            this.updateProgress();
        }, 100);
    }
}

// Export a singleton instance
let progressBarInstance = null;

export function initProgressBar() {
    if (!progressBarInstance) {
        progressBarInstance = new ProgressBar();
    }
    return progressBarInstance;
}

export function getProgressBar() {
    return progressBarInstance;
}
