/**
 * Fumadocs-style TOC track — stepped SVG path, clipped highlight, scroll-direction dot.
 */

const BASE = 8;
/** Half dot (3px) + box-shadow ring (2px) — keep inside scroll area */
const DOT_HALO = 5;

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
        let length = i > 0 ? itemLineLengths[i - 1][1] : 0;

        while (length < totalLength && pathEl.getPointAtLength(length).y < top) {
            length++;
        }

        const topLength = length;
        while (length < totalLength && pathEl.getPointAtLength(length).y < bottom) {
            length++;
        }

        itemLineLengths.push([topLength, length]);
    }

    return itemLineLengths;
}

function createPathElement(path) {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', path);
    return pathEl;
}

function getPathPoint(path, distance) {
    const pathEl = createPathElement(path);
    const total = pathEl.getTotalLength();
    const clamped = Math.max(0, Math.min(distance, total));
    return pathEl.getPointAtLength(clamped);
}

/** Walk along the path from an anchor until targetY is reached; returns on-track x at that y. */
function getPathPointAtY(path, anchorDistance, targetY, forward) {
    const pathEl = createPathElement(path);
    const total = pathEl.getTotalLength();
    let distance = Math.max(0, Math.min(anchorDistance, total));
    let point = pathEl.getPointAtLength(distance);

    if (Math.abs(point.y - targetY) < 0.5) {
        return { x: point.x, y: targetY };
    }

    const step = forward ? 0.5 : -0.5;
    const limit = forward ? total : 0;

    while (forward ? distance < limit : distance > limit) {
        const prevPoint = point;
        distance += step;
        point = pathEl.getPointAtLength(distance);

        const crossed = forward ? point.y >= targetY : point.y <= targetY;
        if (crossed) {
            const dy = point.y - prevPoint.y;
            if (Math.abs(dy) > 0.001) {
                const t = (targetY - prevPoint.y) / dy;
                return {
                    x: prevPoint.x + t * (point.x - prevPoint.x),
                    y: targetY
                };
            }
            return { x: point.x, y: targetY };
        }
    }

    // Padding zone below/above a vertical segment (path ends before row edge)
    if (forward && targetY > point.y) {
        return { x: point.x, y: targetY };
    }
    if (!forward && targetY < point.y) {
        return { x: point.x, y: targetY };
    }

    return { x: point.x, y: point.y };
}

export function computeTocTrack(container, items) {
    if (!container || items.length === 0) {
        return null;
    }

    let width = 0;
    let height = 0;
    let path = '';
    const positions = [];
    const rowBounds = [];
    const links = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const element = container.querySelector(`a[data-target="${item.id}"]`);
        if (!element) continue;

        const styles = getComputedStyle(element);
        const x = getLineOffset(item.level) + 0.5;
        const rowTop = element.offsetTop;
        const rowBottom = element.offsetTop + element.offsetHeight;
        const top = rowTop + (parseFloat(styles.paddingTop) || 0);
        const bottom = rowBottom - (parseFloat(styles.paddingBottom) || 0);

        width = Math.max(x + 8, width);
        height = Math.max(height, rowBottom);

        if (links.length === 0) {
            path += `M ${x} ${top} L ${x} ${bottom}`;
        } else {
            const [, prevBottom, prevX] = positions[positions.length - 1];
            path += ` L ${prevX} ${prevBottom} L ${x} ${top} L ${x} ${bottom}`;
        }

        positions.push([top, bottom, x]);
        rowBounds.push({ rowTop, rowBottom, x });
        links.push(item.id);
    }

    if (positions.length === 0) {
        return null;
    }

    const itemLineLengths = computeItemLineLengths(path, positions);
    height += DOT_HALO;

    return {
        width,
        height,
        contentHeight: height - DOT_HALO,
        path,
        positions,
        rowBounds,
        links,
        itemLineLengths
    };
}

function clipPolygon(top, bottom) {
    return `polygon(0 ${top}px, 100% ${top}px, 100% ${bottom}px, 0 ${bottom}px)`;
}

function setActiveClip(activeClip, width, height, clipTop, clipBottom) {
    if (!activeClip) return;

    activeClip.style.width = `${width}px`;
    activeClip.style.height = `${height}px`;
    activeClip.style.clipPath = clipPolygon(clipTop, clipBottom);
}

function clearActiveClip(activeClip) {
    if (!activeClip) return;
    activeClip.style.clipPath = clipPolygon(0, 0);
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

    const baseSvg = trackHost.querySelector('.toc-track-svg-base');
    const activeSvg = trackHost.querySelector('.toc-track-svg-active');
    const activeClip = trackHost.querySelector('.toc-track-active-clip');
    const basePath = trackHost.querySelector('.toc-track-path-base');
    const activePath = trackHost.querySelector('.toc-track-path-active');
    const dot = trackHost.querySelector('.toc-track-dot');

    for (const svg of [baseSvg, activeSvg]) {
        if (!svg) continue;
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
        clearActiveClip(activeClip);
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
    const startRow = computed.rowBounds[startPosIdx];
    const endRow = computed.rowBounds[endPosIdx];
    const isUp = getScrollDirection(startIdx, endIdx);
    const isFirst = startPosIdx === 0;
    const isLast = endPosIdx === computed.links.length - 1;

    const anchorDistance = isUp
        ? computed.itemLineLengths[startPosIdx][0]
        : computed.itemLineLengths[endPosIdx][1];

    let dotPoint;
    if (isUp && isFirst) {
        // No preceding section — stay at the top of this item's vertical segment
        dotPoint = getPathPoint(computed.path, anchorDistance);
    } else if (!isUp && isLast) {
        // No following section — stay at the bottom of this item's vertical segment
        dotPoint = getPathPoint(computed.path, anchorDistance);
    } else {
        const targetY = isUp ? startRow.rowTop : endRow.rowBottom;
        dotPoint = getPathPointAtY(
            computed.path,
            anchorDistance,
            targetY,
            !isUp
        );
    }

    const clipTop = isUp ? dotPoint.y : startTop;
    const clipBottom = isUp ? endBottom : dotPoint.y;

    setActiveClip(activeClip, computed.width, computed.height, clipTop, clipBottom);

    if (dot) {
        dot.style.left = `${dotPoint.x}px`;
        dot.style.top = `${dotPoint.y}px`;
        dot.style.transform = 'translate(-50%, -50%)';
        dot.style.opacity = '1';
    }

    for (const link of trackHost.parentElement?.querySelectorAll('.toc-link') ?? []) {
        const id = link.getAttribute('data-target');
        const spyItem = activeItems.find((item) => item.id === id);
        link.dataset.active = spyItem?.active ? 'true' : 'false';
    }
}
