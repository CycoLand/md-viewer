// Water Progress Bar - Controls water level based on scroll position
// Mirrors the approach used by progressBar.js
// Note: Queries elements each update because generateTOC() replaces the water bar DOM,
// invalidating cached references.
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
            
            this.isActive = true;
            
            this.scrollContainer.addEventListener('scroll', () => {
                this.updateWaterLevel();
            }, { passive: true });

            const onTocUpdated = () => {
                this.updateWaterLevel();
                const water = document.getElementById('water-level');
                if (water) initWaterFish(water);
            };
            document.addEventListener('tocUpdated', onTocUpdated);

            this.updateWaterLevel();
            const water = document.getElementById('water-level');
            if (water) initWaterFish(water);
        }, 100);
    }
    
    updateWaterLevel() {
        if (!this.isActive || !this.scrollContainer) return;
        
        // Query fresh elements each time - TOC regeneration replaces the water bar DOM
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
        
        // Inverse for water (100% at top, 0% at bottom)
        const waterPercentage = 100 - scrollPercentage;
        
        waterElement.style.height = waterPercentage + '%';
        // Boat is inside water element with bottom:100%, so it stays on surface automatically
    }
}
