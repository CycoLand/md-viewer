/**
 * Full-screen view for tables too wide for the text column. The table element
 * itself is moved into the overlay (and back on close) rather than cloned, so
 * sorting, highlights and acronym annotations keep working while expanded.
 * The overlay lives inside #markdown-content so the table keeps its
 * .markdown-content styles, and a re-render simply discards it.
 */

/**
 * Picks a title for the overlay: the section heading the table sits under,
 * else the document title.
 * @param {HTMLElement} container
 * @param {HTMLElement} mdEl
 * @returns {string}
 */
function getTableTitle(container, mdEl) {
    const heading = container.closest('.md-section')?.querySelector(':scope > .md-heading');
    const title = heading || mdEl.querySelector('.document-title');
    return title?.textContent.trim() || 'Table';
}

/**
 * Opens the given table container's table in a full-screen overlay.
 * @param {HTMLElement} container - .table-container wrapping the table
 * @param {HTMLElement} returnFocusEl - focused again when the overlay closes
 */
export function openTableOverlay(container, returnFocusEl) {
    const scrollWrapper = container.querySelector('.table-scroll-wrapper');
    const table = scrollWrapper?.querySelector(':scope > table');
    const mdEl = container.closest('.markdown-content');
    if (!table || !mdEl) return;

    const title = getTableTitle(container, mdEl);

    const overlay = document.createElement('div');
    overlay.className = 'modal show table-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `Expanded table: ${title}`);
    overlay.innerHTML = `
        <div class="modal-content table-overlay-panel" tabindex="-1">
            <div class="modal-header">
                <span class="table-overlay-title"></span>
                <button type="button" class="close-modal" title="Close (Esc)" aria-label="Close expanded table">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body table-overlay-body"></div>
        </div>
    `;
    overlay.querySelector('.table-overlay-title').textContent = title;

    // Hold the table's place so the document behind doesn't reflow.
    container.style.height = `${container.offsetHeight}px`;
    overlay.querySelector('.table-overlay-body').appendChild(table);
    mdEl.appendChild(overlay);

    const close = () => {
        scrollWrapper.appendChild(table);
        container.style.height = '';
        overlay.remove();
        returnFocusEl?.focus();
    };

    overlay.querySelector('.close-modal').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            close();
        } else if (e.ctrlKey || e.metaKey) {
            // Keep app shortcuts (raw mode, open file, ...) from acting on the
            // page behind the overlay. Browser defaults like copy still work.
            e.stopPropagation();
        }
    });

    overlay.querySelector('.table-overlay-panel').focus();
}
