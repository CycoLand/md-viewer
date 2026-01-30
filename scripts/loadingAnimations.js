// Loading animation system - Wipe transition effect with progressive content reveal

let loadingContainer = null;
let oldContentClone = null;

/**
 * Initialize loading container if it doesn't exist
 */
function ensureLoadingContainer() {
    if (!loadingContainer) {
        loadingContainer = document.getElementById('loading-overlay');
    }
    return loadingContainer;
}

/**
 * Show wipe loading animation with progressive content replacement
 * @param {HTMLElement} contentElement - The content element that will be replaced
 */
export function showLoading(contentElement) {
    const container = ensureLoadingContainer();
    if (!container) return;

    // Clone the old content if it exists
    if (contentElement && contentElement.innerHTML.trim()) {
        // Capture the current scroll position before cloning
        const originalScrollTop = contentElement.scrollTop || 0;
        
        oldContentClone = contentElement.cloneNode(true);
        oldContentClone.className = 'old-content-layer';
        oldContentClone.style.position = 'absolute';
        oldContentClone.style.top = '0';
        oldContentClone.style.left = '0';
        oldContentClone.style.right = '0';
        oldContentClone.style.bottom = '0';
        oldContentClone.style.overflow = 'auto'; // Keep scrollable to maintain scroll position
        oldContentClone.style.zIndex = '2';
        oldContentClone.style.background = 'var(--bg-color)';
        oldContentClone.style.pointerEvents = 'none'; // Disable interaction with clone
        
        // Add clip-path animation that progressively hides from left
        oldContentClone.style.clipPath = 'inset(0 0 0 0)';
        oldContentClone.style.animation = 'clip-wipe 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        
        container.appendChild(oldContentClone);
        
        // Restore the scroll position on the clone to match the original view
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            oldContentClone.scrollTop = originalScrollTop;
        });
    }

    // Clear previous content and activate
    container.className = 'loading-overlay active';

    // Create the wipe bar (on top of everything)
    const wipeBar = document.createElement('div');
    wipeBar.className = 'wipe-bar';
    container.appendChild(wipeBar);
}

/**
 * Hide loading animation
 */
export function hideLoading() {
    const container = ensureLoadingContainer();
    if (!container) return;

    container.classList.remove('active');
    
    // Clear animation after transition
    setTimeout(() => {
        container.innerHTML = '';
        container.className = 'loading-overlay';
        oldContentClone = null;
    }, 100);
}

// ==================== Console Testing Functions ====================

/**
 * Test the wipe animation
 */
function testWipeAnimation(duration = 2000) {
    console.log(`Testing wipe animation for ${duration}ms`);
    const mdContent = document.getElementById('markdown-content');
    showLoading(mdContent);
    setTimeout(() => {
        hideLoading();
        console.log('Animation test complete');
    }, duration);
}

// Expose testing function to window for console access
window.loadingAnimations = {
    test: testWipeAnimation,
    show: showLoading,
    hide: hideLoading
};

// Log helpful message on load
console.log('🎨 Wipe animation ready! Type "loadingAnimations.test()" to preview.');
