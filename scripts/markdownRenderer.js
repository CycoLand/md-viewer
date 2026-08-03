// Markdown rendering utilities
import { state } from './state.js';
import { enhanceCodeBlocks } from './codeBlockEnhancer.js';
import { buildCollapsibleSections, remeasureSection } from './collapsibleSections.js';
import { generateTOC } from './tocManager.js';
import { setupSortableTables } from './sortableTables.js';
import { enhanceListCards } from './listCardEnhancer.js';
import { enhanceCheckmarkLists } from './checkmarkLists.js';
import { applyHighlights, clearHighlightUI } from './highlights.js';
import { annotateAcronyms } from './acronyms.js';
import { stripHeadingInlineMarkdown } from './markdownText.js';

function shouldUsePlainTextHeadings() {
    return state.settings.plainTextHeadings !== false;
}

function prepareBodyHtml(sanitizedHtml) {
    const bodyContainer = document.createElement('div');
    bodyContainer.innerHTML = sanitizedHtml;
    if (shouldUsePlainTextHeadings()) {
        stripHeadingInlineMarkdown(bodyContainer);
    }
    return bodyContainer.innerHTML;
}

/**
 * Re-render the current document (e.g. after a display setting changes).
 */
export function refreshRenderedView() {
    if (!state.currentFileId || state.rawMode) return;

    const file = state.files.get(state.currentFileId);
    if (!file) return;

    showRenderedContent(file.content);
}


/**
 * Creates a document header with metadata
 * @param {Object} file - The file object with metadata
 * @param {string} content - The markdown content for counting
 * @returns {string} HTML string for the document header
 */
function createDocumentHeader(file, content) {
    if (!file) return '';
    
    // Calculate word count (split by whitespace and filter non-empty)
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    const readTime = Math.ceil(words.length / 238);
    
    // Calculate line count
    const lineCount = content.split('\n').length;
    
    // Format date
    const date = new Date(file.modified);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    return `
        <div class="document-header">
            <div class="document-header-top">
                <div class="document-title">${file.name}</div>
                <button class="btn btn-icon document-menu-btn" id="document-menu-btn" title="Document Options">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="document-menu-dropdown" id="document-menu-dropdown">
                    <button class="menu-item" data-action="view-rendered">
                        <i class="fas fa-eye"></i> View Rendered
                    </button>
                    <button class="menu-item" data-action="view-raw">
                        <i class="fas fa-code"></i> View Raw
                    </button>
                    <button class="menu-item" data-action="view-pages">
                        <i class="fas fa-book-open"></i> View Pages
                    </button>
                    <div class="menu-separator"></div>
                    <button class="menu-item" data-action="copy-markdown">
                        <i class="fas fa-copy"></i> Copy as Markdown
                    </button>
                    <button class="menu-item" data-action="export-html">
                        <i class="fas fa-download"></i> Export HTML
                    </button>
                </div>
            </div>
            <div class="document-meta">
                <span class="meta-item"><i class="fas fa-clock"></i> ${readTime} min read</span>
                <span class="meta-separator">•</span>
                <span class="meta-item"><i class="fas fa-list-ol"></i> ${lineCount.toLocaleString()} lines</span>
                <span class="meta-separator">•</span>
                <span class="meta-item"><i class="fas fa-calendar"></i> ${formattedDate}</span>
                <span class="meta-separator">•</span>
                <span class="filter-label">Filter</span>
                <div class="filter-button-group">
                    <button class="filter-toggle" data-filter="emojis" title="Toggle Emoji Filter">
                        Emojis
                    </button>
                    <button class="filter-toggle" data-filter="hr" title="Toggle Horizontal Rule Filter">
                        HRs
                    </button>
                </div>
            </div>
        </div>
        <hr class="document-separator">
    `;
}

/**
 * Renders markdown content in the viewer
 * @param {string} content - The markdown content to render
 */
export function showRenderedContent(content) {
    const mdEl = document.getElementById('markdown-content');
    const rawEl = document.getElementById('raw-content');
    const tocEl = document.getElementById('toc');
    
    mdEl.style.display = 'block';
    rawEl.style.display = 'none';
    // Remove inline style to let CSS media query handle TOC visibility
    if (tocEl) tocEl.style.display = '';
    
    // Strip H1 if it's on the first or second line (to avoid repetition with document header)
    const lines = content.split('\n');
    let contentToRender = content;
    
    // Check first line
    if (lines[0] && /^#\s+.+/.test(lines[0])) {
        // Remove the H1 line
        contentToRender = lines.slice(1).join('\n');
    } 
    // Check second line (in case first line is empty)
    else if (lines[1] && /^#\s+.+/.test(lines[1])) {
        // Remove the H1 line but keep the first line
        contentToRender = lines[0] + '\n' + lines.slice(2).join('\n');
    }
    
    // Configure marked with syntax highlighting
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) {}
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    // Parse and sanitize markdown
    const html = marked.parse(contentToRender);
    const sanitizedHtml = DOMPurify.sanitize(html, {
        ADD_ATTR: ['disabled'], // Allow disabled attribute so we can control it
        ADD_TAGS: ['input'] // Ensure input tags are allowed
    });

    const displayHtml = prepareBodyHtml(sanitizedHtml);
    
    // Get current file info for metadata
    const file = state.currentFileId ? state.files.get(state.currentFileId) : null;
    
    // Create document header with metadata
    const headerHtml = createDocumentHeader(file, content);
    
    mdEl.innerHTML = headerHtml + displayHtml;
    
    if (state.currentFileId) {
        state.renderCache.set(state.currentFileId, sanitizedHtml);
    }

    // Generate unique IDs for headings
    generateHeadingIds(mdEl);

    // Enhance code blocks with buttons and syntax highlighting
    enhanceCodeBlocks(mdEl);

    // Convert label: value lists to cards (before section height measurement)
    enhanceListCards(mdEl);

    // Build collapsible sections
    buildCollapsibleSections(mdEl);
    
    // Measure and set initial heights for section bodies based on actual content
    mdEl.querySelectorAll('.md-section-body').forEach(b => {
        // Temporarily set to auto to measure true height
        b.style.maxHeight = 'none';
        const height = b.scrollHeight;
        // Store the measured height as a data attribute
        b.dataset.measuredHeight = height;
        // Set to the measured height for smooth animations
        b.style.maxHeight = height + 'px';
    });


    // Generate table of contents
    if (tocEl) {
        const headings = Array.from(mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        generateTOC(mdEl, tocEl);
    }

    // Setup filter toggle buttons
    setupFilterToggles(mdEl);
    
    // Apply current filters
    applyContentFilters(mdEl);

    // Setup sortable table headers
    setupSortableTables(mdEl);

    // Setup document menu
    setupDocumentMenu(mdEl);

    // Setup task list checkboxes (for interactive checking)
    setupTaskListCheckboxes(mdEl);

    // Replace native checkbox / ✅ with theme-styled custom check symbol
    enhanceCheckmarkLists(mdEl);

    // Mark external links with an indicator
    markExternalLinks(mdEl);

    // Re-apply persisted highlights
    applyHighlights(mdEl);

    // Wrap ALL-CAPS acronym-looking tokens for hover/click definitions
    annotateAcronyms(mdEl);

}

/**
 * Rebuilds content from cache (for pagination, etc.)
 */
export function rebuildFromCache() {
    if (!state.currentFileId) return;
    
    const mdEl = document.getElementById('markdown-content');
    const tocEl = document.getElementById('toc');
    const cached = state.renderCache.get(state.currentFileId);
    
    if (!cached) return;

    mdEl.innerHTML = prepareBodyHtml(cached);

    // Generate unique IDs for headings
    generateHeadingIds(mdEl);

    // Enhance code blocks
    enhanceCodeBlocks(mdEl);

    // Convert label: value lists to cards (before section height measurement)
    enhanceListCards(mdEl);

    // Build collapsible sections
    buildCollapsibleSections(mdEl);
    
    // Measure and set initial heights for section bodies based on actual content
    mdEl.querySelectorAll('.md-section-body').forEach(b => {
        // Temporarily set to auto to measure true height
        b.style.maxHeight = 'none';
        const height = b.scrollHeight;
        // Store the measured height as a data attribute
        b.dataset.measuredHeight = height;
        // Set to the measured height for smooth animations
        b.style.maxHeight = height + 'px';
    });


    // Generate table of contents
    if (tocEl) {
        const headings = Array.from(mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        generateTOC(mdEl, tocEl);
    }

    // Setup task list checkboxes
    setupTaskListCheckboxes(mdEl);

    // Replace native checkbox / ✅ with theme-styled custom check symbol
    enhanceCheckmarkLists(mdEl);
    
    // Mark external links with an indicator
    markExternalLinks(mdEl);

    // Setup sortable table headers (after rebuild)
    setupSortableTables(mdEl);

    // Re-apply persisted highlights
    applyHighlights(mdEl);

    // Wrap ALL-CAPS acronym-looking tokens for hover/click definitions
    annotateAcronyms(mdEl);
}

/**
 * Generates unique IDs for all headings
 * @param {HTMLElement} mdEl - The markdown content element
 */
function generateHeadingIds(mdEl) {
    const headings = mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const usedIds = new Set();
    
    headings.forEach(h => {
        let base = (h.id || h.textContent || '').toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');
        if (!base) base = 'section';
        
        let id = base;
        let i = 1;
        while (usedIds.has(id)) {
            id = `${base}-${i++}`;
        }
        h.id = id;
        usedIds.add(id);
    });
}

/**
 * Shows raw markdown content
 * @param {string} content - The markdown content to display
 */
export function showRawContent(content) {
    const mdEl = document.getElementById('markdown-content');
    const rawEl = document.getElementById('raw-content');
    const tocEl = document.getElementById('toc');

    mdEl.style.display = 'none';
    rawEl.style.display = 'block';
    if (tocEl) tocEl.style.display = 'none';

    clearHighlightUI();
    rawEl.textContent = content;
}

/**
 * Sets up event handlers for filter toggle buttons
 * @param {HTMLElement} mdEl - The markdown content element
 */
function setupFilterToggles(mdEl) {
    const filterButtons = mdEl.querySelectorAll('.filter-toggle');
    filterButtons.forEach(btn => {
        const filterType = btn.getAttribute('data-filter');
        
        // Set initial state
        if (state.contentFilters[filterType]) {
            btn.classList.add('active');
        }
        
        // Add click handler
        btn.addEventListener('click', () => {
            state.contentFilters[filterType] = !state.contentFilters[filterType];
            btn.classList.toggle('active');
            
            // Re-render from cache to restore original content, then apply filters
            reapplyFilters();
        });
    });
}

/**
 * Re-renders content from cache and applies filters
 */
function reapplyFilters() {
    if (!state.currentFileId) return;
    
    const file = state.files.get(state.currentFileId);
    if (!file) return;
    
    // Re-render from original content
    showRenderedContent(file.content);
}

/**
 * Applies content filters based on current state
 * @param {HTMLElement} mdEl - The markdown content element
 */
function applyContentFilters(mdEl) {
    // Filter emojis
    if (state.contentFilters.emojis) {
        const textNodes = getTextNodes(mdEl);
        textNodes.forEach(node => {
            // Remove emojis using regex (matches most common emoji ranges)
            node.textContent = node.textContent.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        });
    }
    
    // Filter horizontal rules
    if (state.contentFilters.hr) {
        mdEl.querySelectorAll('hr:not(.document-separator)').forEach(hr => {
            hr.style.display = 'none';
        });
    } else {
        mdEl.querySelectorAll('hr:not(.document-separator)').forEach(hr => {
            hr.style.display = '';
        });
    }
    
    // Regenerate TOC after filters to reflect any changes
    const tocEl = document.getElementById('toc');
    if (tocEl) {
        const headings = Array.from(mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        generateTOC(mdEl, tocEl);
    }
}

/**
 * Gets all text nodes within an element
 * @param {HTMLElement} element - The element to search
 * @returns {Array<Node>} Array of text nodes
 */
function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                // Skip text nodes in script, style, or the document header
                if (node.parentElement.closest('script, style, .document-header')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );
    
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    return textNodes;
}


/**
 * Sets up the document menu for view mode switching and actions
 * @param {HTMLElement} mdEl - The markdown content element
 */
function setupDocumentMenu(mdEl) {
    const menuBtn = mdEl.querySelector('#document-menu-btn');
    const menuDropdown = mdEl.querySelector('#document-menu-dropdown');
    const menuItems = mdEl.querySelectorAll('.menu-item');
    
    if (!menuBtn || !menuDropdown) return;
    
    // Toggle menu on button click
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show');
        }
    });
    
    // Handle menu item clicks
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            menuDropdown.classList.remove('show');
            
            // Import necessary modules
            import('./fileManager.js').then(({ FileManager }) => {
                import('./paginationManager.js').then((paginationModule) => {
                    // Get pagination manager instance from main.js scope
                    const paginationActive = document.querySelector('.page-navigation')?.classList.contains('active') || false;
                    
                    switch (action) {
                        case 'view-rendered':
                            // Turn off raw mode and pagination
                            if (state.rawMode) {
                                state.rawMode = false;
                                const file = FileManager.getFile(state.currentFileId);
                                if (file) FileManager.showFile(file);
                            }
                            if (paginationActive) {
                                // Trigger pagination toggle
                                document.dispatchEvent(new CustomEvent('togglePagination'));
                            }
                            break;
                            
                        case 'view-raw':
                            // Turn on raw mode, turn off pagination
                            if (paginationActive) {
                                document.dispatchEvent(new CustomEvent('togglePagination'));
                            }
                            if (!state.rawMode) {
                                state.rawMode = true;
                                const file = FileManager.getFile(state.currentFileId);
                                if (file) FileManager.showFile(file);
                            }
                            break;
                            
                        case 'view-pages':
                            // Turn off raw mode, turn on pagination
                            if (state.rawMode) {
                                state.rawMode = false;
                                const file = FileManager.getFile(state.currentFileId);
                                if (file) FileManager.showFile(file);
                            }
                            if (!paginationActive) {
                                document.dispatchEvent(new CustomEvent('togglePagination'));
                            }
                            break;
                            
                        case 'copy-markdown':
                            FileManager.copyCurrentFileAsMarkdown();
                            break;

                        case 'export-html':
                            FileManager.exportCurrentFileAsHtml();
                            break;
                    }
                });
            });
        });
    });
}

/**
 * Sets up interactive task list checkboxes
 * @param {HTMLElement} mdEl - The markdown content element
 */
function setupTaskListCheckboxes(mdEl) {
    // Find all list items that contain checkboxes
    const allListItems = mdEl.querySelectorAll('li');
    
    let checkboxCount = 0;
    
    allListItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        
        checkboxCount++;
        
        // Add task-list-item class for styling
        item.classList.add('task-list-item');
        
        // Make the checkbox not disabled (marked.js might disable them)
        checkbox.disabled = false;
        
        // Wrap the text content (everything after the checkbox) in a label
        // This makes the entire text area clickable
        const textContent = [];
        let node = checkbox.nextSibling;
        
        while (node) {
            const nextNode = node.nextSibling;
            if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                textContent.push(node);
            }
            node = nextNode;
        }
        
        // Create a label wrapper for the text content
        const label = document.createElement('label');
        label.className = 'task-label';
        label.style.cursor = 'pointer';
        label.style.flex = '1';
        
        // Move text nodes into the label
        textContent.forEach(node => {
            label.appendChild(node);
        });
        
        // Insert label after checkbox
        item.appendChild(label);
        
        // Apply initial checked state styling
        if (checkbox.checked) {
            item.classList.add('checked');
        }
        
        // Add change event listener to checkbox
        checkbox.addEventListener('change', (e) => {
            console.log('Checkbox changed:', e.target.checked);
            if (e.target.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
        });
        
        // Make label clickable to toggle checkbox, but only if no text is selected
        label.addEventListener('click', (e) => {
            // Check if user is selecting text (has a selection range)
            const selection = window.getSelection();
            const hasSelection = selection && selection.toString().length > 0;
            
            // Don't toggle if user is selecting text or clicking on a link/code element
            if (hasSelection || e.target.tagName === 'A' || e.target.tagName === 'CODE') {
                return;
            }
            
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
    
    console.log(`Setup ${checkboxCount} interactive checkboxes with clickable labels`);
}

/**
 * Marks external links with a visual indicator
 * @param {HTMLElement} mdEl - The markdown content element
 */
function markExternalLinks(mdEl) {
    // Find all links in the markdown content
    const links = mdEl.querySelectorAll('a[href]');
    
    let externalLinkCount = 0;
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip if no href
        if (!href) return;
        
        // Determine if link is external
        // External links are:
        // - Links starting with http:// or https://
        // - Not anchor links (starting with #)
        // - Not relative links (starting with ./ or ../)
        const isExternal = /^https?:\/\//i.test(href);
        
        // Skip anchor links and relative links
        const isAnchor = href.startsWith('#');
        const isRelative = href.startsWith('./') || href.startsWith('../') || href.startsWith('/');
        
        if (isExternal && !isAnchor && !isRelative) {
            link.classList.add('external-link');
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            externalLinkCount++;
        }
    });
    
    console.log(`Marked ${externalLinkCount} external links`);
}


