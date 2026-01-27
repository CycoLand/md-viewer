// Markdown rendering utilities
import { state } from './state.js';
import { enhanceCodeBlocks } from './codeBlockEnhancer.js';
import { buildCollapsibleSections, setupHashBasedCollapse, remeasureSection } from './collapsibleSections.js';
import { generateTOC } from './tocManager.js';


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
    const wordCount = words.length;
    
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
            <h1 class="document-title">${file.name}</h1>
            <div class="document-meta">
                <span class="meta-item"><i class="fas fa-font"></i> ${wordCount.toLocaleString()} words</span>
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
    const sanitizedHtml = DOMPurify.sanitize(html);
    
    // Get current file info for metadata
    const file = state.currentFileId ? state.files.get(state.currentFileId) : null;
    
    // Create document header with metadata
    const headerHtml = createDocumentHeader(file, content);
    
    mdEl.innerHTML = headerHtml + sanitizedHtml;
    
    if (state.currentFileId) {
        state.renderCache.set(state.currentFileId, sanitizedHtml);
    }

    // Generate unique IDs for headings
    generateHeadingIds(mdEl);

    // Enhance code blocks with buttons and syntax highlighting
    enhanceCodeBlocks(mdEl);

    // Build collapsible sections
    buildCollapsibleSections(mdEl);
    
    // Set initial heights for section bodies
    mdEl.querySelectorAll('.md-section-body').forEach(b => {
        b.style.maxHeight = b.scrollHeight + 'px';
    });

    // Handle hash-based navigation
    setupHashBasedCollapse(mdEl);

    // Generate table of contents
    if (tocEl) {
        const headings = Array.from(mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        generateTOC(mdEl, tocEl);
    }

    // Setup filter toggle buttons
    setupFilterToggles(mdEl);
    
    // Apply current filters
    applyContentFilters(mdEl);

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

    mdEl.innerHTML = cached;

    // Generate unique IDs for headings
    generateHeadingIds(mdEl);

    // Enhance code blocks
    enhanceCodeBlocks(mdEl);

    // Build collapsible sections
    buildCollapsibleSections(mdEl);
    
    // Set initial heights for section bodies
    mdEl.querySelectorAll('.md-section-body').forEach(b => {
        b.style.maxHeight = b.scrollHeight + 'px';
    });

    // Generate table of contents
    if (tocEl) {
        const headings = Array.from(mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        generateTOC(mdEl, tocEl);
    }
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
