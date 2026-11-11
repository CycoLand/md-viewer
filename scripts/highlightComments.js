/**
 * Comments on highlights.
 *
 * Clicking a highlight (or pressing Enter on it) opens a small popover under
 * it with a comment box. The comment saves as you type and is stored on the
 * highlight, so it persists with the document. The popover is also where a
 * highlight is removed; if it has a comment, the first click asks to confirm.
 *
 * Why a popover anchored to the text: margin notes would have to share the
 * right-hand column with the TOC and have no room at all on phones; a
 * comments side panel covers the very text being commented on; and note
 * blocks inserted under the paragraph shift the layout and would end up in
 * the text that highlights are matched against.
 */
import { getHighlightById, getHighlightMarks, setHighlightComment, deleteHighlight } from './highlights.js';

const SAVE_DELAY_MS = 400;
const CONFIRM_TIMEOUT_MS = 4000;
const QUOTE_PREVIEW_CHARS = 120;

let popoverEl = null;
let textareaEl = null;
let quoteEl = null;
let statusEl = null;
let removeBtn = null;

let activeId = null;
let saveTimer = null;
let confirmTimer = null;

function ensurePopover() {
    if (popoverEl) return popoverEl;

    popoverEl = document.createElement('div');
    popoverEl.className = 'md-comment-popover';
    popoverEl.setAttribute('role', 'dialog');
    popoverEl.setAttribute('aria-labelledby', 'md-comment-title');
    popoverEl.innerHTML = `
        <div class="md-comment-header">
            <span class="md-comment-title" id="md-comment-title">
                <i class="fas fa-comment" aria-hidden="true"></i> Comment
            </span>
            <button type="button" class="md-comment-close" aria-label="Close comment">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        </div>
        <div class="md-comment-body">
            <p class="md-comment-quote"></p>
            <textarea class="md-comment-input" rows="3" placeholder="Add a comment…" aria-label="Comment"></textarea>
        </div>
        <div class="md-comment-footer">
            <button type="button" class="btn btn-secondary btn-small md-comment-remove">
                <i class="fas fa-trash" aria-hidden="true"></i> <span>Remove highlight</span>
            </button>
            <span class="md-comment-status" aria-live="polite"></span>
            <button type="button" class="btn btn-primary btn-small md-comment-done">Done</button>
        </div>
    `;
    document.body.appendChild(popoverEl);

    textareaEl = popoverEl.querySelector('.md-comment-input');
    quoteEl = popoverEl.querySelector('.md-comment-quote');
    statusEl = popoverEl.querySelector('.md-comment-status');
    removeBtn = popoverEl.querySelector('.md-comment-remove');

    textareaEl.addEventListener('input', () => {
        setStatus('');
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveNow, SAVE_DELAY_MS);
    });
    textareaEl.addEventListener('keydown', (e) => {
        // Ctrl/Cmd+Enter finishes, like most comment boxes
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            closePopover();
        }
    });
    popoverEl.querySelector('.md-comment-close').addEventListener('click', () => closePopover());
    popoverEl.querySelector('.md-comment-done').addEventListener('click', () => closePopover());
    removeBtn.addEventListener('click', onRemoveClick);

    return popoverEl;
}

function setStatus(text) {
    if (!statusEl) return;
    statusEl.innerHTML = text ? `<i class="fas fa-check" aria-hidden="true"></i> ${text}` : '';
}

function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!activeId || !getHighlightById(activeId)) return;
    setHighlightComment(activeId, textareaEl.value);
    setStatus('Saved');
}

function resetRemoveButton() {
    clearTimeout(confirmTimer);
    confirmTimer = null;
    if (!removeBtn) return;
    removeBtn.classList.remove('is-confirming');
    removeBtn.querySelector('span').textContent = 'Remove highlight';
}

function onRemoveClick() {
    if (!activeId) return;
    const hasComment = Boolean(textareaEl.value.trim());
    // Removing also discards the comment, so ask once when there is one
    if (hasComment && !removeBtn.classList.contains('is-confirming')) {
        removeBtn.classList.add('is-confirming');
        removeBtn.querySelector('span').textContent = 'Remove with comment?';
        confirmTimer = setTimeout(resetRemoveButton, CONFIRM_TIMEOUT_MS);
        return;
    }
    const id = activeId;
    clearTimeout(saveTimer);
    saveTimer = null;
    activeId = null;
    hide();
    deleteHighlight(id);
}

function positionPopover() {
    if (!popoverEl || !activeId) return;
    const marks = getHighlightMarks(activeId);
    if (!marks.length) {
        closePopover({ restoreFocus: false });
        return;
    }

    const firstRects = marks[0].getClientRects();
    const lastRects = marks[marks.length - 1].getClientRects();
    if (!firstRects.length || !lastRects.length) return;
    const top = firstRects[0];
    const bottom = lastRects[lastRects.length - 1];

    const margin = 8;
    const pw = popoverEl.offsetWidth;
    const ph = popoverEl.offsetHeight;

    // Below the end of the highlight; above its start when there's no room
    let left = bottom.left;
    let y = bottom.bottom + margin;
    if (y + ph > window.innerHeight - margin) {
        const above = top.top - ph - margin;
        y = above >= margin ? above : Math.max(margin, window.innerHeight - ph - margin);
        left = top.left;
    }
    left = Math.min(left, window.innerWidth - pw - margin);
    left = Math.max(margin, left);

    popoverEl.style.left = `${left}px`;
    popoverEl.style.top = `${y}px`;
}

function hide() {
    resetRemoveButton();
    popoverEl?.classList.remove('show');
}

/** Opens the comment popover for a highlight in the current document. */
export function openCommentPopover(id) {
    const highlight = getHighlightById(id);
    if (!highlight) return;

    if (activeId && activeId !== id) closePopover({ restoreFocus: false });

    ensurePopover();
    activeId = id;
    resetRemoveButton();
    setStatus('');

    const quote = highlight.quote.replace(/\s+/g, ' ').trim();
    quoteEl.textContent = quote.length > QUOTE_PREVIEW_CHARS ? quote.slice(0, QUOTE_PREVIEW_CHARS) + '…' : quote;
    textareaEl.value = highlight.comment || '';

    popoverEl.classList.add('show');
    positionPopover();
    textareaEl.focus({ preventScroll: true });
    textareaEl.setSelectionRange(textareaEl.value.length, textareaEl.value.length);
}

/** Saves any pending edit and closes the popover. */
export function closePopover({ restoreFocus = true } = {}) {
    if (!activeId) {
        hide();
        return;
    }
    const id = activeId;
    if (saveTimer) saveNow();
    activeId = null;
    hide();
    if (restoreFocus) getHighlightMarks(id)[0]?.focus({ preventScroll: true });
}

export function initHighlightComments() {
    document.addEventListener('highlightActivate', (e) => openCommentPopover(e.detail?.id));
    document.addEventListener('highlightUiClear', () => closePopover({ restoreFocus: false }));

    // Click outside closes (clicking another highlight switches to it instead)
    document.addEventListener('mousedown', (e) => {
        if (!activeId || popoverEl?.contains(e.target)) return;
        if (e.target.closest?.('mark.md-highlight')) return;
        closePopover({ restoreFocus: false });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeId) closePopover();
    });

    document.getElementById('content-area')?.addEventListener('scroll', positionPopover, { passive: true });
    window.addEventListener('resize', positionPopover);
}
