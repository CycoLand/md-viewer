// Laser pointer border animation system

/**
 * Get CSS variable value in pixels
 */
function getCSSVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Parse duration from CSS (e.g., "0.6s" -> 600, "600ms" -> 600)
 */
function parseDuration(duration) {
    if (duration.endsWith('ms')) {
        return parseFloat(duration);
    } else if (duration.endsWith('s')) {
        return parseFloat(duration) * 1000;
    }
    return 600;
}

/**
 * Calculate and apply constant-speed animation timing to a file item
 * @param {HTMLElement} fileItem - The file item element
 */
function applyConstantSpeedAnimation(fileItem) {
    const rect = fileItem.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const perimeter = 2 * (width + height);
    
    // Calculate what percentage of the perimeter each edge represents
    const rightEdgePercent = height / perimeter;
    const topEdgePercent = width / perimeter;
    const leftEdgePercent = height / perimeter;
    const bottomEdgePercent = width / perimeter;
    
    // Calculate cumulative percentages for keyframes (0 to 1)
    // For clockwise: bottom-right -> bottom-left -> top-left -> top-right -> back
    const bottomEdgeEnd = bottomEdgePercent;  // Time for bottom edge (going left)
    const leftEdgeEnd = bottomEdgeEnd + leftEdgePercent;  // Time for left edge (going up)
    const topEdgeEnd = leftEdgeEnd + topEdgePercent;  // Time for top edge (going right)
    // rightEdgeEnd is 1.0 (going down back to start)
    
    // Get animation duration
    const duration = parseDuration(getCSSVariable('--laser-rotation-speed'));
    
    // Store the animation data with offsets
    fileItem._laserAnimations = {
        duration,
        bottomEdgeEnd,
        leftEdgeEnd,
        topEdgeEnd
    };
}


/**
 * Initialize laser animations on all file items
 */
function initFileItemAnimations() {
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(fileItem => {
        applyConstantSpeedAnimation(fileItem);
        
        // Add hover/focus listeners to start/stop animations
        const startAnimation = () => {
            if (fileItem._laserAnimations && !fileItem._activeAnimations) {
                const { duration, bottomEdgeEnd, leftEdgeEnd, topEdgeEnd } = fileItem._laserAnimations;
                
                fileItem.classList.add('laser-animating');
                
                // Create 20 dots with gradually decreasing size and opacity
                const dots = [];
                const animations = [];
                const dotCount = 20;
                
                for (let i = 0; i < dotCount; i++) {
                    // Calculate properties - biggest dot leads, smaller dots trail
                    const progress = i / (dotCount - 1); // 0 to 1
                    const size = 8 - (progress * 6); // 8px down to 2px
                    const opacity = 1 - (progress * 0.85); // 1.0 down to 0.15
                    const delay = i * 20; // Positive delay: trail dots start AHEAD in the animation
                    const blur = 16 - (progress * 12); // 16px down to 4px
                    
                    const dot = document.createElement('div');
                    dot.className = 'laser-dot-element';
                    dot.style.cssText = `
                        position: absolute;
                        width: ${size}px;
                        height: ${size}px;
                        background: var(--laser-color);
                        border-radius: 50%;
                        box-shadow: 0 0 ${blur}px var(--laser-color);
                        pointer-events: none;
                        opacity: ${opacity};
                        z-index: ${10 - i};
                    `;
                    
                    fileItem.appendChild(dot);
                    dots.push(dot);
                    
                    // Clockwise path with constant speed based on perimeter
                    // Path: bottom-right -> bottom-left -> top-left -> top-right -> bottom-right
                    const clockwiseKeyframes = [
                        { top: '100%', left: '100%', transform: 'translate(-50%, -50%)', offset: 0 },
                        { top: '100%', left: '0%', transform: 'translate(-50%, -50%)', offset: bottomEdgeEnd },
                        { top: '0%', left: '0%', transform: 'translate(-50%, -50%)', offset: leftEdgeEnd },
                        { top: '0%', left: '100%', transform: 'translate(-50%, -50%)', offset: topEdgeEnd },
                        { top: '100%', left: '100%', transform: 'translate(-50%, -50%)', offset: 1 }
                    ];
                    
                    const animation = dot.animate(clockwiseKeyframes, {
                        duration,
                        iterations: Infinity,
                        easing: 'linear',
                        delay: delay
                    });
                    
                    animations.push(animation);
                }
                
                fileItem._activeAnimations = { dots, animations };
            }
        };
        
        const stopAnimation = () => {
            if (fileItem._activeAnimations) {
                const { dots, animations } = fileItem._activeAnimations;
                animations.forEach(anim => anim.cancel());
                dots.forEach(dot => dot.remove());
                fileItem._activeAnimations = null;
                fileItem.classList.remove('laser-animating');
            }
        };
        
        // Remove old listeners if they exist

        
        // Remove old listeners if they exist
        if (fileItem._laserListeners) {
            fileItem.removeEventListener('mouseenter', fileItem._laserListeners.start);
            fileItem.removeEventListener('mouseleave', fileItem._laserListeners.stop);
            fileItem.removeEventListener('focus', fileItem._laserListeners.start);
            fileItem.removeEventListener('blur', fileItem._laserListeners.stop);
        }
        
        // Add new listeners
        fileItem._laserListeners = { start: startAnimation, stop: stopAnimation };
        fileItem.addEventListener('mouseenter', startAnimation);
        fileItem.addEventListener('mouseleave', stopAnimation);
        fileItem.addEventListener('focus', startAnimation);
        fileItem.addEventListener('blur', stopAnimation);
    });
}

/**
 * Create and animate the rocket from clicked file item to content area
 * @param {HTMLElement} fileItem - The file item that was clicked
 * @param {Function} callback - Function to call when animation completes
 */
export function launchRocket(fileItem, callback) {
    // Get the rotation speed to calculate when dot reaches bottom-right
    const rotationSpeed = parseDuration(getCSSVariable('--laser-rotation-speed'));
    const rocketDuration = parseDuration(getCSSVariable('--laser-rocket-duration'));
    
    // Calculate position of bottom-right corner of the file item
    const rect = fileItem.getBoundingClientRect();
    const startX = rect.right - 4; // Bottom right corner
    const startY = rect.bottom - 4;
    
    // Get the content area center as target
    const contentArea = document.getElementById('content-area');
    const contentRect = contentArea.getBoundingClientRect();
    const endX = contentRect.left + contentRect.width / 2;
    const endY = contentRect.top + contentRect.height / 2;
    
    // Add a CSS class to make the laser complete its rotation to bottom-right
    fileItem.classList.add('laser-completing');
    
    // Wait for the dot to reach bottom-right corner (approximately 75% through rotation)
    // The dot needs to travel counter-clockwise from wherever it is to bottom-right
    setTimeout(() => {
        // Remove the rotating border
        fileItem.classList.remove('laser-completing');
        
        // Create the rocket element
        const rocket = document.createElement('div');
        rocket.className = 'laser-rocket';
        rocket.style.left = startX + 'px';
        rocket.style.top = startY + 'px';
        document.body.appendChild(rocket);
        
        // Calculate angle for the trail
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Rotate the trail to point in the direction of movement
        rocket.style.setProperty('--trail-rotation', `${angle}deg`);
        
        // Animate the rocket
        const animation = rocket.animate([
            {
                left: startX + 'px',
                top: startY + 'px',
                opacity: 1
            },
            {
                left: endX + 'px',
                top: endY + 'px',
                opacity: 0
            }
        ], {
            duration: rocketDuration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
        
        // When animation completes, trigger the page load and cleanup
        animation.onfinish = () => {
            rocket.remove();
            if (callback) callback();
        };
    }, rotationSpeed * 0.25); // Wait for approximately 1/4 rotation to reach bottom-right
}

/**
 * Initialize laser animation on file items
 */
export function initLaserAnimation() {
    // Initial setup
    initFileItemAnimations();
    
    // Re-calculate on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initFileItemAnimations();
        }, 250);
    });
    
    // Observe DOM changes to handle dynamically added file items
    const observer = new MutationObserver(() => {
        initFileItemAnimations();
    });
    
    const fileList = document.querySelector('.file-list');
    if (fileList) {
        observer.observe(fileList, { childList: true, subtree: true });
    }
    
    console.log('🔫 Laser pointer animation initialized with constant speed!');
}
