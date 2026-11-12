/**
 * Shows the TOC column only when it fits beside a full-width text column.
 *
 * The text column's width comes from settings (--content-max-width, in ch), so
 * a fixed media-query breakpoint can't know when both columns fit. A hidden
 * probe sized to --content-max-width in the document font tracks that width;
 * a ResizeObserver on the probe and the scroll area re-checks whenever the
 * window, the sidebar, the font size or the characters-per-line setting changes.
 */
import { state } from './state.js';

let contentArea = null;
let contentBody = null;
let probe = null;

function px(value) {
    return parseFloat(value) || 0;
}

function update() {
    if (!contentArea || !contentBody || !probe) return;

    const markdownEl = document.getElementById('markdown-content');
    if (markdownEl) {
        probe.style.fontSize = getComputedStyle(markdownEl).fontSize;
    }

    const bodyStyle = getComputedStyle(contentBody);
    const tocWidth = px(getComputedStyle(document.documentElement).getPropertyValue('--toc-column-width'));
    const needed =
        probe.getBoundingClientRect().width +
        px(bodyStyle.paddingLeft) + px(bodyStyle.paddingRight) +
        px(bodyStyle.columnGap) +
        tocWidth;

    // clientWidth is rounded to whole pixels; allow that rounding.
    const fits = state.settings.showTOC !== false && contentArea.clientWidth + 1 >= needed;
    contentBody.classList.toggle('toc-fits', fits);
}

export function initTocLayout() {
    contentArea = document.querySelector('.content-area');
    contentBody = document.querySelector('.content-body');
    if (!contentArea || !contentBody) return;

    probe = document.createElement('div');
    probe.className = 'toc-layout-probe';
    probe.setAttribute('aria-hidden', 'true');
    contentBody.appendChild(probe);

    const observer = new ResizeObserver(update);
    observer.observe(contentArea);
    observer.observe(probe);
    update();
}

/** Re-check after something the observers can't see changes (e.g. the TOC setting). */
export function refreshTocLayout() {
    update();
}
