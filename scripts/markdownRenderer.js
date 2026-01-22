// Markdown rendering utilities
import { state } from './state.js';
import { enhanceCodeBlocks } from './codeBlockEnhancer.js';
import { buildCollapsibleSections, setupHashBasedCollapse, remeasureSection } from './collapsibleSections.js';
import { generateTOC } from './tocManager.js';

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
    if (tocEl) tocEl.style.display = 'block';
    
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
    const html = marked.parse(content);
    const sanitizedHtml = DOMPurify.sanitize(html);
    mdEl.innerHTML = sanitizedHtml;
    
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
