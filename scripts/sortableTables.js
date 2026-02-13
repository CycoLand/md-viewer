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
 * Makes all tables inside the given element sortable (header click, indicators, original order).
 * @param {HTMLElement} root - Container that holds .markdown-content or tables (e.g. #markdown-content)
 */
export function setupSortableTables(root) {
    const tables = root.querySelectorAll ? root.querySelectorAll('table') : [];
    tables.forEach(table => {
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
}
