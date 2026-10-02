/**
 * Wikipedia-style sortable table headers.
 * Default: table order is unchanged (document order).
 * First click: sort column descending (indicator shown).
 * Second click: sort ascending.
 * Third click: remove sort for that column (revert to rest of sort stack + original order).
 * Multiple columns: most recently clicked is primary, then previous sorts, then original order.
 */

import { openTableOverlay } from './tableOverlay.js';

const SORT_STACK_KEY = 'sortableSortStack';

/**
 * Gets a comparable value for a cell (number if possible, else trimmed text).
 * @param {HTMLTableCellElement} cell
 * @returns {{ type: 'number'|'string', value: number|string }}
 */
function getCellSortValue(cell) {
    const text = (cell.textContent || '').trim();
    const num = Number(text);
    const isNum = text !== '' && !Number.isNaN(num);
    return {
        type: isNum ? 'number' : 'string',
        value: isNum ? num : text
    };
}

/**
 * Compares two cell values for sorting.
 * @param {{ type: string, value: number|string }} a
 * @param {{ type: string, value: number|string }} b
 * @param {'asc'|'desc'} dir
 * @returns {number}
 */
function compareValues(a, b, dir) {
    const mult = dir === 'asc' ? 1 : -1;
    if (a.type === 'number' && b.type === 'number') {
        const diff = a.value - b.value;
        return mult * (diff > 0 ? 1 : diff < 0 ? -1 : 0);
    }
    const aStr = String(a.value);
    const bStr = String(b.value);
    const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
    return mult * (cmp > 0 ? 1 : cmp < 0 ? -1 : 0);
}

/**
 * Returns the current sort stack for a table (array of { col, dir }).
 * @param {HTMLTableElement} table
 * @returns {{ col: number, dir: 'asc'|'desc' }[]}
 */
function getSortStack(table) {
    try {
        const raw = table.dataset[SORT_STACK_KEY];
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Saves the sort stack to the table and updates header indicators.
 * @param {HTMLTableElement} table
 * @param {{ col: number, dir: 'asc'|'desc' }[]} stack
 */
function setSortStack(table, stack) {
    table.dataset[SORT_STACK_KEY] = JSON.stringify(stack);
    const headerRow = table.querySelector('thead tr');
    if (!headerRow) return;
    const ths = headerRow.querySelectorAll('th');
    ths.forEach((th, colIndex) => {
        const indicator = th.querySelector('.sort-indicator');
        if (!indicator) return;
        const entry = stack.find(s => s.col === colIndex);
        indicator.classList.remove('sort-asc', 'sort-desc');
        indicator.setAttribute('aria-label', '');
        if (entry) {
            indicator.classList.add(entry.dir === 'asc' ? 'sort-asc' : 'sort-desc');
            indicator.setAttribute('aria-label', entry.dir === 'asc' ? 'Sorted ascending' : 'Sorted descending');
        }
    });
}

/**
 * Sorts the table body using the current sort stack; tiebreak by original index.
 * @param {HTMLTableElement} table
 */
function applySort(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const stack = getSortStack(table);
    const rows = Array.from(tbody.querySelectorAll('tr'));

    if (stack.length === 0) {
        rows.sort((a, b) => (Number(a.dataset.originalIndex) || 0) - (Number(b.dataset.originalIndex) || 0));
    } else {
        rows.sort((rowA, rowB) => {
            for (const { col, dir } of stack) {
                const cellA = rowA.cells[col];
                const cellB = rowB.cells[col];
                const valA = cellA ? getCellSortValue(cellA) : { type: 'string', value: '' };
                const valB = cellB ? getCellSortValue(cellB) : { type: 'string', value: '' };
                const cmp = compareValues(valA, valB, dir);
                if (cmp !== 0) return cmp;
            }
            return (Number(rowA.dataset.originalIndex) || 0) - (Number(rowB.dataset.originalIndex) || 0);
        });
    }

    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Handles header click: cycle column through desc -> asc -> (remove).
 * @param {HTMLTableElement} table
 * @param {number} colIndex
 */
function onHeaderClick(table, colIndex) {
    let stack = getSortStack(table);
    const idx = stack.findIndex(s => s.col === colIndex);

    if (idx === -1) {
        stack = [{ col: colIndex, dir: 'asc' }, ...stack];
    } else if (stack[idx].dir === 'asc') {
        stack[idx] = { ...stack[idx], dir: 'desc' };
    } else {
        stack = stack.filter((_, i) => i !== idx);
    }

    setSortStack(table, stack);
    applySort(table);
}

// Where long paths and URLs in table cells may wrap: just after a separator
// (`src/` + `Services/` + `{Cycodum.` ...), but not between two of them, so
// `https://` stays whole. Not `_`: it's a word character, so splitting there
// would create new word boundaries for acronym detection, which runs on these
// text nodes afterwards.
const BREAK_AFTER_SEPARATOR = /(?<=[/.,:{}()=@])(?![/.,:{}()=@])/;

// Runs longer than this with no break point at all (commit hashes, tokens)
// may also break anywhere. Shorter ones always stay whole, so a cramped
// column can't squeeze names into fragments.
const MAX_UNBREAKABLE_RUN = 20;

/**
 * Length of the longest stretch of text the browser can't already wrap
 * (it breaks at spaces and after hyphens by itself).
 * @param {string} text
 * @returns {number}
 */
function longestUnbreakableRun(text) {
    return Math.max(...text.split(/[\s-]/).map(run => run.length));
}

/**
 * Table layout sizes each column by its widest unbreakable run, so one long
 * path in a cell can squeeze every other column to one word per line. This
 * inserts <wbr> break points after separators in a table's inline code and
 * bare-URL links so they wrap at natural points, and marks overlong runs
 * with no natural break as .break-anywhere.
 * @param {HTMLTableElement} table
 */
function addBreakPoints(table) {
    const targets = [...table.querySelectorAll('code, a')].filter(el =>
        !el.closest('pre') &&
        // Markdown can't produce these inside code or links, so either means done.
        !el.querySelector('wbr, .break-anywhere') &&
        (el.tagName === 'CODE' || el.textContent.includes('://'))
    );

    targets.forEach(el => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach(node => {
            const chunks = node.data.split(BREAK_AFTER_SEPARATOR);
            const isLong = chunks.map(chunk => longestUnbreakableRun(chunk) > MAX_UNBREAKABLE_RUN);
            if (chunks.length < 2 && !isLong[0]) return;

            const frag = document.createDocumentFragment();
            chunks.forEach((chunk, i) => {
                if (isLong[i]) {
                    const span = document.createElement('span');
                    span.className = 'break-anywhere';
                    span.textContent = chunk;
                    frag.append(span);
                } else {
                    frag.append(chunk);
                }
                if (i < chunks.length - 1) frag.append(document.createElement('wbr'));
            });
            node.replaceWith(frag);
        });
    });
}

/**
 * Wraps a table in a container + scrollable inner wrapper so wide tables
 * never get clipped — they scroll internally by default. An expand button
 * (see setupTableExpandButton) is added on top when there's real overflow,
 * letting the user opt into a full-screen view of the table instead of the
 * app guessing on their behalf.
 * @param {HTMLTableElement} table
 */
function wrapTableForOverflow(table) {
    if (table.parentElement && table.parentElement.classList.contains('table-scroll-wrapper')) return;

    const container = document.createElement('div');
    container.className = 'table-container';

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'table-scroll-wrapper';

    table.parentNode.insertBefore(container, table);
    scrollWrapper.appendChild(table);
    container.appendChild(scrollWrapper);
}

/**
 * Adds (or removes) the expand button for a table, based purely on whether
 * it actually overflows the text column — no guessing about readability,
 * just: is there more content here than fits? The user decides whether
 * that's worth opening full-screen.
 * @param {HTMLElement} container
 * @param {HTMLElement} scrollWrapper
 */
function setupTableExpandButton(container, scrollWrapper) {
    const hasOverflow = scrollWrapper.scrollWidth > scrollWrapper.clientWidth + 1;
    const button = container.querySelector('.table-expand-btn');

    if (!hasOverflow) {
        if (button) button.remove();
        return;
    }
    if (button) return;

    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'table-expand-btn';
    expandBtn.title = 'Expand table';
    expandBtn.setAttribute('aria-label', 'Expand table');
    expandBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
    expandBtn.addEventListener('click', () => openTableOverlay(container, expandBtn));
    container.insertBefore(expandBtn, scrollWrapper);
}

let tableResizeObserver = null;

/**
 * Re-checks each table for overflow whenever it or its wrapper changes size —
 * window resizes, the sidebar toggling and late-loading web fonts all change
 * whether a table fits. Watching the wrapper as well as the table matters:
 * once a table has shrunk to its minimum width it stops resizing, and only
 * the wrapper keeps narrowing past it.
 * @param {NodeListOf<HTMLTableElement>} tables
 */
function observeTableOverflow(tables) {
    // One observer per render; drop the one watching the previous DOM.
    tableResizeObserver?.disconnect();
    if (typeof ResizeObserver === 'undefined') return;

    tableResizeObserver = new ResizeObserver(entries => {
        const wrappers = new Set();
        for (const { target } of entries) {
            const wrapper = target.classList.contains('table-scroll-wrapper') ? target : target.parentElement;
            // Skip tables that are currently out in the full-screen overlay.
            if (wrapper?.classList.contains('table-scroll-wrapper') && wrapper.querySelector(':scope > table')) {
                wrappers.add(wrapper);
            }
        }
        wrappers.forEach(wrapper => setupTableExpandButton(wrapper.parentElement, wrapper));
    });

    tables.forEach(table => {
        tableResizeObserver.observe(table);
        tableResizeObserver.observe(table.parentElement);
    });
}

/**
 * Makes all tables inside the given element sortable (header click, indicators, original order).
 * @param {HTMLElement} root - Container that holds .markdown-content or tables (e.g. #markdown-content)
 */
export function setupSortableTables(root) {
    const tables = root.querySelectorAll ? root.querySelectorAll('table') : [];
    tables.forEach(table => {
        addBreakPoints(table);
        wrapTableForOverflow(table);

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        if (!thead || !tbody) return;

        const headerRow = thead.querySelector('tr');
        if (!headerRow) return;

        const ths = headerRow.querySelectorAll('th');
        ths.forEach((th, colIndex) => {
            if (th.querySelector('.sort-indicator')) return;

            const indicator = document.createElement('span');
            indicator.className = 'sort-indicator';
            indicator.setAttribute('aria-hidden', 'true');
            th.classList.add('sortable-th');
            th.appendChild(indicator);
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => onHeaderClick(table, colIndex));
        });

        tbody.querySelectorAll('tr').forEach((row, i) => {
            row.dataset.originalIndex = String(i);
        });

        setSortStack(table, getSortStack(table));
    });

    // Adds the expand buttons (the observer's first callback fires right
    // after layout) and keeps them in sync as sizes change.
    observeTableOverflow(tables);
}
