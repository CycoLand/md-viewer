// Collapsible sections management
import { state } from './state.js';

/**
 * Builds collapsible sections from markdown headings
 * @param {HTMLElement} mdEl - The markdown content element
 */
export function buildCollapsibleSections(mdEl) {
    const headings = Array.from(mdEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    if (headings.length === 0) return;

    const sections = [];
    headings.forEach((h, idx) => {
        const level = parseInt(h.tagName.substring(1));
        const section = { heading: h, level, children: [] };
        
        // Find parent
        for (let i = sections.length - 1; i >= 0; i--) {
            if (sections[i].level < level) {
                sections[i].children.push(section);
                section.parent = sections[i];
                break;
            }
        }
        
        sections.push(section);
    });

    sections.forEach(sec => {
        const h = sec.heading;
        const wrapper = document.createElement('div');
        wrapper.className = 'md-section';
        if (sec.level === 1) {
            wrapper.classList.add('level-1');
        }
        h.parentNode.insertBefore(wrapper, h);
        wrapper.appendChild(h);
        h.classList.add('md-heading');

        // Add chevron icon
        const iconWrap = document.createElement('span');
        iconWrap.className = 'md-toggle-icon hidden';
        iconWrap.innerHTML = '<i class="fas fa-chevron-down"></i>';
        h.appendChild(iconWrap);

        // Create body wrapper for non-H1
        if (sec.level > 1) {
            const bodyEl = document.createElement('div');
            bodyEl.className = 'md-section-body';
            wrapper.appendChild(bodyEl);
        }

        let next = wrapper.nextSibling;
        while (next) {
            if (next.nodeType === Node.ELEMENT_NODE) {
                const tagName = next.tagName;
                if (/^H[1-6]$/.test(tagName)) {
                    const nextLevel = parseInt(tagName.substring(1));
                    if (nextLevel <= sec.level) break;
                }
            }
            const toMove = next;
            next = next.nextSibling;
            if (sec.level === 1) {
                wrapper.appendChild(toMove);
            } else {
                const bodyEl = wrapper.querySelector('.md-section-body');
                if (bodyEl) bodyEl.appendChild(toMove);
            }
        }

        // Make heading clickable for level > 1
        if (sec.level > 1) {
            h.style.cursor = 'pointer';
            const bodyEl = wrapper.querySelector('.md-section-body');
            
            h.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSection(wrapper, bodyEl, iconWrap);
            });
        }
    });
}

/**
 * Toggles a collapsible section
 * @param {HTMLElement} section - The section wrapper element
 * @param {HTMLElement} bodyEl - The section body element
 * @param {HTMLElement} iconWrap - The chevron icon wrapper
 */
function toggleSection(section, bodyEl, iconWrap) {
    const isCollapsed = section.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expanding
        section.classList.remove('collapsed');
        if (iconWrap) iconWrap.classList.add('hidden');
        if (bodyEl) {
            bodyEl.style.maxHeight = '0px';
            requestAnimationFrame(() => {
                bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px';
            });
        }
    } else {
        // Collapsing
        section.classList.add('collapsed');
        if (iconWrap) iconWrap.classList.remove('hidden');
        if (bodyEl) {
            bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px';
            requestAnimationFrame(() => {
                bodyEl.style.maxHeight = '0px';
            });
        }
    }
}

/**
 * Remeasures section heights after content changes
 * @param {HTMLElement} section - The section to remeasure
 */
export function remeasureSection(section) {
    const bodyEl = section.querySelector('.md-section-body');
    if (bodyEl && !section.classList.contains('collapsed')) {
        bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px';
    }
}

/**
 * Sets up collapse/expand functionality based on URL hash
 * @param {HTMLElement} mdEl - The markdown content element
 */
export function setupHashBasedCollapse(mdEl) {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const targetEl = document.getElementById(hash);
    if (!targetEl) return;

    // Find all ancestor sections
    let current = targetEl;
    const ancestorSections = [];
    while (current && current !== mdEl) {
        if (current.classList && current.classList.contains('md-section')) {
            ancestorSections.push(current);
        }
        current = current.parentElement;
    }

    // Collapse all sections except ancestors and H1
    mdEl.querySelectorAll('.md-section').forEach(section => {
        const isH1 = section.classList.contains('level-1');
        const isAncestor = ancestorSections.includes(section);
        const iconWrap = section.querySelector('.md-toggle-icon');

        if (!isH1 && !isAncestor) {
            // Collapse this section
            section.classList.add('collapsed');
            if (iconWrap) iconWrap.classList.remove('hidden');
            const bodyEl = section.querySelector('.md-section-body');
            if (bodyEl) {
                bodyEl.style.maxHeight = '0px';
            }
        } else if (!isH1 && isAncestor) {
            // Expand ancestor sections
            section.classList.remove('collapsed');
            if (iconWrap) iconWrap.classList.add('hidden');
            const bodyEl = section.querySelector('.md-section-body');
            if (bodyEl) {
                bodyEl.style.maxHeight = '0px';
                requestAnimationFrame(() => {
                    bodyEl.style.maxHeight = bodyEl.scrollHeight + 'px';
                });
            } else {
                requestAnimationFrame(() => remeasureSection(section));
            }
        }
    });
}
