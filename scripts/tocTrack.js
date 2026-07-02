/**
 * Fumadocs-style TOC track — stepped SVG path, clipped highlight, scroll-direction dot.
 */

const BASE = 8;

let previousThumbInfo = null;

export function resetTocTrack() {
    previousThumbInfo = null;
}

export function getItemOffset(level) {
    return 12 + BASE + Math.max(0, level - 1) * 12;
}

export function getLineOffset(level) {
    return BASE + Math.max(0, level - 1) * 12;
}

function computeItemLineLengths(path, positions) {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', path);

    const totalLength = pathEl.getTotalLength();
    const itemLineLengths = [];

    for (let i = 0; i < positions.length; i++) {
        const [top, bottom] = positions[i];
        let length = i > 0
            ? itemLineLengths[i - 1][1] + (top - positions[i - 1][1])
            : top;

        while (length < totalLength && pathEl.getPointAtLength(length).y < top) {
            length++;
        }

        itemLineLengths.push([length, length + bottom - top]);
    }

    return itemLineLengths;
}

export function computeTocTrack(container, items) {
    if (!container || items.length === 0) {
        return null;
    }

    let width = 0;
    let height = 0;
    let path = '';
    const positions = [];
    const links = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const element = container.querySelector(`a[data-target="${item.id}"]`);
        if (!element) continue;

        const styles = getComputedStyle(element);
        const x = getLineOffset(item.level) + 0.5;
        const top = element.offsetTop + (parseFloat(styles.paddingTop) || 0);
        const bottom = element.offsetTop + element.clientHeight - (parseFloat(styles.paddingBottom) || 0);

        width = Math.max(x + 8, width);
        height = Math.max(height, bottom);

        if (links.length === 0) {
            path += `M ${x} ${top} L ${x} ${bottom}`;
        } else {
            const [, prevBottom, prevX] = positions[positions.length - 1];
            path += ` L ${prevX} ${prevBottom} L ${x} ${top} L ${x} ${bottom}`;
        }

        positions.push([top, bottom, x]);
        links.push(item.id);
    }

    if (positions.length === 0) {
        return null;
    }

    const itemLineLengths = computeItemLineLengths(path, positions);

    return {
        width,
        height,
        path,
        positions,
        links,
        itemLineLengths
    };
}

function getScrollDirection(startIdx, endIdx) {
    let isUp = false;

    if (previousThumbInfo) {
        const prev = previousThumbInfo;
        isUp =
            prev.startIdx > startIdx ||
            prev.endIdx > endIdx ||
            (prev.startIdx === startIdx && prev.endIdx === endIdx && prev.isUp);
    }

    previousThumbInfo = { startIdx, endIdx, isUp };
    return isUp;
}

export function updateTocTrackVisuals(trackHost, computed, activeItems) {
    if (!trackHost || !computed) return;

    const svg = trackHost.querySelector('.toc-track-svg');
    const basePath = trackHost.querySelector('.toc-track-path-base');
    const activePath = trackHost.querySelector('.toc-track-path-active');
    const dot = trackHost.querySelector('.toc-track-dot');

    if (svg) {
        svg.setAttribute('viewBox', `0 0 ${computed.width} ${computed.height}`);
        svg.style.width = `${computed.width}px`;
        svg.style.height = `${computed.height}px`;
    }

    if (basePath) basePath.setAttribute('d', computed.path);
    if (activePath) activePath.setAttribute('d', computed.path);

    trackHost.style.width = `${computed.width}px`;
    trackHost.style.height = `${computed.height}px`;

    const startIdx = activeItems.findIndex((item) => item.active);
    if (startIdx === -1) {
        if (activePath) {
            activePath.style.clipPath = 'polygon(0 0, 100% 0, 100% 0, 0 0)';
        }
        if (dot) {
            dot.style.opacity = '0';
        }
        return;
    }

    const endIdx = activeItems.findLastIndex((item) => item.active);
    const startPosIdx = computed.links.indexOf(activeItems[startIdx].id);
    const endPosIdx = computed.links.indexOf(activeItems[endIdx].id);

    if (startPosIdx === -1 || endPosIdx === -1) {
        return;
    }

    const [startTop] = computed.positions[startPosIdx];
    const endBottom = computed.positions[endPosIdx][1];
    const isUp = getScrollDirection(startIdx, endIdx);

    if (activePath) {
        activePath.style.clipPath =
            `polygon(0 ${startTop}px, 100% ${startTop}px, 100% ${endBottom}px, 0 ${endBottom}px)`;
    }

    if (dot) {
        const offsetDistance = isUp
            ? computed.itemLineLengths[startPosIdx][0]
            : computed.itemLineLengths[endPosIdx][1];

        dot.style.offsetPath = `path("${computed.path}")`;
        dot.style.offsetDistance = `${offsetDistance}px`;
        dot.style.offsetRotate = '0deg';
        dot.style.left = '0';
        dot.style.top = '0';
        dot.style.transform = 'none';
        dot.style.opacity = '1';
    }

    for (const link of trackHost.parentElement?.querySelectorAll('.toc-link') ?? []) {
        const id = link.getAttribute('data-target');
        const spyItem = activeItems.find((item) => item.id === id);
        link.dataset.active = spyItem?.active ? 'true' : 'false';
    }
}
