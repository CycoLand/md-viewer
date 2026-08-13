/**
 * Wikipedia-style sortable table headers.
 * Default: table order is unchanged (document order).
 * First click: sort column descending (indicator shown).
 * Second click: sort ascending.
 * Third click: remove sort for that column (revert to rest of sort stack + original order).
 * Multiple columns: most recently clicked is primary, then previous sorts, then original order.
 */

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

/**
 * Wraps a table in a scrollable container so wide tables never get clipped —
 * they scroll internally, and are allowed (via CSS) to grow past the text
 * column into the table-of-contents gutter before that scrolling kicks in.
 * @param {HTMLTableElement} table
 * @returns {HTMLElement} the wrapper (existing or newly created)
 */
function wrapTableForOverflow(table) {
    if (table.parentElement && table.parentElement.classList.contains('table-scroll-wrapper')) {
        return table.parentElement;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll-wrapper';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    return wrapper;
}

const WIDE_BREAKOUT_MIN_VIEWPORT = 1600; // matches the TOC visibility breakpoint

let wordMeasureEl = null;

/**
 * Renders a word off-screen with the given cell's font to get its true
 * layout width — far more reliable than estimating line counts from
 * clientHeight (which is thrown off by padding, rounding, etc).
 * @param {string} word
 * @param {CSSStyleDeclaration} style - computed style of the cell it came from
 * @returns {number}
 */
function measureWordWidth(word, style) {
    if (!wordMeasureEl) {
        wordMeasureEl = document.createElement('span');
        wordMeasureEl.style.position = 'absolute';
        wordMeasureEl.style.visibility = 'hidden';
        wordMeasureEl.style.left = '-9999px';
        wordMeasureEl.style.top = '0';
        wordMeasureEl.style.whiteSpace = 'nowrap';
        document.body.appendChild(wordMeasureEl);
    }
    wordMeasureEl.style.fontFamily = style.fontFamily;
    wordMeasureEl.style.fontSize = style.fontSize;
    wordMeasureEl.style.fontWeight = style.fontWeight;
    wordMeasureEl.style.letterSpacing = style.letterSpacing;
    wordMeasureEl.textContent = word;
    return wordMeasureEl.getBoundingClientRect().width;
}

/**
 * A cell only counts as genuinely cramped if a word is being cut off outright,
 * or — for cells with a real phrase (3+ words) — the column is barely wider
 * than the single longest word, meaning it's effectively forced to one word
 * per line. Short 2-word cells wrapping to two lines is normal table
 * behavior, not a sign the table needs more room.
 * @param {HTMLTableCellElement} cell
 * @returns {boolean}
 */
function isCellCramped(cell) {
    if (cell.scrollWidth > cell.clientWidth + 1) return true;

    const words = (cell.textContent || '').trim().split(/\s+/).filter(Boolean);
    if (words.length < 3) return false;

    const style = getComputedStyle(cell);
    const paddingH = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const availableWidth = cell.clientWidth - paddingH;

    let longest = 0;
    for (const word of words) {
        const width = measureWordWidth(word, style);
        if (width > longest) longest = width;
    }

    return availableWidth < longest * 1.4;
}

/**
 * Decides whether a table reads poorly at its normal (unwidened) width —
 * i.e. text is being cut off, or several cells are collapsing to ~one word
 * per line. Deliberately conservative: this should be the exception, not
 * the default, so a couple of stray wrapped cells isn't enough on its own.
 * The table normally sizes to its own max-content width and simply scrolls
 * inside its wrapper when that's wider than the column, so to see how it
 * WOULD wrap at the normal column width we have to temporarily force both
 * the wrapper and table down to that width before measuring.
 * @param {HTMLElement} wrapper
 * @param {HTMLTableElement} table
 * @returns {boolean}
 */
function tableLooksCramped(wrapper, table) {
    const prevWrapperWidth = wrapper.style.width;
    const prevWrapperMaxWidth = wrapper.style.maxWidth;
    const prevTableWidth = table.style.width;

    wrapper.style.maxWidth = '100%';
    wrapper.style.width = '100%';
    table.style.width = '100%';

    const cells = table.querySelectorAll('td, th');
    let cramped = 0;
    let eligible = 0;
    for (const cell of cells) {
        const words = (cell.textContent || '').trim().split(/\s+/).filter(Boolean);
        const overflowing = cell.scrollWidth > cell.clientWidth + 1;
        if (words.length < 3 && !overflowing) continue; // too short to judge by this heuristic
        eligible++;
        if (overflowing || isCellCramped(cell)) cramped++;
    }

    wrapper.style.width = prevWrapperWidth;
    wrapper.style.maxWidth = prevWrapperMaxWidth;
    table.style.width = prevTableWidth;

    // Require multiple cramped cells, not just a single outlier.
    if (eligible === 0 || cramped < 2) return false;
    return cramped / eligible > 0.4;
}

/**
 * Only lets a table grow past the text column when it would otherwise be
 * hard to read (cut-off words or ~one word per line); otherwise it stays at
 * the normal column width and wraps like the rest of the prose.
 * @param {HTMLElement} wrapper
 * @param {HTMLTableElement} table
 */
function evaluateTableWidth(wrapper, table) {
    // Measure against the normal (unwidened) layout every time, so a table
    // that no longer needs the extra room (e.g. after a resize) can shrink back.
    wrapper.classList.remove('table-wide');
    if (window.innerWidth < WIDE_BREAKOUT_MIN_VIEWPORT) return;
    wrapper.classList.toggle('table-wide', tableLooksCramped(wrapper, table));
}

let wideTableResizeHandler = null;
let trackedWideTableWrappers = [];

function scheduleWideTableReevaluation() {
    if (wideTableResizeHandler) {
        window.removeEventListener('resize', wideTableResizeHandler);
    }
    let resizeTimer = null;
    wideTableResizeHandler = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            trackedWideTableWrappers = trackedWideTableWrappers.filter(w => w.isConnected);
            trackedWideTableWrappers.forEach(wrapper => {
                const table = wrapper.querySelector('table');
                if (table) evaluateTableWidth(wrapper, table);
            });
        }, 150);
    };
    window.addEventListener('resize', wideTableResizeHandler);
}

/**
 * Makes all tables inside the given element sortable (header click, indicators, original order).
 * @param {HTMLElement} root - Container that holds .markdown-content or tables (e.g. #markdown-content)
 */
export function setupSortableTables(root) {
    const tables = root.querySelectorAll ? root.querySelectorAll('table') : [];
    trackedWideTableWrappers = [];
    tables.forEach(table => {
        const wrapper = wrapTableForOverflow(table);
        trackedWideTableWrappers.push(wrapper);
        evaluateTableWidth(wrapper, table);

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

    scheduleWideTableReevaluation();
}
