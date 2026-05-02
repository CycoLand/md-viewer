// Water Fish - Outer box ocean with bar as viewport window

const GROUP_COUNT = 20;
const FISH_PER_GROUP = 6;
const FISH_COLORS = ['#ffd700', '#4ecdc4', '#ff6b6b', '#45b7d1', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12', '#3498db', '#e91e63'];
const FISH_SIZE = 16;
const NOISE_STRENGTH = 0.4;
const BASE_SPEED = 0.4;
const MAX_TURN = 0.12;
const BOAT_AVOIDANCE_RADIUS = 100;  // Fish flee if closer than this to boat

// Slow big fish - stay within 10° of horizontal (left/right)
const BIG_FISH_COUNT = 4;
const BIG_FISH_SIZE = 26;
const BIG_FISH_SPEED = 0.12;
const BIG_FISH_ANGLE_LIMIT = (10 * Math.PI) / 180;  // 10 degrees

// Outer box - fish swim here; bar is a viewport window into it
const OUTER_BOX_SCALE = 1.8;  // outer = 2x viewport

// Seeded pseudo-random for reproducible but varied fish behavior
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Smooth gradient noise - layered sine waves for organic flow-field
function flowNoise(x, y, t, f1, f2, f3) {
    return (
        Math.sin(x * f1 * 0.02 + t * 0.8) * Math.cos(y * f2 * 0.02 + t * 0.5) * 0.4 +
        Math.sin((x + y) * f3 * 0.03 + t * 0.3) * 0.3 +
        Math.sin(x * 0.05 - y * 0.07 + t * 0.2) * 0.3
    );
}

let animationId = null;
let fishElements = [];
let fishState = [];
let groupCenters = [];
let bigFishElements = [];
let bigFishState = [];
let octopusElement = null;
let oceanLayer = null;
let seaFloorElement = null;

function createFishSvg(color, size, index) {
    const s = size;
    const id = `fish-${index}-${color.replace('#','')}`;
    return `<svg viewBox="0 0 24 12" class="fish-svg" style="width:${s}px;height:${s/2}px">
        <defs>
            <linearGradient id="${id}-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:${color};stop-opacity:0.9"/>
                <stop offset="100%" style="stop-color:${color};stop-opacity:0.5"/>
            </linearGradient>
            <filter id="${id}-glow">
                <feGaussianBlur stdDeviation="0.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </feMerge>
        </defs>
        <path d="M2 6 Q4 2 8 6 Q4 10 2 6 Z" fill="url(#${id}-grad)" filter="url(#${id}-glow)"/>
        <ellipse cx="14" cy="6" rx="4" ry="3" fill="url(#${id}-grad)"/>
        <circle cx="18" cy="5" r="0.8" fill="#1a1a2e"/>
    </svg>`;
}

function createSeaFloorSvg() {
    return `<div class="sea-floor">
        <div class="sea-sand"></div>
        <svg class="sea-floor-decor" viewBox="0 0 80 55" preserveAspectRatio="xMidYMax meet">
            <!-- Coral left -->
            <path d="M8 45 Q4 28 12 12 Q16 6 8 2" fill="none" stroke="#e74c3c" stroke-width="2" opacity="0.85"/>
            <path d="M16 45 Q18 22 14 10" fill="none" stroke="#e91e63" stroke-width="1.5" opacity="0.75"/>
            <!-- Coral right -->
            <path d="M72 45 Q68 30 64 14 Q60 6 72 2" fill="none" stroke="#ff6b6b" stroke-width="2" opacity="0.85"/>
            <path d="M64 45 Q62 24 66 12" fill="none" stroke="#e74c3c" stroke-width="1.5" opacity="0.75"/>
            <!-- Treasure chest -->
            <rect x="30" y="38" width="20" height="12" rx="2" fill="#8b4513" stroke="#654321" stroke-width="1.2"/>
            <rect x="32" y="34" width="16" height="5" rx="2" fill="#b8860b"/>
            <rect x="34" y="36" width="4" height="3" fill="#ffd700"/>
            <rect x="40" y="36" width="4" height="3" fill="#ffd700"/>
            <rect x="46" y="36" width="4" height="3" fill="#ffd700"/>
        </svg>
    </div>`;
}

function createOctopusSvg(id) {
    return `<svg viewBox="0 0 32 32" class="octopus-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="${id}-oct-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#5a3d2e"/>
                <stop offset="100%" style="stop-color:#8b5a2b"/>
            </linearGradient>
        </defs>
        <!-- Tentacles -->
        <path class="octopus-tentacle" d="M6 20 Q4 26 8 28" stroke="url(#${id}-oct-grad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path class="octopus-tentacle" d="M10 21 Q8 27 12 28" stroke="url(#${id}-oct-grad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path class="octopus-tentacle" d="M14 22 Q12 28 16 29" stroke="url(#${id}-oct-grad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path class="octopus-tentacle" d="M18 22 Q16 28 20 29" stroke="url(#${id}-oct-grad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path class="octopus-tentacle" d="M22 21 Q20 27 24 28" stroke="url(#${id}-oct-grad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path class="octopus-tentacle" d="M26 20 Q24 26 28 28" stroke="url(#${id}-oct-grad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Body -->
        <ellipse cx="16" cy="14" rx="10" ry="9" fill="url(#${id}-oct-grad)"/>
        <circle cx="12" cy="12" r="2" fill="#1a1a2e"/>
        <circle cx="20" cy="12" r="2" fill="#1a1a2e"/>
        <circle cx="12.3" cy="11.3" r="0.5" fill="#fff"/>
        <circle cx="20.3" cy="11.3" r="0.5" fill="#fff"/>
    </svg>`;
}

function spawnFish(waterElement) {
    const bar = waterElement.closest('.water-progress-bar');
    if (!bar) return;
    const barRect = bar.getBoundingClientRect();
    const vw = Math.max(40, barRect.width);
    const vh = Math.max(200, barRect.height);
    const ow = vw * OUTER_BOX_SCALE;
    const oh = vh * OUTER_BOX_SCALE;
    const floorHeight = 80;

    oceanLayer?.remove();
    seaFloorElement?.remove();
    fishState = [];
    fishElements.forEach(el => el?.remove());
    fishElements = [];
    groupCenters = [];
    bigFishElements.forEach(el => el?.remove());
    bigFishElements = [];
    bigFishState = [];
    octopusElement?.remove();
    octopusElement = null;

    // Ocean layer - in water, bottom-anchored (sea floor, treasure, octopus at bottom)
    oceanLayer = document.createElement('div');
    oceanLayer.className = 'ocean-layer';
    oceanLayer.style.cssText = `
        position:absolute; top:auto; left:${(vw - ow) / 2}px; bottom:0;
        width:${ow}px; height:${oh}px;
        z-index:2;
    `;
    waterElement.insertBefore(oceanLayer, waterElement.firstChild);

    // Sea floor at bottom of outer box
    seaFloorElement = document.createElement('div');
    seaFloorElement.className = 'sea-floor-wrap';
    seaFloorElement.innerHTML = createSeaFloorSvg();
    seaFloorElement.style.cssText = `position:absolute;bottom:0;left:0;width:100%;height:70px;pointer-events:none;`;
    oceanLayer.appendChild(seaFloorElement);

    let globalIndex = 0;
    for (let g = 0; g < GROUP_COUNT; g++) {
        const rnd = mulberry32(g * 7919 + 1);
        const groupColor = FISH_COLORS[g % FISH_COLORS.length];
        const center = {
            x: 0.1 * ow + rnd() * 0.8 * ow,
            y: 0.1 * (oh - floorHeight) + rnd() * 0.7 * (oh - floorHeight),
            angle: rnd() * Math.PI * 2,
            speed: BASE_SPEED * (0.85 + rnd() * 0.3),
            phase: rnd() * 1000,
            f1: 0.7 + rnd() * 0.6,
            f2: 0.3 + rnd() * 0.4,
            f3: 0.1 + rnd() * 0.2,
        };
        groupCenters.push(center);

        for (let f = 0; f < FISH_PER_GROUP; f++) {
            const frnd = mulberry32(g * 113 + f * 31 + 1);
            fishState.push({
                groupIndex: g,
                offsetX: (frnd() - 0.5) * 12,
                offsetY: (frnd() - 0.5) * 12,
                x: 0, y: 0, angle: 0,
                color: groupColor,
                size: FISH_SIZE * (0.9 + frnd() * 0.2),
            });
            const fishEl = document.createElement('div');
            fishEl.className = 'water-fish';
            fishEl.innerHTML = createFishSvg(fishState[fishState.length - 1].color, fishState[fishState.length - 1].size, globalIndex);
            oceanLayer.appendChild(fishEl);
            fishElements.push(fishEl);
            globalIndex++;
        }
    }

    // Big fish - spawn in outer box
    const bigFishColors = ['#2d5a27', '#1e3d36', '#3d5a2d', '#2d3d5a'];
    for (let i = 0; i < BIG_FISH_COUNT; i++) {
        const rnd = mulberry32(9000 + i * 7919);
        const dir = rnd() > 0.5 ? 0 : Math.PI;  // Start facing left or right
        bigFishState.push({
            x: 0.1 * ow + rnd() * 0.8 * ow,
            y: 0.2 * (oh - floorHeight) + rnd() * 0.6 * (oh - floorHeight),
            angle: dir + (rnd() - 0.5) * BIG_FISH_ANGLE_LIMIT,
            speed: BIG_FISH_SPEED * (0.8 + rnd() * 0.4),
            phase: rnd() * 1000,
            f1: 0.7 + rnd() * 0.6,
            f2: 0.3 + rnd() * 0.4,
            f3: 0.1 + rnd() * 0.2,
            size: BIG_FISH_SIZE * (0.9 + rnd() * 0.2),
            color: bigFishColors[i % bigFishColors.length],
        });
        const fishEl = document.createElement('div');
        fishEl.className = 'water-fish water-fish-big';
        fishEl.innerHTML = createFishSvg(bigFishState[i].color, bigFishState[i].size, 1000 + i);
        oceanLayer.appendChild(fishEl);
        bigFishElements.push(fishEl);
    }

    // Octopus - at bottom of outer box
    const octId = 'oct-' + Date.now();
    octopusElement = document.createElement('div');
    octopusElement.className = 'water-octopus';
    octopusElement.innerHTML = createOctopusSvg(octId);
    octopusElement.style.left = (ow / 2) + 'px';
    octopusElement.style.bottom = '75px';
    oceanLayer.appendChild(octopusElement);
}

function clampAngleToHorizontal(desiredAngle, currentAngle, limitRad) {
    let a = ((desiredAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
    const goingRight = Math.cos(currentAngle) >= 0;
    if (goingRight) {
        return Math.max(-limitRad, Math.min(limitRad, a));
    } else {
        if (a > 0) return Math.PI - limitRad;
        return -Math.PI + limitRad;
    }
}

function animate(time) {
    const waterElement = document.getElementById('water-level');
    const bar = waterElement?.closest('.water-progress-bar');
    if (!waterElement || !bar || !oceanLayer) {
        animationId = null;
        return;
    }

    const barRect = bar.getBoundingClientRect();
    const waterRect = waterElement.getBoundingClientRect();
    const vw = Math.max(40, barRect.width);
    const vh = Math.max(200, barRect.height);
    const waterHeight = waterRect.height;
    const ow = vw * OUTER_BOX_SCALE;
    const oh = vh * OUTER_BOX_SCALE;
    const t = time * 0.001;

    const margin = 5;
    const floorHeight = 80;
    // Fish above water surface disappear; when water empty, show all (surfaceY very low)
    const surfaceY = Math.max(0, oh - waterHeight - 15);

    // Boat position in outer box coordinates (centered horizontally, at water surface)
    const boatX = ow / 2;
    const boatY = surfaceY;

    // Update group centers - stay in outer box
    for (let g = 0; g < groupCenters.length; g++) {
        const c = groupCenters[g];
        // Create 2D flow field - use noise for both x and y components
        const noiseX = flowNoise(c.x, c.y, t + c.phase, c.f1, c.f2, c.f3);
        const noiseY = flowNoise(c.y, c.x, t + c.phase + 100, c.f2, c.f1, c.f3);  // Swap coords and offset for independence
        let desiredAngle = Math.atan2(noiseY, noiseX);

        // Boat avoidance - fish flee if too close to boat
        let dx = c.x - boatX;
        let dy = c.y - boatY;
        const distToBoat = Math.sqrt(dx * dx + dy * dy);
        
        if (distToBoat < BOAT_AVOIDANCE_RADIUS && distToBoat > 0) {
            // Prevent oscillation when nearly aligned - add consistent bias
            if (Math.abs(dx) < 5) {
                dx = g % 2 === 0 ? 5 : -5;  // Each group picks a consistent side
            }
            if (Math.abs(dy) < 5) {
                dy = g % 3 === 0 ? 5 : -5;  // Use different modulo to avoid all going same way
            }
            
            // Calculate angle away from boat
            const fleeAngle = Math.atan2(dy, dx);
            // Blend flee behavior with flow field (stronger when closer)
            const fleeFactor = 1 - (distToBoat / BOAT_AVOIDANCE_RADIUS);
            desiredAngle = fleeAngle * fleeFactor + desiredAngle * (1 - fleeFactor);
        }

        let angleDiff = desiredAngle - c.angle;
        angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
        c.angle += Math.max(-MAX_TURN, Math.min(MAX_TURN, angleDiff));

        c.x += Math.cos(c.angle) * c.speed;
        c.y += Math.sin(c.angle) * c.speed;

        c.x = Math.max(margin, Math.min(ow - margin, c.x));
        c.y = Math.max(margin, Math.min(oh - floorHeight, c.y));
    }

    // Update little fish
    for (let i = 0; i < fishState.length; i++) {
        const fish = fishState[i];
        const el = fishElements[i];
        const c = groupCenters[fish.groupIndex];
        if (!el || !c) continue;

        fish.x = c.x + fish.offsetX;
        fish.y = c.y + fish.offsetY;
        fish.angle = c.angle;

        el.style.left = fish.x + 'px';
        el.style.top = fish.y + 'px';
        el.style.transform = `translate(-50%, -50%) rotate(${fish.angle}rad)`;
        el.style.visibility = fish.y >= surfaceY ? 'visible' : 'hidden';
    }

    // Update big fish - constrain to ±10° of horizontal, stay in outer box
    for (let i = 0; i < bigFishState.length; i++) {
        const fish = bigFishState[i];
        const el = bigFishElements[i];
        if (!el) continue;

        // Create 2D flow field for big fish
        const noiseX = flowNoise(fish.x, fish.y, t + fish.phase, fish.f1, fish.f2, fish.f3);
        const noiseY = flowNoise(fish.y, fish.x, t + fish.phase + 100, fish.f2, fish.f1, fish.f3);
        let desiredAngle = Math.atan2(noiseY, noiseX);

        // Boat avoidance for big fish
        let dx = fish.x - boatX;
        let dy = fish.y - boatY;
        const distToBoat = Math.sqrt(dx * dx + dy * dy);
        
        if (distToBoat < BOAT_AVOIDANCE_RADIUS && distToBoat > 0) {
            // Prevent oscillation when nearly aligned
            if (Math.abs(dx) < 5) {
                dx = i % 2 === 0 ? 5 : -5;  // Each big fish picks a consistent side
            }
            if (Math.abs(dy) < 5) {
                dy = i % 3 === 0 ? 5 : -5;
            }
            
            const fleeAngle = Math.atan2(dy, dx);
            const fleeFactor = 1 - (distToBoat / BOAT_AVOIDANCE_RADIUS);
            desiredAngle = fleeAngle * fleeFactor + desiredAngle * (1 - fleeFactor);
        }

        fish.angle = clampAngleToHorizontal(desiredAngle, fish.angle, BIG_FISH_ANGLE_LIMIT);

        fish.x += Math.cos(fish.angle) * fish.speed;
        fish.y += Math.sin(fish.angle) * fish.speed * 0.3;  // Less vertical movement

        fish.x = Math.max(margin, Math.min(ow - margin, fish.x));
        fish.y = Math.max(margin, Math.min(oh - floorHeight, fish.y));

        el.style.left = fish.x + 'px';
        el.style.top = fish.y + 'px';
        el.style.transform = `translate(-50%, -50%) rotate(${fish.angle}rad)`;
        el.style.visibility = fish.y >= surfaceY ? 'visible' : 'hidden';
    }

    // Octopus - always visible (stays at bottom) - subtle drift
    if (octopusElement) {
        const driftX = 2 * Math.sin(t * 0.3) + 1 * Math.sin(t * 0.17);
        octopusElement.style.transform = `translate(calc(-50% + ${driftX}px), 0)`;
    }

    animationId = requestAnimationFrame(animate);
}

export function initWaterFish(waterElement) {
    if (!waterElement) return;
    if (animationId) cancelAnimationFrame(animationId);
    spawnFish(waterElement);
    animationId = requestAnimationFrame(animate);
}

export function stopWaterFish() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    oceanLayer?.remove();
    oceanLayer = null;
    seaFloorElement?.remove();
    seaFloorElement = null;
    fishElements.forEach(el => el?.remove());
    fishElements = [];
    fishState = [];
    groupCenters = [];
    bigFishElements.forEach(el => el?.remove());
    bigFishElements = [];
    bigFishState = [];
    octopusElement?.remove();
    octopusElement = null;
}
