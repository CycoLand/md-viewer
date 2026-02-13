/**
 * Converts lists where every item is "**Label:** value" (bold label, colon, plain text only)
 * into a center-aligned card grid. Label is larger, value is smaller.
 */

const DEBUG_LIST_CARDS = true;
function log(...args) {
    if (DEBUG_LIST_CARDS) console.log('[listCardEnhancer]', ...args);
}

/**
 * Safe short description of an element for logging.
 * @param {Element} el
 * @returns {string}
 */
function elDesc(el) {
    if (!el) return 'null';
    const tag = el.tagName ? el.tagName.toLowerCase() : '?';
    const cls = el.className && typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
    const content = (el.textContent || '').slice(0, 50).replace(/\s+/g, ' ');
    return `<${tag}${cls ? '.' + cls : ''}> "${content}${content.length >= 50 ? '…' : ''}"`;
}

/**
 * Checks if an element is <strong> or <b>.
 * @param {Node} node
 * @returns {boolean}
 */
function isBoldEl(node) {
    return node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'STRONG' || node.tagName === 'B');
}

/**
 * Gets label and value from an li if it matches: single bold (ending with :) then plain text only.
 * Handles both <li><strong>Label:</strong> value</li> and <li><p><strong>Label:</strong> value</p></li>.
 * Returns null and logs reason when it doesn't match.
 * @param {HTMLLIElement} li
 * @param {{ listIndex: number, itemIndex: number }} ctx - for logging
 * @returns {{ label: string, value: string } | null}
 */
function parseListItem(li, ctx = {}) {
    const childElements = Array.from(li.children);
    const container = childElements.length === 1 && childElements[0].tagName === 'P'
        ? childElements[0]
        : li;
    const elements = Array.from(container.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE);

    if (elements.length !== 1) {
        log(`  li[${ctx.itemIndex}]: no match — container has ${elements.length} element(s), need exactly 1. Container: ${container === li ? 'li' : 'p'}, childNodes:`, Array.from(container.childNodes).map(n => n.nodeType === Node.ELEMENT_NODE ? n.tagName : '(text)'));
        return null;
    }
    const bold = elements[0];
    if (!isBoldEl(bold)) {
        log(`  li[${ctx.itemIndex}]: no match — first element is <${bold.tagName}>, expected strong/b`);
        return null;
    }
    const boldText = (bold.textContent || '').trim();
    const fullText = (container.textContent || '').trim();
    const rest = fullText.slice(fullText.indexOf(boldText) + boldText.length).trim();
    const hasColonInBold = boldText.endsWith(':');
    const hasColonAfterBold = rest.startsWith(':');
    if (!hasColonInBold && !hasColonAfterBold) {
        log(`  li[${ctx.itemIndex}]: no match — no colon in or after bold. boldText=${JSON.stringify(boldText.slice(0, 40))}`);
        return null;
    }
    const label = hasColonInBold ? boldText.slice(0, -1).trim() : boldText;
    const value = rest.replace(/^\s*:\s*/, '').trim();
    return { label, value };
}

/**
 * Returns true if every direct li in the list matches the label: value pattern (and list is not a task list).
 * @param {HTMLUListElement|HTMLOListElement} list
 * @param {number} listIndex - for logging
 * @returns {boolean}
 */
function listQualifiesAsCards(list, listIndex = 0) {
    const items = Array.from(list.children).filter(el => el.tagName === 'LI');
    if (items.length === 0) {
        log(`list[${listIndex}]: skip — no <li> children`);
        return false;
    }
    if (items.some(li => li.classList.contains('task-list-item'))) {
        log(`list[${listIndex}]: skip — has task-list-item`);
        return false;
    }
    let allMatch = true;
    items.forEach((li, itemIndex) => {
        const result = parseListItem(li, { listIndex, itemIndex });
        if (result === null) allMatch = false;
        else log(`  li[${itemIndex}]: match — label=${JSON.stringify(result.label)}, value=${JSON.stringify(result.value.slice(0, 40))}${result.value.length > 40 ? '…' : ''}`);
    });
    return allMatch;
}

/**
 * Replaces a list with a card grid.
 * @param {HTMLUListElement|HTMLOListElement} list
 */
function replaceListWithCards(list) {
    const items = Array.from(list.children).filter(el => el.tagName === 'LI');
    const cards = items.map(li => parseListItem(li, {})).filter(Boolean);

    const wrapper = document.createElement('div');
    wrapper.className = 'list-cards';

    cards.forEach(({ label, value }) => {
        const card = document.createElement('div');
        card.className = 'list-card';
        const labelEl = document.createElement('div');
        labelEl.className = 'list-card-label';
        labelEl.textContent = label;
        const valueEl = document.createElement('div');
        valueEl.className = 'list-card-value';
        valueEl.textContent = value;
        card.appendChild(labelEl);
        card.appendChild(valueEl);
        wrapper.appendChild(card);
    });

    list.parentNode.replaceChild(wrapper, list);
}

/**
 * Finds ul/ol where every item is "**Label:** value" and converts them to card grids.
 * @param {HTMLElement} root - Container (e.g. #markdown-content)
 */
export function enhanceListCards(root) {
    const lists = root.querySelectorAll ? root.querySelectorAll('ul, ol') : [];
    log(`Found ${lists.length} list(s) (ul/ol) in root`);

    lists.forEach((list, listIndex) => {
        if (list.closest('.list-cards')) {
            log(`list[${listIndex}]: skip — already inside .list-cards`);
            return;
        }
        const path = list.id ? `#${list.id}` : elDesc(list);
        const parent = list.parentElement ? list.parentElement.className : '?';
        log(`list[${listIndex}]: ${path}, parent class="${parent}", ${list.children.length} direct children`);

        if (listQualifiesAsCards(list, listIndex)) {
            log(`list[${listIndex}]: QUALIFIES — replacing with cards`);
            replaceListWithCards(list);
        } else {
            log(`list[${listIndex}]: does not qualify (see above for first failing li)`);
        }
    });
}
