// Loading animation system - Simple fade transition effect

/**
 * Get the fade transition duration in milliseconds from CSS variable
 * @returns {number} Duration in milliseconds
 */
export function getTransitionDuration() {
    const duration = getComputedStyle(document.documentElement)
        .getPropertyValue('--page-transition-duration').trim();
    
    // Parse duration (e.g., "0.3s" -> 300, "300ms" -> 300)
    if (duration.endsWith('ms')) {
        return parseFloat(duration);
    } else if (duration.endsWith('s')) {
        return parseFloat(duration) * 1000;
    }
    return 300; // Default fallback
}

/**
 * Show fade out animation
 * @param {HTMLElement} contentElement - The content element to fade out
 */
export function showLoading(contentElement) {
    if (!contentElement) return;
    
    // Add fading class to trigger CSS transition
    contentElement.classList.add('fading');
}

/**
 * Hide loading animation (fade in)
 * @param {HTMLElement} contentElement - The content element to fade in
 */
export function hideLoading(contentElement) {
    if (!contentElement) return;
    
    // Remove fading class to fade back in
    contentElement.classList.remove('fading');
}

// ==================== Console Testing Functions ====================

/**
 * Test the fade animation
 */
function testFadeAnimation(duration = 2000) {
    console.log(`Testing fade animation for ${duration}ms`);
    const contentArea = document.getElementById('content-area');
    showLoading(contentArea);
    setTimeout(() => {
        hideLoading(contentArea);
        console.log('Animation test complete');
    }, duration);
}

// Expose testing function to window for console access
window.loadingAnimations = {
    test: testFadeAnimation,
    show: showLoading,
    hide: hideLoading
};

// Log helpful message on load
console.log('🎨 Fade animation ready! Type "loadingAnimations.test()" to preview.');
