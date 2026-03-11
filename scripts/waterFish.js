// Water Fish - Swimming with flow-field noise and boids-lite
// Uses layered sine waves (fractal Brownian motion) for organic paths,
// boundary repulsion for edge avoidance, and separation for natural spacing.

const FISH_COUNT = 4;
const FISH_COLORS = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1'];
const MARGIN = 4;
const BOUNDARY_FORCE = 0.15;
const SEPARATION_DISTANCE = 12;
const SEPARATION_FORCE = 0.08;
const NOISE_STRENGTH = 0.4;
const BASE_SPEED = 0.3;
const MAX_TURN = 0.12;

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

function spawnFish(waterElement) {
    const rect = waterElement.getBoundingClientRect();
    const w = rect.width || 40;
    const h = rect.height || 300;

    fishState = [];
    fishElements.forEach(el => el?.remove());
    fishElements = [];

    for (let i = 0; i < FISH_COUNT; i++) {
        const rnd = mulberry32(i * 7919);
        const state = {
            x: MARGIN + rnd() * (w - 2 * MARGIN),
            y: MARGIN + rnd() * (h - 2 * MARGIN),
            angle: rnd() * Math.PI * 2,
            speed: BASE_SPEED * (0.7 + rnd() * 0.6),
            phase: rnd() * 1000,
            size: 8 + rnd() * 4,
            color: FISH_COLORS[i % FISH_COLORS.length],
            f1: 0.7 + rnd() * 0.6,
            f2: 0.3 + rnd() * 0.4,
            f3: 0.1 + rnd() * 0.2,
        };
        fishState.push(state);

        const fishEl = document.createElement('div');
        fishEl.className = 'water-fish';
        fishEl.innerHTML = createFishSvg(state.color, state.size, i);
        fishEl.dataset.index = i;
        waterElement.appendChild(fishEl);
        fishElements.push(fishEl);
    }
}

function animate(time) {
    const waterElement = document.getElementById('water-level');
    if (!waterElement || !document.querySelector('.water-progress-container')) {
        animationId = null;
        return;
    }

    const rect = waterElement.getBoundingClientRect();
    const w = rect.width || 40;
    const h = rect.height || 300;
    const t = time * 0.001;

    for (let i = 0; i < fishState.length; i++) {
        const fish = fishState[i];
        const el = fishElements[i];
        if (!el) continue;

        // Flow-field: noise influences desired heading
        const noiseVal = flowNoise(fish.x, fish.y, t + fish.phase, fish.f1, fish.f2, fish.f3);
        let desiredAngle = fish.angle + noiseVal * NOISE_STRENGTH;

        // Boundary repulsion - steer away from edges (soft potential field)
        const edgeMargin = MARGIN + 2;
        let boundaryFx = 0, boundaryFy = 0;
        if (fish.x < edgeMargin) boundaryFx += BOUNDARY_FORCE * (edgeMargin - fish.x);
        if (fish.x > w - edgeMargin) boundaryFx -= BOUNDARY_FORCE * (fish.x - (w - edgeMargin));
        if (fish.y < edgeMargin) boundaryFy += BOUNDARY_FORCE * (edgeMargin - fish.y);
        if (fish.y > h - edgeMargin) boundaryFy -= BOUNDARY_FORCE * (fish.y - (h - edgeMargin));

        const boundaryAngle = Math.atan2(boundaryFy, boundaryFx);
        const boundaryStrength = Math.hypot(boundaryFx, boundaryFy);
        if (boundaryStrength > 0.01) {
            const angleDiff = boundaryAngle - fish.angle;
            const wrapped = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
            desiredAngle = fish.angle + Math.max(-MAX_TURN, Math.min(MAX_TURN, wrapped * 2));
        }

        // Boids separation - avoid crowding other fish
        let sepFx = 0, sepFy = 0;
        for (let j = 0; j < fishState.length; j++) {
            if (i === j) continue;
            const other = fishState[j];
            const dx = other.x - fish.x;
            const dy = other.y - fish.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < SEPARATION_DISTANCE) {
                const push = (1 - dist / SEPARATION_DISTANCE) * SEPARATION_FORCE;
                sepFx -= (dx / dist) * push;
                sepFy -= (dy / dist) * push;
            }
        }
        const sepAngle = Math.atan2(sepFy, sepFx);
        const sepStrength = Math.hypot(sepFx, sepFy);
        if (sepStrength > 0.01) {
            const angleDiff = sepAngle - fish.angle;
            const wrapped = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
            desiredAngle = fish.angle + Math.max(-MAX_TURN * 2, Math.min(MAX_TURN * 2, wrapped));
        }

        // Smooth turn toward desired angle
        let angleDiff = desiredAngle - fish.angle;
        angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
        fish.angle += Math.max(-MAX_TURN, Math.min(MAX_TURN, angleDiff));

        // Move forward
        fish.x += Math.cos(fish.angle) * fish.speed;
        fish.y += Math.sin(fish.angle) * fish.speed;

        // Wrap / clamp bounds (soft wrap for continuous feel)
        if (fish.x < -MARGIN) fish.x = w + MARGIN;
        if (fish.x > w + MARGIN) fish.x = -MARGIN;
        if (fish.y < -MARGIN) fish.y = h + MARGIN;
        if (fish.y > h + MARGIN) fish.y = -MARGIN;

        fish.x = Math.max(0, Math.min(w, fish.x));
        fish.y = Math.max(0, Math.min(h, fish.y));

        el.style.left = fish.x + 'px';
        el.style.top = fish.y + 'px';
        el.style.transform = `translate(-50%, -50%) rotate(${fish.angle}rad)`;
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
    fishElements.forEach(el => el?.remove());
    fishElements = [];
    fishState = [];
}
