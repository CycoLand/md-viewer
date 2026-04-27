// Code block enhancement utilities

/**
 * Calculates relative luminance of a color for contrast checking
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {number} Relative luminance (0-1)
 */
function getRelativeLuminance(r, g, b) {
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculates contrast ratio between two colors
 * @param {string} color1 - First color (hex or rgb)
 * @param {string} color2 - Second color (hex or rgb)
 * @returns {number} Contrast ratio (1-21)
 */
function getContrastRatio(color1, color2) {
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);
    
    if (!rgb1 || !rgb2) return 21; // Assume good contrast if we can't parse
    
    const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parses a color string to RGB values
 * @param {string} color - Color string (hex, rgb, rgba, or named color)
 * @returns {{r: number, g: number, b: number}|null} RGB object or null if parsing fails
 */
function parseColor(color) {
    if (!color || color === 'none' || color === 'transparent') return null;
    
    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16)
            };
        } else if (hex.length === 6) {
            return {
                r: parseInt(hex.substr(0, 2), 16),
                g: parseInt(hex.substr(2, 2), 16),
                b: parseInt(hex.substr(4, 2), 16)
            };
        }
    }
    
    // Handle rgb/rgba
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3])
        };
    }
    
    // Try to get computed color from a temporary element
    try {
        const temp = document.createElement('div');
        temp.style.color = color;
        document.body.appendChild(temp);
        const computed = window.getComputedStyle(temp).color;
        document.body.removeChild(temp);
        return parseColor(computed);
    } catch (e) {
        return null;
    }
}

/**
 * Adjusts a color to ensure sufficient contrast
 * @param {string} color - Original color
 * @param {string} backgroundColor - Background color to contrast against
 * @param {number} targetRatio - Target contrast ratio (default 4.5 for WCAG AA)
 * @returns {string} Adjusted color
 */
function ensureContrast(color, backgroundColor, targetRatio = 4.5) {
    let rgb = parseColor(color);
    const bgRgb = parseColor(backgroundColor);
    
    if (!rgb || !bgRgb) return color; // Can't adjust if we can't parse
    
    let currentRatio = getContrastRatio(
        `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})`
    );
    
    if (currentRatio >= targetRatio) return color; // Already good contrast
    
    // Determine if we should lighten or darken
    const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const shouldLighten = bgLuminance < 0.5;
    
    // Adjust brightness until we meet the target ratio
    let attempts = 0;
    const maxAttempts = 100;
    
    while (currentRatio < targetRatio && attempts < maxAttempts) {
        if (shouldLighten) {
            // Lighten the color
            rgb.r = Math.min(255, rgb.r + (255 - rgb.r) * 0.1);
            rgb.g = Math.min(255, rgb.g + (255 - rgb.g) * 0.1);
            rgb.b = Math.min(255, rgb.b + (255 - rgb.b) * 0.1);
        } else {
            // Darken the color
            rgb.r = Math.max(0, rgb.r * 0.9);
            rgb.g = Math.max(0, rgb.g * 0.9);
            rgb.b = Math.max(0, rgb.b * 0.9);
        }
        
        currentRatio = getContrastRatio(
            `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
            `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})`
        );
        attempts++;
    }
    
    return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
}

/**
 * Detects if the current theme is dark mode
 * @returns {boolean} True if dark mode is active
 */
function isDarkMode() {
    // Check for explicit dark mode class on body or html
    if (document.body.classList.contains('dark-mode') || 
        document.documentElement.classList.contains('dark-mode')) {
        return true;
    }
    
    // Check CSS variables or computed background color
    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const rgb = parseColor(bgColor);
    
    if (rgb) {
        const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
        return luminance < 0.5; // Dark if luminance is low
    }
    
    // Check system preference as fallback
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Gets appropriate mermaid theme configuration based on current mode
 * @returns {object} Mermaid configuration object
 */
function getMermaidConfig() {
    const dark = isDarkMode();
    
    return {
        startOnLoad: false,
        theme: dark ? 'dark' : 'default',
        themeVariables: dark ? {
            darkMode: true,
            background: '#1e293b',
            primaryColor: '#6366f1',
            primaryTextColor: '#f8fafc',
            primaryBorderColor: '#475569',
            lineColor: '#94a3b8',
            secondaryColor: '#334155',
            tertiaryColor: '#475569',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            edgeLabelBackground: '#1e293b',
            clusterBkg: '#334155',
            clusterBorder: '#475569',
            defaultLinkColor: '#94a3b8',
            titleColor: '#f8fafc',
            nodeTextColor: '#f8fafc'
        } : {
            darkMode: false,
            background: '#ffffff',
            primaryColor: '#6366f1',
            primaryTextColor: '#1e293b',
            primaryBorderColor: '#cbd5e1',
            lineColor: '#475569',
            secondaryColor: '#e2e8f0',
            tertiaryColor: '#cbd5e1',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            edgeLabelBackground: '#ffffff',
            clusterBkg: '#f1f5f9',
            clusterBorder: '#cbd5e1',
            defaultLinkColor: '#475569',
            titleColor: '#1e293b',
            nodeTextColor: '#1e293b'
        },
        flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: 'basis',
            rankSpacing: 50,
            nodeSpacing: 50,
            defaultRenderer: 'dagre'
        },
        sequence: {
            // Keep sequence diagrams consistent with flowchart sizing behavior.
            useMaxWidth: false,
            wrap: true,
            height: 'auto'
        },
        gantt: {
            useMaxWidth: false
        },
        er: {
            useMaxWidth: false
        },
        journey: {
            useMaxWidth: false
        }
    };
}

// Initialize Mermaid with configuration
if (typeof mermaid !== 'undefined') {
    mermaid.initialize(getMermaidConfig());
}

// Register mermaid language for highlight.js to suppress warnings
if (typeof hljs !== 'undefined') {
    hljs.registerLanguage('mermaid', function() {
        return {
            name: 'Mermaid',
            contains: [
                {
                    className: 'keyword',
                    begin: /\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|journey|gitGraph|C4Context|mindmap|timeline|subgraph|end|participant|actor|note|loop|alt|else|opt|par|and|rect|activate|deactivate|autonumber|style|class|click|callback|link|linkStyle|classDef|direction|TB|TD|BT|RL|LR)\b/
                },
                {
                    className: 'string',
                    begin: /"/, end: /"/
                },
                {
                    className: 'string',
                    begin: /\[/, end: /\]/
                },
                {
                    className: 'comment',
                    begin: /%%/, end: /$/
                },
                {
                    className: 'operator',
                    begin: /-->|->|---|==|==>|\.\.>|-\.-|-->/
                }
            ]
        };
    });
}

/**
 * Wraps comment-only lines in a span for proper collapsing
 * @param {HTMLElement} codeElement - The code element to process
 */
export function collapseCommentLines(codeElement) {
    // Find all comment elements and check if they're on their own line
    const commentNodes = codeElement.querySelectorAll('.hljs-comment');
    
    commentNodes.forEach(commentNode => {
        // Skip if already wrapped
        if (commentNode.closest('.comment-only-line')) {
            return;
        }
        
        // Get text before comment on same line
        let textBefore = '';
        let currentNode = commentNode.previousSibling;
        
        while (currentNode) {
            if (currentNode.nodeType === Node.TEXT_NODE) {
                const text = currentNode.textContent;
                const lastNewlineIndex = text.lastIndexOf('\n');
                if (lastNewlineIndex !== -1) {
                    textBefore = text.substring(lastNewlineIndex + 1) + textBefore;
                    break;
                }
                textBefore = text + textBefore;
            } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                // There's other code on this line (unless it's another wrapped comment)
                if (!currentNode.classList || !currentNode.classList.contains('comment-only-line')) {
                    return;
                }
            }
            currentNode = currentNode.previousSibling;
        }
        
        // Get text after comment on same line
        let textAfter = '';
        currentNode = commentNode.nextSibling;
        
        while (currentNode) {
            if (currentNode.nodeType === Node.TEXT_NODE) {
                const text = currentNode.textContent;
                const firstNewlineIndex = text.indexOf('\n');
                if (firstNewlineIndex !== -1) {
                    textAfter = textAfter + text.substring(0, firstNewlineIndex);
                    break;
                }
                textAfter = textAfter + text;
            } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                // There's other code on this line
                if (!currentNode.classList || !currentNode.classList.contains('comment-only-line')) {
                    return;
                }
            }
            currentNode = currentNode.nextSibling;
        }
        
        // If both before and after are just whitespace, this is a comment-only line
        if (textBefore.trim() === '' && textAfter.trim() === '') {
            // Wrap the comment and surrounding whitespace up to newlines
            const wrapper = document.createElement('span');
            wrapper.className = 'comment-only-line';
            // Don't set display: none - let CSS handle it with transitions
            
            const parent = commentNode.parentNode;
            parent.insertBefore(wrapper, commentNode);
            
            // Add preceding whitespace
            currentNode = wrapper.previousSibling;
            const nodesToMove = [];
            while (currentNode) {
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    const text = currentNode.textContent;
                    const lastNewlineIndex = text.lastIndexOf('\n');
                    if (lastNewlineIndex !== -1) {
                        // Split this text node at the newline
                        const afterNewline = text.substring(lastNewlineIndex + 1);
                        const beforeNewline = text.substring(0, lastNewlineIndex + 1);
                        if (afterNewline) {
                            const afterNode = document.createTextNode(afterNewline);
                            nodesToMove.push(afterNode);
                        }
                        currentNode.textContent = beforeNewline;
                        break;
                    }
                    nodesToMove.push(currentNode);
                    currentNode = currentNode.previousSibling;
                } else {
                    break;
                }
            }
            
            // Add nodes before comment
            nodesToMove.reverse().forEach(n => wrapper.appendChild(n));
            
            // Add the comment itself
            wrapper.appendChild(commentNode);
            
            // Add trailing whitespace/newline
            currentNode = wrapper.nextSibling;
            while (currentNode) {
                if (currentNode.nodeType === Node.TEXT_NODE) {
                    const text = currentNode.textContent;
                    const firstNewlineIndex = text.indexOf('\n');
                    if (firstNewlineIndex !== -1) {
                        const beforeNewline = text.substring(0, firstNewlineIndex + 1);
                        const afterNewline = text.substring(firstNewlineIndex + 1);
                        wrapper.appendChild(document.createTextNode(beforeNewline));
                        if (afterNewline) {
                            currentNode.textContent = afterNewline;
                        } else {
                            const next = currentNode.nextSibling;
                            parent.removeChild(currentNode);
                            currentNode = next;
                        }
                        break;
                    }
                    const next = currentNode.nextSibling;
                    wrapper.appendChild(currentNode);
                    currentNode = next;
                } else {
                    break;
                }
            }
        }
    });
}

/**
 * Restores comment lines by unwrapping them
 * @param {HTMLElement} codeElement - The code element to process
 */
export function restoreCommentLines(codeElement) {
    const wrappedComments = codeElement.querySelectorAll('.comment-only-line');
    wrappedComments.forEach(wrapper => {
        const parent = wrapper.parentNode;
        while (wrapper.firstChild) {
            parent.insertBefore(wrapper.firstChild, wrapper);
        }
        parent.removeChild(wrapper);
    });
}

/**
 * Fixes SVG colors to ensure proper contrast
 * @param {SVGElement} svg - The SVG element to fix
 * @param {string} backgroundColor - The background color
 */
function fixSvgColors(svg, backgroundColor) {
    try {
        // Get all elements with fill or stroke attributes
        const elementsWithFill = svg.querySelectorAll('[fill]');
        const elementsWithStroke = svg.querySelectorAll('[stroke]');
        
        elementsWithFill.forEach(el => {
            const fill = el.getAttribute('fill');
            if (fill && fill !== 'none' && fill !== 'transparent') {
                const contrast = getContrastRatio(fill, backgroundColor);
                if (contrast < 3) { // WCAG AA for large text
                    const adjustedColor = ensureContrast(fill, backgroundColor, 4.5);
                    el.setAttribute('fill', adjustedColor);
                }
            }
        });
        
        elementsWithStroke.forEach(el => {
            const stroke = el.getAttribute('stroke');
            if (stroke && stroke !== 'none' && stroke !== 'transparent') {
                const contrast = getContrastRatio(stroke, backgroundColor);
                if (contrast < 3) {
                    const adjustedColor = ensureContrast(stroke, backgroundColor, 4.5);
                    el.setAttribute('stroke', adjustedColor);
                }
            }
        });
        
        // Fix text elements specifically
        const textElements = svg.querySelectorAll('text, tspan');
        textElements.forEach(el => {
            const fill = el.getAttribute('fill') || window.getComputedStyle(el).fill;
            if (fill && fill !== 'none') {
                const contrast = getContrastRatio(fill, backgroundColor);
                if (contrast < 4.5) { // WCAG AA for normal text
                    const adjustedColor = ensureContrast(fill, backgroundColor, 4.5);
                    el.setAttribute('fill', adjustedColor);
                }
            }
        });
    } catch (error) {
        console.warn('Failed to fix SVG colors:', error);
    }
}

/**
 * Sanitizes mermaid code to fix common syntax issues
 * @param {string} code - Original mermaid code
 * @returns {string} Sanitized mermaid code
 */
function sanitizeMermaidCode(code) {
    let sanitized = code;
    
    // Simple replacements for most common problematic characters
    const replacements = {
        // Common problematic sequences
        '??': '->',
        '→': '->',
        '←': '<-',
        '⇒': '=>',
        '⬅': '<-',
        '➡': '->',
        // Smart quotes
        '\u201C': '"',
        '\u201D': '"',
        '\u2018': "'",
        '\u2019': "'",
        // Dashes
        '—': '-',
        '–': '-'
    };
    
    // Apply replacements
    for (const [key, value] of Object.entries(replacements)) {
        sanitized = sanitized.split(key).join(value);
    }
    
    return sanitized;
}

/**
 * Renders a mermaid diagram
 * @param {HTMLElement} codeBlock - The code block containing mermaid syntax
 * @param {HTMLElement} pre - The pre element
 * @returns {Promise<HTMLElement>} The mermaid wrapper element
 */
async function renderMermaidDiagram(codeBlock, pre) {
    let mermaidCode = codeBlock.textContent.trim();
    const originalCode = mermaidCode; // Keep original for error reporting
    
    // Sanitize the code to fix common issues
    mermaidCode = sanitizeMermaidCode(mermaidCode);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper mermaid-wrapper';
    
    // Auto-add LR direction for flowcharts if not specified
    // This makes subgraphs flow left-to-right horizontally
    const isFlowchart = /^\s*(graph|flowchart)/i.test(mermaidCode);
    const hasDirection = /^\s*(graph|flowchart)\s+(TB|TD|BT|RL|LR)/i.test(mermaidCode);
    
    if (isFlowchart && !hasDirection) {
        // Insert LR direction after graph/flowchart keyword
        mermaidCode = mermaidCode.replace(/^\s*(graph|flowchart)\s*/i, '$1 LR\n');
    }
    
    // Create header (collapsible like regular code blocks)
    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.style.cursor = 'pointer';
    
    const headerLeft = document.createElement('div');
    headerLeft.className = 'code-block-header-left';
    headerLeft.style.display = 'flex';
    headerLeft.style.alignItems = 'center';
    headerLeft.style.gap = '0.5rem';
    
    const langLabel = document.createElement('span');
    langLabel.className = 'code-language';
    langLabel.textContent = 'MERMAID';
    
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'code-block-toggle-icon';
    toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
    toggleIcon.title = 'Collapse/expand';
    
    headerLeft.appendChild(langLabel);
    headerLeft.appendChild(toggleIcon);
    
    // Create button group
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'code-button-group';
    
    // Add view source button
    const viewSourceBtn = document.createElement('button');
    viewSourceBtn.className = 'code-copy-btn';
    viewSourceBtn.innerHTML = '<i class="fas fa-code"></i> Source';
    viewSourceBtn.title = 'Toggle source code';
    
    // Add copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
    copyBtn.title = 'Copy mermaid code';
    
    // Add download SVG button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'code-copy-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> SVG';
    downloadBtn.title = 'Download as SVG';
    
    buttonGroup.appendChild(viewSourceBtn);
    buttonGroup.appendChild(copyBtn);
    buttonGroup.appendChild(downloadBtn);
    
    header.appendChild(headerLeft);
    header.appendChild(buttonGroup);
    
    // Body wrapper for collapse
    const bodyWrap = document.createElement('div');
    bodyWrap.className = 'code-block-body';
    
    // Create diagram container
    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'mermaid-diagram';
    
    // Create source code container (hidden by default)
    const sourceContainer = document.createElement('div');
    sourceContainer.className = 'mermaid-source';
    sourceContainer.style.display = 'none';
    const sourceCode = document.createElement('pre');
    const sourceCodeBlock = document.createElement('code');
    sourceCodeBlock.className = 'language-mermaid';
    sourceCodeBlock.textContent = mermaidCode;
    sourceCode.appendChild(sourceCodeBlock);
    sourceContainer.appendChild(sourceCode);
    
    // Apply syntax highlighting to source
    if (typeof hljs !== 'undefined') {
        hljs.highlightElement(sourceCodeBlock);
    }
    
    bodyWrap.appendChild(diagramContainer);
    bodyWrap.appendChild(sourceContainer);
    
    wrapper.appendChild(header);
    wrapper.appendChild(bodyWrap);
    
    header.addEventListener('click', (e) => {
        if (e.target.closest('.code-button-group')) return;
        toggleCodeBlock(wrapper, bodyWrap, toggleIcon);
    });
    
    // Generate unique ID for mermaid
    const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
    diagramContainer.id = id;
    
    try {
        // Re-initialize mermaid with current theme before rendering
        mermaid.initialize(getMermaidConfig());
        
        // Render the mermaid diagram
        const { svg } = await mermaid.render(id + '-svg', mermaidCode);
        diagramContainer.innerHTML = svg;
        
        // Get the SVG element
        const svgElement = diagramContainer.querySelector('svg');
        
        if (svgElement) {
            // SIMPLIFIED APPROACH: Don't mess with SVG dimensions
            // Let mermaid's rendered SVG keep its natural dimensions
            // This is the most reliable way to ensure full height rendering
            
            // Wrap the SVG in an inner container for transform operations
            const svgWrapper = document.createElement('div');
            svgWrapper.className = 'mermaid-svg-wrapper';
            
            // Move SVG into wrapper
            svgElement.parentNode.insertBefore(svgWrapper, svgElement);
            svgWrapper.appendChild(svgElement);
            
            // Get the natural dimensions from mermaid's rendered SVG
            const svgWidth = svgElement.getBoundingClientRect().width || svgElement.clientWidth;
            const svgHeight = svgElement.getBoundingClientRect().height || svgElement.clientHeight;
            
            // Get the container width (minus padding)
            const containerWidth = diagramContainer.clientWidth - (2 * 32); // 2rem padding on each side
            
            // Scale the diagram to take up 70% of container width if it's smaller
            const targetWidth = containerWidth * 0.7;
            let initialScale = 1;
            
            if (svgWidth > 0 && svgWidth < targetWidth) {
                initialScale = targetWidth / svgWidth;
                // Cap the scale to avoid making tiny diagrams huge
                initialScale = Math.min(initialScale, 2.5);
            }
            
            // Apply initial scale if needed
            if (initialScale !== 1) {
                svgWrapper.style.transform = `scale(${initialScale})`;
                svgWrapper.style.transformOrigin = 'center center';
            }
            
            console.log('SVG dimensions:', svgWidth, 'x', svgHeight, 'Initial scale:', initialScale);
            
            // Ensure viewBox is set for proper scaling
            if (!svgElement.hasAttribute('viewBox')) {
                const bbox = svgElement.getBBox();
                svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
            }
            
            // Fix color contrast issues
            const containerBg = window.getComputedStyle(diagramContainer).backgroundColor;
            fixSvgColors(svgElement, containerBg);
            
            // Add zoom controls for all diagrams
            const zoomControls = document.createElement('div');
            zoomControls.className = 'mermaid-zoom-controls';
            zoomControls.innerHTML = `
                <button class="zoom-btn zoom-in" title="Zoom in"><i class="fas fa-search-plus"></i></button>
                <button class="zoom-btn zoom-out" title="Zoom out"><i class="fas fa-search-minus"></i></button>
                <button class="zoom-btn zoom-reset" title="Reset zoom"><i class="fas fa-undo"></i></button>
            `;
            diagramContainer.appendChild(zoomControls);
            
            let currentZoom = initialScale; // Start with the initial scale
            let panX = 0;
            let panY = 0;
            const zoomStep = 0.2;
            let isPanning = false;
            let startX = 0;
            let startY = 0;
            
            // Set default cursor to grab
            diagramContainer.style.cursor = 'grab';
            
            // Update transform with both zoom and pan
            // Apply to the wrapper, not the SVG directly
            function updateTransform() {
                svgWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
                svgWrapper.style.transformOrigin = 'center center';
            }
            
            // Zoom controls
            zoomControls.querySelector('.zoom-in').addEventListener('click', () => {
                currentZoom = Math.min(3, currentZoom + zoomStep);
                updateTransform();
            });
            
            zoomControls.querySelector('.zoom-out').addEventListener('click', () => {
                currentZoom = Math.max(0.5, currentZoom - zoomStep);
                updateTransform();
            });
            
            zoomControls.querySelector('.zoom-reset').addEventListener('click', () => {
                currentZoom = initialScale; // Reset to initial scale, not 1
                panX = 0;
                panY = 0;
                updateTransform();
            });
            
            // Pan functionality with mouse
            diagramContainer.addEventListener('mousedown', (e) => {
                // Don't pan if clicking on a link or button
                if (e.target.tagName === 'A' || e.target.closest('button')) return;
                
                isPanning = true;
                startX = e.clientX - panX;
                startY = e.clientY - panY;
                diagramContainer.style.cursor = 'grabbing';
                e.preventDefault();
            });
            
            diagramContainer.addEventListener('mousemove', (e) => {
                if (!isPanning) return;
                
                panX = e.clientX - startX;
                panY = e.clientY - startY;
                updateTransform();
                e.preventDefault();
            });
            
            diagramContainer.addEventListener('mouseup', () => {
                if (isPanning) {
                    isPanning = false;
                    diagramContainer.style.cursor = 'grab';
                }
            });
            
            diagramContainer.addEventListener('mouseleave', () => {
                if (isPanning) {
                    isPanning = false;
                    diagramContainer.style.cursor = 'grab';
                }
            });
            
            // Pan with touch (mobile)
            let touchStartX = 0;
            let touchStartY = 0;
            
            diagramContainer.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    isPanning = true;
                    touchStartX = e.touches[0].clientX - panX;
                    touchStartY = e.touches[0].clientY - panY;
                    e.preventDefault();
                }
            }, { passive: false });
            
            diagramContainer.addEventListener('touchmove', (e) => {
                if (!isPanning || e.touches.length !== 1) return;
                
                panX = e.touches[0].clientX - touchStartX;
                panY = e.touches[0].clientY - touchStartY;
                updateTransform();
                e.preventDefault();
            }, { passive: false });
            
            diagramContainer.addEventListener('touchend', () => {
                isPanning = false;
            });
            
            // Mouse wheel zoom
            diagramContainer.addEventListener('wheel', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const delta = -Math.sign(e.deltaY) * 0.1;
                    currentZoom = Math.min(3, Math.max(0.5, currentZoom + delta));
                    updateTransform();
                }
            }, { passive: false });
        }
        
        diagramContainer.classList.add('rendered');
        
        // Setup button handlers
        let showingSource = false;
        viewSourceBtn.addEventListener('click', () => {
            showingSource = !showingSource;
            if (showingSource) {
                diagramContainer.style.display = 'none';
                sourceContainer.style.display = 'block';
                viewSourceBtn.innerHTML = '<i class="fas fa-eye"></i> Diagram';
            } else {
                diagramContainer.style.display = 'flex';
                sourceContainer.style.display = 'none';
                viewSourceBtn.innerHTML = '<i class="fas fa-code"></i> Source';
            }
            requestAnimationFrame(() => remeasureAncestorSections(wrapper));
        });
        
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(mermaidCode).then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                    copyBtn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        });
        
        downloadBtn.addEventListener('click', () => {
            const svgData = diagramContainer.innerHTML;
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mermaid-diagram.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        
        // Height is measured after this wrapper is attached to the DOM.
        
    } catch (error) {
        console.error('Mermaid rendering error:', error);
        
        // Extract more detailed error information
        let errorDetails = error.message || 'Unknown error';
        let errorStack = '';
        
        if (error.stack) {
            // Try to extract relevant part of stack trace
            const stackLines = error.stack.split('\n').slice(0, 3);
            errorStack = stackLines.join('\n');
        }
        
        // Check if sanitization was applied
        const wasSanitized = originalCode !== mermaidCode;
        
        // Check for common mermaid syntax issues
        let hints = [];
        if (errorDetails.includes('id')) {
            hints.push('• Check that all node IDs are valid (alphanumeric, underscores, hyphens)');
            hints.push('• Avoid special characters in node IDs');
        }
        if (originalCode.includes('??') || /[^\x00-\x7F]/.test(originalCode)) {
            hints.push('• Special Unicode characters were automatically converted');
            hints.push('• Some characters may have been replaced with ASCII equivalents');
        }
        if (originalCode.includes('<br/>') || originalCode.includes('<br>')) {
            hints.push('• Multiple line breaks in labels can cause issues');
            hints.push('• Consider simplifying node labels');
        }
        if (wasSanitized) {
            hints.push('• Code was automatically sanitized but still failed to render');
            hints.push('• Check the sanitized version below for remaining issues');
        }
        
        const hintsHtml = hints.length > 0 ? `
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; text-align: left;">
                <strong style="color: var(--primary-color);">Potential Issues:</strong>
                <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-muted);">
                    ${hints.join('<br/>')}
                </div>
            </div>
        ` : '';
        
        diagramContainer.innerHTML = `
            <div class="mermaid-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to render Mermaid diagram</p>
                <pre style="max-width: 90%; overflow-x: auto;">${errorDetails}</pre>
                ${hintsHtml}
                ${wasSanitized ? `
                    <details style="margin-top: 1rem; text-align: left; max-width: 90%;">
                        <summary style="cursor: pointer; color: var(--primary-color); font-weight: 600;">View sanitized code (what was attempted)</summary>
                        <pre style="margin-top: 0.5rem; white-space: pre-wrap; font-size: 0.75rem; background: rgba(0,255,0,0.05); padding: 1rem; border-radius: 4px; overflow-x: auto;">${escapeHtml(mermaidCode)}</pre>
                    </details>
                ` : ''}
                <details style="margin-top: 1rem; text-align: left; max-width: 90%;">
                    <summary style="cursor: pointer; color: var(--primary-color); font-weight: 600;">View original code</summary>
                    <pre style="margin-top: 0.5rem; white-space: pre-wrap; font-size: 0.75rem; background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 4px; overflow-x: auto;">${escapeHtml(originalCode)}</pre>
                </details>
                ${errorStack ? `
                    <details style="margin-top: 0.5rem; text-align: left; max-width: 90%;">
                        <summary style="cursor: pointer; color: var(--text-muted); font-size: 0.875rem;">Stack trace</summary>
                        <pre style="margin-top: 0.5rem; font-size: 0.7rem; color: var(--text-muted); white-space: pre-wrap;">${escapeHtml(errorStack)}</pre>
                    </details>
                ` : ''}
            </div>
        `;
        diagramContainer.classList.add('error');
        // Height is measured after this wrapper is attached to the DOM.
    }
    
    return wrapper;
}

/**
 * Escapes HTML to prevent XSS in error messages
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Remeasures the expanded section-body chain after dynamic content changes.
 * This prevents mermaid diagrams from being clipped by stale parent max-heights.
 * @param {HTMLElement} element - Element inside a section that changed height
 */
function remeasureAncestorSections(element) {
    let currentBody = element.closest('.md-section-body');

    while (currentBody) {
        const section = currentBody.closest('.md-section');
        if (!section || section.classList.contains('collapsed')) break;

        currentBody.style.maxHeight = 'none';
        const measuredHeight = currentBody.scrollHeight;
        currentBody.dataset.measuredHeight = String(measuredHeight);
        currentBody.style.maxHeight = measuredHeight + 'px';

        const parentSection = section.parentElement ? section.parentElement.closest('.md-section') : null;
        currentBody = parentSection ? parentSection.querySelector(':scope > .md-section-body') : null;
    }
}

/**
 * Enhances all code blocks with syntax highlighting, buttons, and comment controls
 * @param {HTMLElement} mdEl - The markdown content element
 */
export function enhanceCodeBlocks(mdEl) {
    const codeBlocks = Array.from(mdEl.querySelectorAll('pre code'));
    
    codeBlocks.forEach(async (block) => {
        // Check if this is a mermaid block
        const languageClass = Array.from(block.classList).find(cls => cls.startsWith('language-'));
        const language = languageClass ? languageClass.replace('language-', '') : 'text';
        
        const pre = block.parentElement;
        
        // Handle mermaid diagrams
        if (language === 'mermaid' && typeof mermaid !== 'undefined') {
            const wrapper = await renderMermaidDiagram(block, pre);
            pre.parentNode.replaceChild(wrapper, pre);
            // Mermaid wrapper is rendered off-DOM, so measure height after insertion.
            const bodyWrap = wrapper.querySelector('.code-block-body');
            if (bodyWrap) {
                requestAnimationFrame(() => {
                    const measuredHeight = bodyWrap.scrollHeight;
                    bodyWrap.dataset.measuredHeight = String(measuredHeight);
                    bodyWrap.style.maxHeight = measuredHeight + 'px';
                    remeasureAncestorSections(wrapper);
                });
            }
            return;
        }
        
        // Apply syntax highlighting for non-mermaid blocks
        hljs.highlightElement(block);
        
        // Wrap comment-only lines for proper collapsing
        collapseCommentLines(block);
        
        // Check if code block has any comments
        const hasComments = block.querySelectorAll('.hljs-comment').length > 0;
        
        // Wrap code block with header
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        
        // Create header with language, toggle icon, and buttons
        const header = document.createElement('div');
        header.className = 'code-block-header';
        header.style.cursor = 'pointer';
        
        const headerLeft = document.createElement('div');
        headerLeft.className = 'code-block-header-left';
        headerLeft.style.display = 'flex';
        headerLeft.style.alignItems = 'center';
        headerLeft.style.gap = '0.5rem';
        
        const langLabel = document.createElement('span');
        langLabel.className = 'code-language';
        langLabel.textContent = language.toUpperCase();
        
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'code-block-toggle-icon';
        toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
        toggleIcon.title = 'Collapse/expand code block';
        
        headerLeft.appendChild(langLabel);
        headerLeft.appendChild(toggleIcon);
        
        // Create button group container
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'code-button-group';
        
        // Only add toggle comments button if comments exist
        if (hasComments) {
            const toggleCommentsBtn = createToggleCommentsButton(wrapper);
            buttonGroup.appendChild(toggleCommentsBtn);
        }
        
        // Always add copy button
        const copyBtn = createCopyButton(block);
        buttonGroup.appendChild(copyBtn);
        
        header.appendChild(headerLeft);
        header.appendChild(buttonGroup);
        
        // Body wrapper for collapse animation (like md-section-body)
        const bodyWrap = document.createElement('div');
        bodyWrap.className = 'code-block-body';
        
        // Insert wrapper before pre, then move pre into bodyWrap, then bodyWrap into wrapper
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(bodyWrap);
        bodyWrap.appendChild(pre);
        
        // Measure and set initial height for collapse animation
        const measuredHeight = bodyWrap.scrollHeight;
        bodyWrap.dataset.measuredHeight = String(measuredHeight);
        bodyWrap.style.maxHeight = measuredHeight + 'px';
        
        header.addEventListener('click', (e) => {
            if (e.target.closest('.code-button-group')) return;
            toggleCodeBlock(wrapper, bodyWrap, toggleIcon);
        });
    });
}

/**
 * Toggles a code block's collapsed state
 * @param {HTMLElement} wrapper - The code-block-wrapper element
 * @param {HTMLElement} bodyWrap - The code-block-body element
 * @param {HTMLElement} toggleIcon - The chevron icon span
 */
function toggleCodeBlock(wrapper, bodyWrap, toggleIcon) {
    const isCollapsed = wrapper.classList.contains('collapsed');
    if (isCollapsed) {
        wrapper.classList.remove('collapsed');
        const measuredHeight = bodyWrap.dataset.measuredHeight || '5000';
        bodyWrap.style.maxHeight = measuredHeight + 'px';
        if (toggleIcon) toggleIcon.classList.remove('collapsed');
    } else {
        wrapper.classList.add('collapsed');
        bodyWrap.style.maxHeight = '0';
        if (toggleIcon) toggleIcon.classList.add('collapsed');
    }
}

/**
 * Creates a copy button for code blocks
 * @param {HTMLElement} block - The code block element
 * @returns {HTMLElement} The copy button element
 */
function createCopyButton(block) {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
    copyBtn.title = 'Copy to clipboard';
    
    copyBtn.addEventListener('click', () => {
        const code = block.textContent;
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    });
    
    return copyBtn;
}

/**
 * Creates a copy-as-markdown button for code blocks
 * @param {HTMLElement} block - The code block element
 * @param {string} language - The code language
 * @returns {HTMLElement} The copy markdown button element
 */
function createCopyMdButton(block, language) {
    const copyMdBtn = document.createElement('button');
    copyMdBtn.className = 'code-copy-btn';
    copyMdBtn.innerHTML = '<i class="fas fa-file-code"></i> Copy MD';
    copyMdBtn.title = 'Copy as markdown';
    
    copyMdBtn.addEventListener('click', () => {
        const code = block.textContent;
        const mdText = '```' + language + '\n' + code + '\n```';
        navigator.clipboard.writeText(mdText).then(() => {
            copyMdBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyMdBtn.classList.add('copied');
            setTimeout(() => {
                copyMdBtn.innerHTML = '<i class="fas fa-file-code"></i> Copy MD';
                copyMdBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    });
    
    return copyMdBtn;
}

/**
 * Creates a toggle comments button for code blocks
 * @param {HTMLElement} wrapper - The code block wrapper element
 * @returns {HTMLElement} The toggle comments button element
 */
function createToggleCommentsButton(wrapper) {
    const toggleCommentsBtn = document.createElement('button');
    toggleCommentsBtn.className = 'code-copy-btn code-toggle-comments';
    toggleCommentsBtn.innerHTML = '<i class="fas fa-eye"></i> Comments';
    toggleCommentsBtn.title = 'Toggle comments visibility';
    
    toggleCommentsBtn.addEventListener('click', () => {
        const isHidden = wrapper.classList.contains('hide-comments');
        
        // Lock the width on first toggle to prevent width changes
        if (!wrapper.style.width) {
            const currentWidth = wrapper.offsetWidth;
            wrapper.style.width = currentWidth + 'px';
        }
        
        if (!isHidden) {
            // Hiding comments with CSS transition
            wrapper.classList.add('hide-comments');
            toggleCommentsBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Comments';
            toggleCommentsBtn.classList.add('active');
        } else {
            // Showing comments with CSS transition
            wrapper.classList.remove('hide-comments');
            toggleCommentsBtn.innerHTML = '<i class="fas fa-eye"></i> Comments';
            toggleCommentsBtn.classList.remove('active');
        }
    });
    
    return toggleCommentsBtn;
}
