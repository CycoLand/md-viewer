// Acronym hover/click definitions via the STANDS4 Abbreviations API,
// filtered to IT/technology categories. Requires a free API key
// (see Settings > Acronym Definitions) — the feature no-ops without one.
import { state, ACRONYM_CACHE_KEY } from './state.js';

const API_URL = 'https://www.stands4.com/services/v2/abbr.php';

// Only ALL-CAPS tokens of 2-8 letters/digits (starting with a letter) are
// treated as acronyms. This over-matches emphasis words like "NOTE" or
// "TODO", but those simply resolve to "no definition found" on click.
const ACRONYM_REGEX = /\b[A-Z][A-Z0-9]{1,7}\b/g;

const BASE_SKIP_SELECTOR =
    'script, style, .document-header, .document-menu-dropdown, .code-block-header, a, button, label, .md-acronym';

// Fenced code blocks in these languages (or with no language at all, which
// codeBlockEnhancer.js labels "text") get full acronym detection, same as
// prose. Anything else only gets detection inside comment tokens.
const PLAIN_TEXT_LANGUAGES = new Set(['text', 'txt', 'plaintext', 'plain', 'md', 'markdown']);

const EXACT_IT_CATEGORIES = new Set(['it', 'i.t.', 'ict']);
const IT_CATEGORY_SUBSTRINGS = [
    'computing', 'computer', 'information technology', 'internet',
    'software', 'hardware', 'networking', 'network', 'telecom',
    'technology', 'programming', 'database'
];

let popupEl = null;
let activeSpan = null;
let requestToken = 0;
let cache = loadCache();

// --- Cache ---

function loadCache() {
    try {
        const raw = localStorage.getItem(ACRONYM_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (err) {
        return {};
    }
}

function saveCache() {
    try {
        localStorage.setItem(ACRONYM_CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
        console.error('Error saving acronym cache:', err);
    }
}

export function clearAcronymCache() {
    cache = {};
    saveCache();
}

// --- DOM annotation ---

function isPlainTextCodeBlock(codeEl) {
    const lang = (codeEl.dataset.mdLanguage || '').toLowerCase();
    return PLAIN_TEXT_LANGUAGES.has(lang);
}

function isSkippable(el) {
    if (!el) return true;
    if (el.closest(BASE_SKIP_SELECTOR)) return true;

    const codeEl = el.closest('pre code');
    if (codeEl) {
        // Comment tokens (hljs-comment) are fair game in any language.
        if (el.closest('.hljs-comment')) return false;
        // Plain-text/markdown fences get full detection, like prose.
        if (isPlainTextCodeBlock(codeEl)) return false;
        // Real code (identifiers, keywords, strings, etc.) stays untouched.
        return true;
    }

    return false;
}

function collectTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (isSkippable(parent)) return NodeFilter.FILTER_REJECT;
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

/**
 * Wraps ALL-CAPS acronym-looking tokens within root in hoverable spans.
 * @param {HTMLElement} root
 */
export function annotateAcronyms(root) {
    if (!root) return;
    const nodes = collectTextNodes(root);

    nodes.forEach((node) => {
        const text = node.nodeValue;
        ACRONYM_REGEX.lastIndex = 0;
        if (!ACRONYM_REGEX.test(text)) return;
        ACRONYM_REGEX.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        while ((match = ACRONYM_REGEX.exec(text))) {
            const term = match[0];
            if (match.index > lastIndex) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }
            const span = document.createElement('span');
            span.className = 'md-acronym';
            span.dataset.acronym = term;
            span.tabIndex = 0;
            span.setAttribute('role', 'button');
            span.setAttribute('aria-haspopup', 'dialog');
            span.textContent = term;
            frag.appendChild(span);
            lastIndex = match.index + term.length;
        }
        if (lastIndex < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        node.replaceWith(frag);
    });
}

// --- IT-category filtering ---

function isItCategory(category) {
    if (!category) return false;
    const c = category.toLowerCase().trim();
    if (EXACT_IT_CATEGORIES.has(c)) return true;
    return IT_CATEGORY_SUBSTRINGS.some((k) => c.includes(k));
}

// Same wording can legitimately show up under several categories (e.g. "URL"
// under both Networking and Internet) — collapse those into one entry with
// its categories combined, rather than repeating the definition.
function dedupeMatches(matches) {
    const byDefinition = new Map();
    const order = [];

    matches.forEach((r) => {
        const definition = (r.definition || '').trim();
        if (!definition) return;
        const key = definition.toLowerCase();
        const category = (r.category || '').trim();

        let entry = byDefinition.get(key);
        if (!entry) {
            entry = { definition, categories: [] };
            byDefinition.set(key, entry);
            order.push(entry);
        }
        if (category && !entry.categories.includes(category)) {
            entry.categories.push(category);
        }
    });

    return order;
}

// --- API ---

async function fetchDefinitions(term) {
    const uid = state.settings.acronymUid;
    const tokenid = state.settings.acronymTokenId;
    if (!uid || !tokenid) {
        return { status: 'no-key' };
    }

    const url = `${API_URL}?uid=${encodeURIComponent(uid)}&tokenid=${encodeURIComponent(tokenid)}&term=${encodeURIComponent(term)}&format=json`;

    let data;
    try {
        const res = await fetch(url);
        data = await res.json();
    } catch (err) {
        return { status: 'error', message: 'Network error contacting the definitions service.' };
    }

    if (data && data.error) {
        return { status: 'error', message: data.error };
    }

    let results = [];
    if (Array.isArray(data?.result)) results = data.result;
    else if (data?.result) results = [data.result];
    else if (Array.isArray(data?.results?.result)) results = data.results.result;
    else if (data?.results?.result) results = [data.results.result];

    const itMatches = results.filter((r) => isItCategory(r.category));
    return { status: 'ok', matches: dedupeMatches(itMatches) };
}

// --- Popup ---

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function ensurePopup() {
    if (popupEl) return popupEl;

    popupEl = document.createElement('div');
    popupEl.className = 'md-acronym-popup';
    popupEl.setAttribute('role', 'dialog');
    popupEl.innerHTML = `
        <div class="md-acronym-popup-header">
            <span class="md-acronym-popup-term"></span>
            <button type="button" class="md-acronym-popup-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="md-acronym-popup-body"></div>
    `;
    document.body.appendChild(popupEl);

    popupEl.querySelector('.md-acronym-popup-close').addEventListener('click', closePopup);
    popupEl.addEventListener('click', (e) => e.stopPropagation());

    return popupEl;
}

function positionPopup(target) {
    if (!popupEl || !target.isConnected) return;
    const rect = target.getBoundingClientRect();
    const margin = 8;
    const pw = popupEl.offsetWidth;
    const ph = popupEl.offsetHeight;

    let left = rect.left;
    let top = rect.bottom + margin;

    if (left + pw > window.innerWidth - margin) left = window.innerWidth - pw - margin;
    if (left < margin) left = margin;

    if (top + ph > window.innerHeight - margin) {
        const above = rect.top - ph - margin;
        top = above < margin ? margin : above;
    }

    popupEl.style.left = `${left}px`;
    popupEl.style.top = `${top}px`;
}

function closePopup() {
    if (!popupEl) return;
    popupEl.classList.remove('show');
    activeSpan = null;
}

function renderNoKeyBody(body) {
    body.innerHTML = `
        <p>Add a free STANDS4 API key in Settings to look up acronym definitions.</p>
        <button type="button" class="btn btn-secondary btn-small md-acronym-popup-settings-btn">
            <i class="fas fa-cog"></i> Open Settings
        </button>
    `;
    body.querySelector('.md-acronym-popup-settings-btn').addEventListener('click', () => {
        closePopup();
        document.dispatchEvent(new CustomEvent('openSettingsPanel', { detail: { focus: 'acronym-api-uid' } }));
    });
}

// Cap how many category names are spelled out per definition — a term like
// XML can legitimately span 7+ categories, which would otherwise blow the
// badge past a couple lines. Capping to a fixed count keeps it deterministic
// regardless of how long individual category names are (a CSS line-clamp on
// the badge backs this up as a hard guarantee).
const MAX_VISIBLE_CATEGORIES = 2;

function formatCategories(categories) {
    if (categories.length <= MAX_VISIBLE_CATEGORIES) return categories.join(', ');
    const shown = categories.slice(0, MAX_VISIBLE_CATEGORIES).join(', ');
    const remaining = categories.length - MAX_VISIBLE_CATEGORIES;
    return `${shown} +${remaining} more`;
}

function renderResultBody(body, result, term) {
    const matches = result.matches || [];
    if (!matches.length) {
        body.innerHTML = `<p class="md-acronym-popup-empty">No IT/technology definition found for "${escapeHtml(term)}".</p>`;
        return;
    }
    body.innerHTML = matches.map((m) => {
        // Defensive: older cached entries may still have a single `category`
        // string instead of a `categories` array.
        const categories = m.categories || (m.category ? [m.category] : []);
        return `
        <div class="md-acronym-popup-entry">
            <p class="md-acronym-popup-definition">${escapeHtml(m.definition || '')}</p>
            ${categories.length ? `<span class="md-acronym-popup-category">${escapeHtml(formatCategories(categories))}</span>` : ''}
        </div>
    `;
    }).join('');
}

async function openPopupFor(span) {
    const term = span.dataset.acronym;
    activeSpan = span;
    const myRequest = ++requestToken;

    const popup = ensurePopup();
    popup.querySelector('.md-acronym-popup-term').textContent = term;
    const body = popup.querySelector('.md-acronym-popup-body');
    popup.classList.add('show');

    const cached = cache[term];
    if (cached) {
        renderResultBody(body, cached, term);
        positionPopup(span);
        return;
    }

    if (!state.settings.acronymUid || !state.settings.acronymTokenId) {
        renderNoKeyBody(body);
        positionPopup(span);
        return;
    }

    body.innerHTML = '<div class="md-acronym-popup-loading"><i class="fas fa-spinner fa-spin"></i> Looking up definition…</div>';
    positionPopup(span);

    const result = await fetchDefinitions(term);
    if (myRequest !== requestToken || activeSpan !== span) return;

    if (result.status === 'ok') {
        cache[term] = result;
        saveCache();
        renderResultBody(body, result, term);
    } else if (result.status === 'no-key') {
        renderNoKeyBody(body);
    } else {
        body.innerHTML = `<p class="md-acronym-popup-error">${escapeHtml(result.message || 'Something went wrong looking this up.')}</p>`;
    }
    positionPopup(span);
}

// --- Init ---

export function initAcronyms() {
    // Capture phase: collapsible-section headings toggle on a bubble-phase
    // click listener bound to the heading itself, which fires before a
    // bubble-phase listener on document ever would. Running in capture lets
    // us stopPropagation() before that heading listener sees the click at
    // all, so clicking an acronym inside a heading opens the popup instead
    // of also collapsing the section.
    document.addEventListener('click', (e) => {
        const span = e.target.closest('.md-acronym');
        if (span) {
            e.stopPropagation();
            if (activeSpan === span && popupEl?.classList.contains('show')) {
                closePopup();
            } else {
                openPopupFor(span);
            }
            return;
        }
        if (popupEl && !popupEl.contains(e.target)) {
            closePopup();
        }
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePopup();
            return;
        }
        if ((e.key === 'Enter' || e.key === ' ') && e.target?.classList?.contains('md-acronym')) {
            e.preventDefault();
            openPopupFor(e.target);
        }
    });

    window.addEventListener('resize', () => {
        if (activeSpan) positionPopup(activeSpan);
    });
    window.addEventListener('scroll', () => {
        if (activeSpan) positionPopup(activeSpan);
    }, true);
}
