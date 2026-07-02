/**
 * Fumadocs-style TOC scroll spy — tracks all headings visible in the scroll container.
 */

export class TocScrollSpy {
    constructor() {
        this.items = [];
        this.single = false;
        this.observer = null;
        this.listeners = new Set();
        this.scrollRoot = null;
    }

    listen(listener) {
        this.listeners.add(listener);
    }

    unlisten(listener) {
        this.listeners.delete(listener);
    }

    setItems(tocItems) {
        if (this.observer) {
            for (const item of this.items) {
                const element = document.getElementById(item.id);
                if (element) this.observer.unobserve(element);
            }
        }

        this.items = tocItems
            .filter((item) => item.id)
            .map((item) => ({
                id: item.id,
                active: false,
                fallback: false,
                t: 0,
                original: item
            }));

        this.observeItems();
        this.notify();
    }

    watch(scrollRoot) {
        this.scrollRoot = scrollRoot;
        if (this.observer) return;

        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersect(entries),
            {
                root: scrollRoot,
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
            }
        );

        this.observeItems();
    }

    disconnect() {
        this.observer?.disconnect();
        this.observer = null;
        this.scrollRoot = null;
        this.listeners.clear();
        this.items = [];
    }

    observeItems() {
        if (!this.observer) return;

        for (const item of this.items) {
            const element = document.getElementById(item.id);
            if (element) this.observer.observe(element);
        }
    }

    handleIntersect(entries) {
        if (entries.length === 0) return;

        let hasActive = false;
        const updated = this.items.map((item) => {
            const entry = entries.find((e) => e.target.id === item.id);
            let active = entry ? entry.isIntersecting : item.active && !item.fallback;

            if (this.single && hasActive) active = false;

            if (item.active !== active) {
                item = { ...item, active, fallback: false, t: Date.now() };
            }

            if (active) hasActive = true;
            return item;
        });

        if (!hasActive && entries[0]?.rootBounds) {
            const viewTop = entries[0].rootBounds.top;
            let min = Number.MAX_VALUE;
            let fallbackIdx = -1;

            for (let i = 0; i < updated.length; i++) {
                const element = document.getElementById(updated[i].id);
                if (!element) continue;

                const distance = Math.abs(viewTop - element.getBoundingClientRect().top);
                if (distance < min) {
                    min = distance;
                    fallbackIdx = i;
                }
            }

            if (fallbackIdx !== -1) {
                updated[fallbackIdx] = {
                    ...updated[fallbackIdx],
                    active: true,
                    fallback: true,
                    t: Date.now()
                };
            }
        }

        this.items = updated;
        this.notify();
    }

    notify() {
        for (const listener of this.listeners) {
            listener(this.items);
        }
    }

    getItems() {
        return this.items;
    }
}

let spyInstance = null;

export function getTocScrollSpy() {
    if (!spyInstance) {
        spyInstance = new TocScrollSpy();
    }
    return spyInstance;
}

export function resetTocScrollSpy() {
    spyInstance?.disconnect();
    spyInstance = null;
}
