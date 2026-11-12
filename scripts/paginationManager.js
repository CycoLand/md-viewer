// Pagination management
export class PaginationManager {
    constructor() {
        this.pages = [];
        this.currentPageIndex = 0;
        this.paginationActive = false;
        this.pageHeight = 0;
    }

    toggle() {
        this.paginationActive = !this.paginationActive;
        const btn = document.getElementById('toggle-pagination-btn');
        const contentBody = document.querySelector('.content-body');
        const pageNav = document.getElementById('page-navigation');
        const markdownContent = document.getElementById('markdown-content');
        const toc = document.getElementById('toc');

        if (this.paginationActive) {
            // Reset to first page
            this.currentPageIndex = 0;
            
            // First create pages while content is still visible
            this.createPages();
            
            // Then update UI (the old toolbar button may no longer exist;
            // "View Pages" in the document menu used to throw here)
            btn?.classList.add('active');
            if (btn) btn.innerHTML = '<i class="fas fa-scroll"></i> Scroll';
            contentBody.classList.add('paginated');
            pageNav.classList.add('active');
            markdownContent.style.display = 'none';
            if (toc) toc.style.display = 'none';
            
            this.renderPages();
        } else {
            btn?.classList.remove('active');
            if (btn) btn.innerHTML = '<i class="fas fa-book-open"></i> Pages';
            contentBody.classList.remove('paginated');
            pageNav.classList.remove('active');
            markdownContent.style.display = 'block';
            // Remove inline style to let CSS media query handle TOC visibility
            if (toc) toc.style.display = '';
        }
    }

    createPages() {
        const markdownContent = document.getElementById('markdown-content');
        if (!markdownContent) {
            console.error('Markdown content not found');
            return;
        }

        // Calculate available height from CSS
        const viewportHeight = window.innerHeight;
        const availableHeight = (viewportHeight - 200) * 1.0;
        
        console.log(`Available page height: ${availableHeight}px`);

        // Collect the document's blocks in reading order. Collapsible sections
        // wrap the content (H1 sections directly, deeper ones in a section
        // body), so walk into them. Reading only section bodies dropped the
        // text before the first heading and everything under an H1.
        const children = [];
        const collect = (parent) => {
            Array.from(parent.children).forEach(child => {
                if (child.matches('.document-header, .document-separator')) return;
                if (child.matches('.md-section, .md-section-body')) {
                    collect(child);
                    return;
                }
                const clone = child.cloneNode(true);
                clone.querySelectorAll('.md-toggle-icon').forEach(icon => icon.remove());
                children.push(clone);
            });
        };
        collect(markdownContent);
        
        if (children.length === 0) {
            console.error('No content to paginate');
            const pageDiv = document.createElement('div');
            pageDiv.className = 'markdown-content';
            pageDiv.innerHTML = markdownContent.innerHTML;
            this.pages = [pageDiv];
            console.log('Created 1 page with all content as fallback');
            return;
        }

        console.log(`Creating pages from ${children.length} elements`);

        // Create a temporary container for measuring heights
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = getComputedStyle(document.documentElement)
            .getPropertyValue('--content-max-width').trim() || '75ch';
        tempContainer.style.padding = '3rem 2rem';
        document.body.appendChild(tempContainer);

        this.pages = [];
        let currentPage = document.createElement('div');
        currentPage.className = 'markdown-content';

        children.forEach((child, index) => {
            const testContent = currentPage.cloneNode(true);
            testContent.appendChild(child.cloneNode(true));
            
            tempContainer.innerHTML = '';
            tempContainer.appendChild(testContent);
            const newHeight = tempContainer.scrollHeight;
            
            tempContainer.innerHTML = '';
            const singleElementDiv = document.createElement('div');
            singleElementDiv.className = 'markdown-content';
            singleElementDiv.appendChild(child.cloneNode(true));
            tempContainer.appendChild(singleElementDiv);
            const elementHeight = tempContainer.scrollHeight;
            
            const wouldExceedSignificantly = newHeight > availableHeight * 1.1;
            const elementFitsAlone = elementHeight <= availableHeight * 1.1;
            
            if (wouldExceedSignificantly && currentPage.children.length > 0 && elementFitsAlone) {
                this.pages.push(currentPage);
                console.log(`Page ${this.pages.length} created with ${currentPage.children.length} elements`);
                
                currentPage = document.createElement('div');
                currentPage.className = 'markdown-content';
                currentPage.appendChild(child);
            } else {
                currentPage.appendChild(child);
            }
        });

        if (currentPage.children.length > 0) {
            this.pages.push(currentPage);
            console.log(`Final page ${this.pages.length} created with ${currentPage.children.length} elements`);
        }

        document.body.removeChild(tempContainer);
        console.log(`Created ${this.pages.length} pages with smart pagination`);
    }

    renderPages() {
        const leftPage = document.getElementById('left-page');
        const rightPage = document.getElementById('right-page');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');

        if (!leftPage || !rightPage) {
            console.error('Page containers not found');
            return;
        }

        leftPage.innerHTML = '';
        rightPage.innerHTML = '';

        // Highlights in the copied pages are read-only (their comment still
        // shows on hover), so drop the copies' Tab stop and button role
        const readOnlyHighlights = (content) => {
            content.querySelectorAll('mark.md-highlight').forEach(mark => {
                mark.removeAttribute('tabindex');
                mark.removeAttribute('role');
                mark.removeAttribute('aria-haspopup');
            });
            return content;
        };
        leftPage.classList.remove('visible', 'single');
        rightPage.classList.remove('visible', 'single');

        const totalPages = this.pages.length;
        
        if (totalPages === 0) {
            console.error('No pages to render');
            return;
        }

        if (totalPages === 1) {
            const content = readOnlyHighlights(this.pages[0].cloneNode(true));
            leftPage.appendChild(content);
            leftPage.classList.add('visible', 'single');
        } else if (this.currentPageIndex === 0) {
            const content = readOnlyHighlights(this.pages[0].cloneNode(true));
            leftPage.appendChild(content);
            leftPage.classList.add('visible', 'single');
        } else {
            const leftPageIndex = this.currentPageIndex;
            const rightPageIndex = this.currentPageIndex + 1;

            if (leftPageIndex < totalPages) {
                const leftContent = readOnlyHighlights(this.pages[leftPageIndex].cloneNode(true));
                leftPage.appendChild(leftContent);
                leftPage.classList.add('visible');
            }

            if (rightPageIndex < totalPages) {
                const rightContent = readOnlyHighlights(this.pages[rightPageIndex].cloneNode(true));
                rightPage.appendChild(rightContent);
                rightPage.classList.add('visible');
            }
        }

        prevBtn.disabled = this.currentPageIndex === 0;
        nextBtn.disabled = this.currentPageIndex >= totalPages - 2 && totalPages > 1 || 
                          (totalPages === 1 && this.currentPageIndex >= 0);

        // Re-apply syntax highlighting
        leftPage.querySelectorAll('pre code').forEach(block => {
            if (window.hljs) hljs.highlightElement(block);
        });
        rightPage.querySelectorAll('pre code').forEach(block => {
            if (window.hljs) hljs.highlightElement(block);
        });
    }

    nextPage() {
        const totalPages = this.pages.length;
        
        if (totalPages === 1) return;
        
        if (this.currentPageIndex === 0) {
            this.currentPageIndex = 1;
        } else {
            this.currentPageIndex += 2;
        }
        
        if (this.currentPageIndex >= totalPages) {
            this.currentPageIndex = Math.max(1, totalPages - 2);
        }
        
        this.renderPages();
    }

    prevPage() {
        if (this.currentPageIndex === 1) {
            this.currentPageIndex = 0;
        } else {
            this.currentPageIndex = Math.max(0, this.currentPageIndex - 2);
        }
        
        this.renderPages();
    }
}
