/**
 * Persistent text highlights.
 * - Right-click drag to paint
 * - Click a highlight to remove
 * - Hover handles to resize
 */
import { state, STORAGE_KEY } from './state.js';

const CONTEXT_CHARS = 32;
const SKIP_SELECTOR =
    'pre, code, .document-header, .document-menu, script, style, .md-highlight-handle';

// --- Session UI state ---
let paintMode = false;
let paintAnchor = null;
let resizeState = null;

let handleStartEl = null;
let handleEndEl = null;
let handlesHighlightId = null;
let handlesHideTimer = null;

// --- File / persistence ---

function generateId() {
    return 'hl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

function getCurrentFile() {
    if (!state.currentFileId) return null;
    return state.files.get(state.currentFileId) || null;
}

function getMdEl() {
    return document.getElementById('markdown-content');
}

function ensureHighlights(file) {
    if (!Array.isArray(file.highlights)) {
        file.highlights = [];
    }
    return file.highlights;
}

function saveHighlights() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.files.values())));
    } catch (err) {
        console.error('Error saving highlights:', err);
    }
}

function fieldsFromOffsets(fullText, start, end) {
    return {
        quote: fullText.slice(start, end),
        prefix: fullText.slice(Math.max(0, start - CONTEXT_CHARS), start),
        suffix: fullText.slice(end, Math.min(fullText.length, end + CONTEXT_CHARS))
    };
}

// --- DOM text index ---

function isSkippable(el) {
    return !el || Boolean(el.closest(SKIP_SELECTOR));
}

function collectTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (!parent || isSkippable(parent)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    let n = walker.nextNode();
    while (n) {
        nodes.push(n);
        n = walker.nextNode();
    }
    return nodes;
}

function buildTextIndex(root) {
    const nodes = collectTextNodes(root);
    let fullText = '';
    const spans = [];
    for (const node of nodes) {
        const start = fullText.length;
        fullText += node.nodeValue;
        spans.push({ node, start, end: fullText.length });
    }
    return { fullText, spans };
}

function findQuoteOffset(fullText, quote, prefix = '', suffix = '') {
    if (!quote) return -1;
    if (prefix || suffix) {
        const needle = prefix + quote + suffix;
        const found = fullText.indexOf(needle);
        if (found >= 0) return found + prefix.length;
    }
    return fullText.indexOf(quote);
}

function offsetToPoint(spans, offset) {
    for (const span of spans) {
        if (offset >= span.start && offset <= span.end) {
            return { node: span.node, offset: offset - span.start };
        }
    }
    return null;
}

function pointToOffset(mdEl, x, y) {
    const caret = caretRangeFromPoint(x, y);
    if (!caret || !mdEl.contains(caret.startContainer)) return null;

    const { spans } = buildTextIndex(mdEl);
    for (const span of spans) {
        if (span.node === caret.startContainer) {
            return span.start + caret.startOffset;
        }
    }
    return null;
}

function extremeTextNode(el, wantLast) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            return node.nodeValue ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
    });
    let last = null;
    let n = walker.nextNode();
    if (!wantLast) return n;
    while (n) {
        last = n;
        n = walker.nextNode();
    }
    return last;
}

function getBlockAncestor(node, root) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (el && el !== root) {
        if (el instanceof HTMLElement) {
            const tag = el.tagName;
            if (
                /^(P|LI|H[1-6]|BLOCKQUOTE|PRE|TD|TH|DT|DD|FIGCAPTION|SUMMARY|DIV|SECTION|ARTICLE|TR)$/.test(
                    tag
                )
            ) {
                return el;
            }
            const display = getComputedStyle(el).display;
            if (
                display === 'block' ||
                display === 'list-item' ||
                display === 'table-cell' ||
                display === 'table-row' ||
                display === 'flex' ||
                display === 'grid'
            ) {
                return el;
            }
        }
        el = el.parentElement;
    }
    return root;
}

function queryHighlightMarks(root, highlightId) {
    return root.querySelectorAll(`mark.md-highlight[data-highlight-id="${highlightId}"]`);
}

function getHighlightOffsets(mdEl, highlightId) {
    const marks = queryHighlightMarks(mdEl, highlightId);
    if (!marks.length) return null;

    const firstText = extremeTextNode(marks[0], false);
    const lastText = extremeTextNode(marks[marks.length - 1], true);
    if (!firstText || !lastText) return null;

    const { fullText, spans } = buildTextIndex(mdEl);
    let start = -1;
    let end = -1;
    for (const span of spans) {
        if (span.node === firstText) start = span.start;
        if (span.node === lastText) end = span.end;
    }
    if (start < 0 || end < 0 || end <= start) return null;
    return { start, end, fullText };
}

function getHighlightClientRects(mdEl, highlightId) {
    const marks = queryHighlightMarks(mdEl, highlightId);
    const rects = [];
    marks.forEach((mark) => {
        const list = mark.getClientRects();
        for (let i = 0; i < list.length; i++) {
            const r = list[i];
            if (r.width > 0 && r.height > 0) rects.push(r);
        }
    });
    return rects;
}

// --- Selection helpers ---

function caretRangeFromPoint(x, y) {
    if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
    if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (!pos) return null;
        const range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
        return range;
    }
    return null;
}

function clearSelection() {
    window.getSelection()?.removeAllRanges();
}

function selectionInside(mdEl) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
    return mdEl.contains(sel.getRangeAt(0).commonAncestorContainer);
}

function setSelectionFromOffsets(mdEl, start, end) {
    const { spans } = buildTextIndex(mdEl);
    const a = offsetToPoint(spans, start);
    const b = offsetToPoint(spans, end);
    if (!a || !b) return;

    try {
        const range = document.createRange();
        range.setStart(a.node, a.offset);
        range.setEnd(b.node, b.offset);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } catch {
        /* ignore */
    }
}

function captureSelection(mdEl) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !selectionInside(mdEl)) return null;

    const range = sel.getRangeAt(0);
    const anchorEl =
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentElement
            : range.commonAncestorContainer;
    if (isSkippable(anchorEl)) return null;

    const quote = sel.toString();
    if (!quote?.trim()) return null;

    const { fullText, spans } = buildTextIndex(mdEl);
    if (!fullText) return null;

    let startOffset = -1;
    let endOffset = -1;
    for (const span of spans) {
        if (span.node === range.startContainer) startOffset = span.start + range.startOffset;
        if (span.node === range.endContainer) endOffset = span.start + range.endOffset;
    }

    if (startOffset < 0 || endOffset < 0 || endOffset <= startOffset) {
        const idx = fullText.indexOf(quote);
        if (idx < 0) return { quote, prefix: '', suffix: '' };
        startOffset = idx;
        endOffset = idx + quote.length;
    }

    return fieldsFromOffsets(fullText, startOffset, endOffset);
}

// --- Mark wrap / unwrap ---

function wrapRange(root, startOffset, endOffset, highlight) {
    const { spans } = buildTextIndex(root);
    if (!spans.length || startOffset >= endOffset) return false;

    const segments = [];
    for (const span of spans) {
        if (span.node.parentElement?.closest('mark.md-highlight')) continue;

        const a = Math.max(span.start, startOffset);
        const b = Math.min(span.end, endOffset);
        if (a < b) {
            segments.push({
                node: span.node,
                start: a - span.start,
                end: b - span.start
            });
        }
    }
    if (!segments.length) return false;

    // One mark per block so inline formatting (em/strong/a) stays continuous.
    const groups = [];
    for (const seg of segments) {
        const block = getBlockAncestor(seg.node, root);
        const prev = groups[groups.length - 1];
        if (prev && prev.block === block) {
            prev.segments.push(seg);
        } else {
            groups.push({ block, segments: [seg] });
        }
    }

    let wrapped = false;
    for (let g = groups.length - 1; g >= 0; g--) {
        const groupSegs = groups[g].segments;
        const first = groupSegs[0];
        const last = groupSegs[groupSegs.length - 1];
        if (!first.node.parentNode || !last.node.parentNode) continue;

        const range = document.createRange();
        try {
            range.setStart(first.node, first.start);
            range.setEnd(last.node, last.end);
        } catch {
            continue;
        }

        const mark = document.createElement('mark');
        mark.className = 'md-highlight';
        mark.dataset.highlightId = highlight.id;
        mark.title = 'Click to remove · drag handles to resize';

        try {
            range.surroundContents(mark);
            wrapped = true;
        } catch {
            try {
                mark.appendChild(range.extractContents());
                range.insertNode(mark);
                wrapped = true;
            } catch {
                /* skip invalid group */
            }
        }
    }

    return wrapped;
}

function unwrapHighlight(root, highlightId) {
    queryHighlightMarks(root, highlightId).forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
    });
}

function applyOne(mdEl, highlight) {
    if (mdEl.querySelector(`mark.md-highlight[data-highlight-id="${highlight.id}"]`)) {
        return true;
    }
    const { fullText } = buildTextIndex(mdEl);
    const start = findQuoteOffset(fullText, highlight.quote, highlight.prefix, highlight.suffix);
    if (start < 0) return false;
    return wrapRange(mdEl, start, start + highlight.quote.length, highlight);
}

// --- CRUD ---

function addHighlight({ quote, prefix, suffix }) {
    const file = getCurrentFile();
    if (!file || !quote?.trim()) return null;

    const highlights = ensureHighlights(file);
    if (
        highlights.some(
            (h) => h.quote === quote && h.prefix === (prefix || '') && h.suffix === (suffix || '')
        )
    ) {
        return null;
    }

    const highlight = {
        id: generateId(),
        quote,
        prefix: prefix || '',
        suffix: suffix || '',
        createdAt: new Date().toISOString()
    };
    highlights.push(highlight);
    saveHighlights();

    const mdEl = getMdEl();
    if (mdEl) applyOne(mdEl, highlight);
    return highlight;
}

function removeHighlight(highlightId) {
    const file = getCurrentFile();
    if (!file) return;

    const highlights = ensureHighlights(file);
    const idx = highlights.findIndex((h) => h.id === highlightId);
    if (idx === -1) return;

    highlights.splice(idx, 1);
    saveHighlights();
    hideFloatingHandles();

    const mdEl = getMdEl();
    if (mdEl) unwrapHighlight(mdEl, highlightId);
}

// --- Floating resize handles ---

function ensureFloatingHandles() {
    if (handleStartEl && handleEndEl) return;

    const makeHandle = (edge, label) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'md-highlight-handle';
        btn.dataset.edge = edge;
        btn.setAttribute('aria-label', label);
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.button !== 0 || !handlesHighlightId) return;
            beginResize(handlesHighlightId, edge);
            hideFloatingHandles();
        });
        btn.addEventListener('mouseenter', () => {
            if (handlesHideTimer) {
                clearTimeout(handlesHideTimer);
                handlesHideTimer = null;
            }
        });
        document.body.appendChild(btn);
        return btn;
    };

    handleStartEl = makeHandle('start', 'Resize highlight start');
    handleEndEl = makeHandle('end', 'Resize highlight end');
}

function positionFloatingHandles(highlightId) {
    ensureFloatingHandles();
    const mdEl = getMdEl();
    if (!mdEl || resizeState) {
        hideFloatingHandles();
        return;
    }

    const rects = getHighlightClientRects(mdEl, highlightId);
    if (!rects.length) {
        hideFloatingHandles();
        return;
    }

    handlesHighlightId = highlightId;
    const first = rects[0];
    const last = rects[rects.length - 1];

    handleStartEl.style.left = `${first.left}px`;
    handleStartEl.style.top = `${first.top + first.height / 2}px`;
    handleEndEl.style.left = `${last.right}px`;
    handleEndEl.style.top = `${last.top + last.height / 2}px`;

    handleStartEl.classList.add('is-visible');
    handleEndEl.classList.add('is-visible');
}

function hideFloatingHandles() {
    if (handlesHideTimer) {
        clearTimeout(handlesHideTimer);
        handlesHideTimer = null;
    }
    handlesHighlightId = null;
    handleStartEl?.classList.remove('is-visible');
    handleEndEl?.classList.remove('is-visible');
}

function scheduleHideFloatingHandles() {
    if (handlesHideTimer) clearTimeout(handlesHideTimer);
    handlesHideTimer = setTimeout(() => {
        handlesHideTimer = null;
        hideFloatingHandles();
    }, 180);
}

function repositionOpenHandles() {
    if (resizeState || !handlesHighlightId) return;
    positionFloatingHandles(handlesHighlightId);
}

// --- Resize ---

function beginResize(highlightId, edge) {
    const mdEl = getMdEl();
    if (!mdEl) return;

    const offsets = getHighlightOffsets(mdEl, highlightId);
    if (!offsets) return;

    hideFloatingHandles();
    unwrapHighlight(mdEl, highlightId);

    resizeState = {
        id: highlightId,
        edge,
        fixedOffset: edge === 'start' ? offsets.end : offsets.start,
        liveStart: offsets.start,
        liveEnd: offsets.end,
        fullTextLength: offsets.fullText.length
    };

    document.body.classList.add('highlight-resize-mode');
    setSelectionFromOffsets(mdEl, offsets.start, offsets.end);
}

function updateResizePreview(clientX, clientY) {
    if (!resizeState) return;
    const mdEl = getMdEl();
    if (!mdEl) return;

    const caretOffset = pointToOffset(mdEl, clientX, clientY);
    if (caretOffset == null) return;

    let start;
    let end;
    if (resizeState.edge === 'start') {
        start = Math.max(0, Math.min(caretOffset, resizeState.fixedOffset - 1));
        end = resizeState.fixedOffset;
    } else {
        start = resizeState.fixedOffset;
        end = Math.max(resizeState.fixedOffset + 1, Math.min(caretOffset, resizeState.fullTextLength));
    }

    resizeState.liveStart = start;
    resizeState.liveEnd = end;
    setSelectionFromOffsets(mdEl, start, end);
}

function restoreHighlightById(mdEl, id) {
    const file = getCurrentFile();
    const highlight = file && ensureHighlights(file).find((h) => h.id === id);
    if (mdEl && highlight) applyOne(mdEl, highlight);
}

function commitResize() {
    if (!resizeState) return;

    const { id, liveStart, liveEnd } = resizeState;
    const mdEl = getMdEl();
    document.body.classList.remove('highlight-resize-mode');
    resizeState = null;

    if (!mdEl) {
        clearSelection();
        return;
    }

    const { fullText } = buildTextIndex(mdEl);
    if (liveEnd <= liveStart || !fullText) {
        clearSelection();
        restoreHighlightById(mdEl, id);
        return;
    }

    const fields = fieldsFromOffsets(fullText, liveStart, liveEnd);
    if (!fields.quote.trim()) {
        clearSelection();
        removeHighlight(id);
        return;
    }

    const file = getCurrentFile();
    if (!file) return;

    const highlight = ensureHighlights(file).find((h) => h.id === id);
    if (!highlight) return;

    Object.assign(highlight, fields);
    saveHighlights();
    clearSelection();
    wrapRange(mdEl, liveStart, liveEnd, highlight);
}

function cancelResize() {
    if (!resizeState) return;
    const id = resizeState.id;
    document.body.classList.remove('highlight-resize-mode');
    resizeState = null;
    clearSelection();
    restoreHighlightById(getMdEl(), id);
}

// --- Paint mode ---

function exitPaintMode() {
    paintMode = false;
    paintAnchor = null;
    document.body.classList.remove('highlight-paint-mode');
}

function commitPaintHighlight() {
    const mdEl = getMdEl();
    if (!mdEl) return;
    const data = captureSelection(mdEl);
    clearSelection();
    if (data) addHighlight(data);
}

function updatePaintSelection(clientX, clientY) {
    if (!paintMode || !paintAnchor) return;
    const mdEl = getMdEl();
    if (!mdEl) return;

    const end = caretRangeFromPoint(clientX, clientY);
    if (!end) return;
    if (!mdEl.contains(end.startContainer) || !mdEl.contains(paintAnchor.startContainer)) return;

    const sel = window.getSelection();
    if (!sel) return;

    try {
        const range = document.createRange();
        if (paintAnchor.compareBoundaryPoints(Range.START_TO_START, end) <= 0) {
            range.setStart(paintAnchor.startContainer, paintAnchor.startOffset);
            range.setEnd(end.startContainer, end.startOffset);
        } else {
            range.setStart(end.startContainer, end.startOffset);
            range.setEnd(paintAnchor.startContainer, paintAnchor.startOffset);
        }
        sel.removeAllRanges();
        sel.addRange(range);
    } catch {
        /* ignore transient invalid ranges */
    }
}

// --- Public API ---

/** Clear highlight interaction UI (e.g. when switching to raw mode). */
export function clearHighlightUI() {
    hideFloatingHandles();
    exitPaintMode();
    if (resizeState) cancelResize();
}

/** Re-apply persisted highlights after a document render. */
export function applyHighlights(mdEl) {
    if (!mdEl) return;

    const file = getCurrentFile();
    if (!file) return;

    const highlights = ensureHighlights(file);
    const { fullText } = buildTextIndex(mdEl);
    const withOffsets = highlights
        .map((highlight) => ({
            highlight,
            start: findQuoteOffset(fullText, highlight.quote, highlight.prefix, highlight.suffix)
        }))
        .filter((item) => item.start >= 0)
        .sort((a, b) => b.start - a.start);

    for (const { highlight, start } of withOffsets) {
        wrapRange(mdEl, start, start + highlight.quote.length, highlight);
    }
}

/** Wire paint mode, click-to-remove, and resize handles. */
export function initHighlights() {
    ensureFloatingHandles();

    document.addEventListener('mouseup', (e) => {
        if (resizeState) {
            commitResize();
            return;
        }

        if (paintMode && e.button === 2) {
            commitPaintHighlight();
            exitPaintMode();
            return;
        }

        if (e.button !== 0 || e.target.closest?.('.md-highlight-handle')) return;

        const mark = e.target.closest?.('mark.md-highlight');
        if (!mark) return;

        const sel = window.getSelection();
        const hasDragSelect = sel && !sel.isCollapsed && sel.toString().trim().length > 0;
        if (!hasDragSelect) {
            clearSelection();
            removeHighlight(mark.dataset.highlightId);
        }
    });

    document.addEventListener('mousedown', (e) => {
        const mdEl = getMdEl();
        if (!mdEl || state.rawMode) return;

        if (e.button === 2 && mdEl.contains(e.target) && !isSkippable(e.target)) {
            e.preventDefault();
            paintMode = true;
            document.body.classList.add('highlight-paint-mode');
            paintAnchor = caretRangeFromPoint(e.clientX, e.clientY);
            hideFloatingHandles();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (resizeState) {
            updateResizePreview(e.clientX, e.clientY);
            return;
        }
        updatePaintSelection(e.clientX, e.clientY);
    });

    document.addEventListener('mouseover', (e) => {
        if (resizeState || paintMode || state.rawMode) return;
        const mark = e.target.closest?.('mark.md-highlight');
        if (!mark?.dataset.highlightId) return;

        if (handlesHideTimer) {
            clearTimeout(handlesHideTimer);
            handlesHideTimer = null;
        }
        positionFloatingHandles(mark.dataset.highlightId);
    });

    document.addEventListener('mouseout', (e) => {
        const related = e.relatedTarget;
        if (related?.closest?.('mark.md-highlight') || related?.closest?.('.md-highlight-handle')) {
            return;
        }
        if (
            e.target.closest?.('mark.md-highlight') ||
            e.target.closest?.('.md-highlight-handle')
        ) {
            scheduleHideFloatingHandles();
        }
    });

    document.addEventListener('contextmenu', (e) => {
        const mdEl = getMdEl();
        if (!mdEl || state.rawMode) return;
        if (mdEl.contains(e.target) && !isSkippable(e.target)) {
            e.preventDefault();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (resizeState) {
            cancelResize();
            return;
        }
        if (paintMode) {
            clearSelection();
            exitPaintMode();
        }
    });

    document.getElementById('content-area')?.addEventListener('scroll', repositionOpenHandles, {
        passive: true
    });
    window.addEventListener('resize', repositionOpenHandles);
}
