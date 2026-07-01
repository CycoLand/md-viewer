// Water Progress Bar - Controls water level based on scroll position
// Note: Queries elements each update because generateTOC() replaces the water bar DOM.
import { state } from './state.js';
import { initWaterFish } from './waterFish.js';

export class WaterProgressBar {
    constructor() {
        this.scrollContainer = null;
        this.isActive = false;
        this.init();
    }

    init() {
        setTimeout(() => {
            this.scrollContainer = document.getElementById('content-area');

            if (!this.scrollContainer) return;

            this.scrollContainer.addEventListener('scroll', () => {
                this.updateWaterLevel();
            }, { passive: true });

            document.addEventListener('tocUpdated', () => {
                this.updateVisibility();
            });

            document.addEventListener('togglePagination', () => {
                setTimeout(() => this.updateVisibility(), 100);
            });

            this.updateVisibility();
        }, 100);
    }

    getContainer() {
        return document.querySelector('.water-progress-container');
    }

    updateVisibility() {
        const container = this.getContainer();
        const paginationActive = document.querySelector('.page-navigation')?.classList.contains('active') || false;
        const toc = document.getElementById('toc');
        const tocVisible = state.settings.showTOC && !toc?.classList.contains('force-hidden');
        const shouldShow = Boolean(
            state.settings.showWaterProgressBar
            && state.currentFileId
            && !state.rawMode
            && !paginationActive
            && tocVisible
        );

        if (container) {
            container.classList.toggle('hidden', !shouldShow);
        }

        this.isActive = shouldShow;

        if (shouldShow) {
            this.updateWaterLevel();
            const water = document.getElementById('water-level');
            if (water) initWaterFish(water);
        }
    }

    updateWaterLevel() {
        if (!this.isActive || !this.scrollContainer) return;

        const waterElement = document.getElementById('water-level');
        if (!waterElement) return;

        const scrollTop = this.scrollContainer.scrollTop;
        const scrollHeight = this.scrollContainer.scrollHeight;
        const clientHeight = this.scrollContainer.clientHeight;

        const maxScroll = scrollHeight - clientHeight;
        let scrollPercentage = 0;

        if (maxScroll > 0) {
            scrollPercentage = (scrollTop / maxScroll) * 100;
            scrollPercentage = Math.min(100, Math.max(0, scrollPercentage));
        }

        const waterPercentage = 100 - scrollPercentage;
        waterElement.style.height = waterPercentage + '%';
    }

    onFileChange() {
        this.updateVisibility();
        setTimeout(() => this.updateWaterLevel(), 100);
    }
}

let waterProgressBarInstance = null;

export function initWaterProgressBar() {
    if (!waterProgressBarInstance) {
        waterProgressBarInstance = new WaterProgressBar();
    }
    return waterProgressBarInstance;
}

export function getWaterProgressBar() {
    return waterProgressBarInstance;
}
