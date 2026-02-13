/**
 * Replaces native list markers and emoji checkmarks (✅) with a theme-styled custom check symbol.
 * - Task lists ([ ] / [x]): hide native checkbox, show custom check/circle.
 * - Bullet/numbered lists where every item starts with ✅: remove bullet/number and ✅, show custom check.
 */

const CHECK_EMOJI = '\u2705'; // ✅

/**
 * Returns the first descendant text node that contains the check emoji, or null.
 * @param {Element} el
 * @returns {Text|null}
 */
function findLeadingCheckTextNode(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        const t = node.textContent.trim();
        if (t.startsWith(CHECK_EMOJI)) return node;
        if (t.length > 0) return null;
    }
    return null;
}

/**
 * Removes leading ✅ (and optional space) from a text node; returns true if one was removed.
 * @param {Text} textNode
 * @returns {boolean}
 */
function stripLeadingCheck(textNode) {
    const raw = textNode.textContent;
    const trimmed = raw.replace(/^\s*/, '');
    if (!trimmed.startsWith(CHECK_EMOJI)) return false;
    const after = trimmed.slice(CHECK_EMOJI.length).replace(/^\s*/, '');
    textNode.textContent = raw.slice(0, raw.length - trimmed.length) + after;
    return true;
}

/**
 * Creates the custom check marker span (theme-styled). For task lists, checked state is synced via .checked on parent li.
 * @param {'check'|'circle'} kind - 'check' for checked/filled, 'circle' for unchecked
 * @returns {HTMLSpanElement}
 */
function createMarkerSpan(kind) {
    const span = document.createElement('span');
    span.className = 'custom-check-marker';
    span.setAttribute('aria-hidden', 'true');
    if (kind === 'check') {
        span.innerHTML = '<i class="fas fa-check"></i>';
        span.classList.add('checked');
    } else {
        span.innerHTML = '<i class="far fa-circle"></i>';
    }
    return span;
}

/**
 * Enhances task list items: add custom marker, hide native checkbox, keep behavior.
 * @param {HTMLElement} root
 */
function enhanceTaskListMarkers(root) {
    root.querySelectorAll('li').forEach(li => {
        const checkbox = li.querySelector('input[type="checkbox"]');
        if (!checkbox) return;

        const marker = createMarkerSpan(checkbox.checked ? 'check' : 'circle');
        if (checkbox.checked) marker.classList.add('checked');
        li.insertBefore(marker, checkbox);

        li.classList.add('custom-checkmark-item');

        checkbox.classList.add('custom-check-input-hidden');

        const syncMarker = () => {
            if (checkbox.checked) {
                marker.classList.add('checked');
                marker.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                marker.classList.remove('checked');
                marker.innerHTML = '<i class="far fa-circle"></i>';
            }
        };

        checkbox.addEventListener('change', syncMarker);

        marker.addEventListener('click', (e) => {
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        });
        marker.style.cursor = 'pointer';
    });
}

/**
 * Returns true if the list has only checkmark-emoji items (every non–task-list li starts with ✅).
 * @param {HTMLUListElement|HTMLOListElement} list
 * @returns {boolean}
 */
function listIsAllCheckEmoji(list) {
    const items = Array.from(list.children).filter(el => el.tagName === 'LI');
    if (items.length === 0) return false;
    return items.every(li => {
        if (li.classList.contains('task-list-item')) return true;
        const textNode = findLeadingCheckTextNode(li);
        return textNode !== null;
    });
}

/**
 * Strips leading ✅ from the first text that has it and adds custom marker.
 * @param {HTMLLIElement} li
 */
function stripCheckEmojiAndAddMarker(li) {
    const textNode = findLeadingCheckTextNode(li);
    if (!textNode || !stripLeadingCheck(textNode)) return;

    const marker = createMarkerSpan('check');
    li.insertBefore(marker, li.firstChild);
    li.classList.add('custom-checkmark-item');
}

/**
 * Enhances bullet/numbered lists where every item starts with ✅.
 * @param {HTMLElement} root
 */
function enhanceEmojiCheckLists(root) {
    root.querySelectorAll('ul, ol').forEach(list => {
        if (list.closest('.list-cards')) return;
        if (!listIsAllCheckEmoji(list)) return;

        list.classList.add('custom-checkmark-list');
        list.style.listStyle = 'none';

        Array.from(list.children)
            .filter(el => el.tagName === 'LI' && !el.classList.contains('task-list-item'))
            .forEach(stripCheckEmojiAndAddMarker);
    });
}

/**
 * Replaces list markers and ✅ with theme-consistent custom check symbols.
 * @param {HTMLElement} root - e.g. #markdown-content
 */
export function enhanceCheckmarkLists(root) {
    enhanceTaskListMarkers(root);
    enhanceEmojiCheckLists(root);
}
