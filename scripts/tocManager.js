// Table of Contents — Fumadocs-style scroll spy + stepped track
import { getTocScrollSpy, resetTocScrollSpy } from './tocScrollSpy.js';
import { computeTocTrack, getItemOffset, resetTocTrack, updateTocTrackVisuals } from './tocTrack.js';

let documentControlHandlers = null;
let trackResizeObserver = null;
let trackUpdateScheduled = false;
let trackState = null;
let trackRefreshListener = null;
let lastNavLayout = null;

function teardownTocTrack() {
    trackResizeObserver?.disconnect();
    trackResizeObserver = null;

    if (trackRefreshListener) {
        getTocScrollSpy().unlisten(trackRefreshListener);
        trackRefreshListener = null;
    }

    trackState = null;
    lastNavLayout = null;
}

export function setDocumentControlHandlers(handlers) {
    documentControlHandlers = handlers;
}

function attachDocumentControlHandlers() {
    if (!documentControlHandlers) return;

    const viewRenderedBtn = document.getElementById('view-rendered-btn');
    const viewRawBtn = document.getElementById('view-raw-btn');
    const viewPagesBtn = document.getElementById('view-pages-btn');
    const exportHtmlBtn = document.getElementById('export-html-btn');

    if (viewRenderedBtn && documentControlHandlers.onViewModeChange) {
        viewRenderedBtn.addEventListener('click', () => {
            setActiveViewButton('rendered');
            documentControlHandlers.onViewModeChange('rendered');
        });
    }

    if (viewRawBtn && documentControlHandlers.onViewModeChange) {
        viewRawBtn.addEventListener('click', () => {
            setActiveViewButton('raw');
            documentControlHandlers.onViewModeChange('raw');
        });
    }

    if (viewPagesBtn && documentControlHandlers.onViewModeChange) {
        viewPagesBtn.addEventListener('click', () => {
            setActiveViewButton('pages');
            documentControlHandlers.onViewModeChange('pages');
        });
    }

    if (exportHtmlBtn && documentControlHandlers.onExportHtml) {
        exportHtmlBtn.addEventListener('click', documentControlHandlers.onExportHtml);
    }
}

function setActiveViewButton(view) {
    document.querySelectorAll('.view-mode-btn').forEach((btn) => {
        btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`view-${view}-btn`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function preserveWaterBar(tocEl) {
    const waterBar = tocEl.querySelector('.water-progress-container');
    if (!waterBar) return '';

    waterBar.querySelectorAll('.ocean-layer, .water-fish, .water-octopus, .sea-floor-wrap').forEach((node) => {
        node.remove();
    });

    return waterBar.outerHTML;
}

function buildTocItems(headings) {
    return headings.map((heading) => {
        const level = parseInt(heading.tagName.substring(1), 10);
        const text = heading.textContent
            .replace(/^\s*[▶▼]\s*/, '')
            .trim();

        return {
            id: heading.id,
            text,
            level
        };
    });
}

function buildTocHtml(items) {
    const linksHtml = items.map((item) => `
        <a
            href="#${item.id}"
            class="toc-link"
            data-target="${item.id}"
            data-level="${item.level}"
            style="padding-inline-start: ${getItemOffset(item.level)}px"
        >${item.text}</a>
    `).join('');

    return `
        <div class="toc-panel">
            <h4 class="toc-title">On this page</h4>
            <div class="toc-scroll">
                <div class="toc-items">
                    <div class="toc-track-host" aria-hidden="true">
                        <svg class="toc-track-svg toc-track-svg-base" preserveAspectRatio="none">
                            <path class="toc-track-path-base" fill="none"></path>
                        </svg>
                        <div class="toc-track-active-clip">
                            <svg class="toc-track-svg toc-track-svg-active" preserveAspectRatio="none">
                                <path class="toc-track-path-active" fill="none"></path>
                            </svg>
                        </div>
                        <div class="toc-track-dot"></div>
                    </div>
                    <nav class="toc-nav">${linksHtml}</nav>
                </div>
            </div>
        </div>
    `;
}

function scheduleTrackUpdate() {
    if (!trackState || trackUpdateScheduled) return;
    trackUpdateScheduled = true;

    requestAnimationFrame(() => {
        trackUpdateScheduled = false;
        if (!trackState) return;

        const { tocEl, items, spy } = trackState;
        const nav = tocEl.querySelector('.toc-nav');
        const trackHost = tocEl.querySelector('.toc-track-host');
        if (!nav || !trackHost) return;

        const layoutKey = `${nav.offsetWidth}:${nav.offsetHeight}`;
        if (!trackState.computed || layoutKey !== lastNavLayout) {
            lastNavLayout = layoutKey;
            trackState.computed = computeTocTrack(nav, items);
        }

        updateTocTrackVisuals(
            trackHost,
            trackState.computed,
            spy.getItems()
        );
    });
}

function setupTocTrack(tocEl, items, spy) {
    teardownTocTrack();

    trackState = { tocEl, items, spy, computed: null };
    lastNavLayout = null;
    trackRefreshListener = () => scheduleTrackUpdate();

    scheduleTrackUpdate();

    const nav = tocEl.querySelector('.toc-nav');
    if (nav) {
        trackResizeObserver = new ResizeObserver(trackRefreshListener);
        trackResizeObserver.observe(nav);
    }

    spy.listen(trackRefreshListener);

    // Layout/fonts can settle after the first paint — refresh once more.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => scheduleTrackUpdate());
    });
}

function setupTocLinks(tocEl, scrollContainer) {
    tocEl.querySelectorAll('.toc-link').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('data-target');
            const target = targetId ? document.getElementById(targetId) : null;
            if (!target || !scrollContainer) return;

            const containerTop = scrollContainer.getBoundingClientRect().top;
            const targetTop = target.getBoundingClientRect().top;
            const nextTop = scrollContainer.scrollTop + (targetTop - containerTop) - 16;

            scrollContainer.scrollTo({
                top: Math.max(0, nextTop),
                behavior: 'smooth'
            });
        });
    });
}

function setupTocScrollSpy(tocEl, items) {
    const scrollContainer = document.querySelector('.content-area');
    if (!scrollContainer) return;

    resetTocScrollSpy();

    const spy = getTocScrollSpy();
    spy.watch(scrollContainer);
    spy.setItems(items);

    setupTocTrack(tocEl, items, spy);
    setupTocLinks(tocEl, scrollContainer);
}

/**
 * Generates and displays the table of contents
 * @param {HTMLElement} mdEl - The markdown content element
 * @param {HTMLElement} tocEl - The TOC container element
 */
export function generateTOC(mdEl, tocEl) {
    if (!tocEl) return;

    const headings = Array.from(
        mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6:not(.document-title)')
    );

    const waterBarHtml = preserveWaterBar(tocEl);
    teardownTocTrack();
    resetTocTrack();

    if (headings.length === 0) {
        tocEl.innerHTML = waterBarHtml;
        teardownTocTrack();
        resetTocScrollSpy();
        document.dispatchEvent(new CustomEvent('tocUpdated'));
        return;
    }

    const items = buildTocItems(headings);
    tocEl.innerHTML = waterBarHtml + buildTocHtml(items);

    setupTocScrollSpy(tocEl, items);
    attachDocumentControlHandlers();

    document.dispatchEvent(new CustomEvent('tocUpdated'));
}

export function destroyTOC() {
    teardownTocTrack();
    resetTocTrack();
    resetTocScrollSpy();
}
