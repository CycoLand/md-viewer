// File management
import { state, STORAGE_KEY } from './state.js';
import { showRenderedContent, showRawContent } from './markdownRenderer.js';
import { showLoading, hideLoading, getTransitionDuration } from './loadingAnimations.js';
import { launchRocket } from './laserAnimation.js';

export class FileManager {
    static generateId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static addFile(name, content, id = null) {
        const fileId = id || this.generateId();
        state.files.set(fileId, {
            id: fileId,
            name: name,
            content: content,
            modified: new Date().toISOString()
        });
        this.saveFiles();
        this.renderFileList();
        return fileId;
    }

    static removeFile(fileId) {
        state.files.delete(fileId);
        if (state.currentFileId === fileId) {
            state.currentFileId = null;
            this.showWelcomeScreen();
        }
        this.saveFiles();
        this.renderFileList();
    }

    static getFile(fileId) {
        return state.files.get(fileId);
    }

    static saveFiles() {
        try {
            const fileArray = Array.from(state.files.values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fileArray));
        } catch (err) {
            console.error('Error saving files to localStorage:', err);
        }
    }

    static loadFiles() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            this.renderFileList();
            return;
        }
        try {
            const fileArray = JSON.parse(saved);
            state.files = new Map();
            fileArray.forEach(f => {
                const id = f.id || this.generateId();
                state.files.set(id, {
                    id,
                    name: f.name || 'Untitled.md',
                    content: typeof f.content === 'string' ? f.content : '',
                    modified: f.modified || new Date().toISOString()
                });
            });
            this.renderFileList();
        } catch (err) {
            console.error('Error loading files from localStorage:', err);
            this.renderFileList();
        }
    }

    static renderFileList(searchQuery = '') {
        const fileList = document.getElementById('file-list');
        
        if (state.files.size === 0) {
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-text"></i>
                    <p>No files loaded</p>
                    <p class="subtitle">Add some markdown files to get started</p>
                </div>
            `;
            return;
        }

        let fileArray = Array.from(state.files.values());
        
        // Filter by search query if provided
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            fileArray = fileArray.filter(file => {
                const nameMatch = file.name.toLowerCase().includes(query);
                const contentMatch = (file.content || '').toLowerCase().includes(query);
                return nameMatch || contentMatch;
            });
            
            // Show empty state if no matches
            if (fileArray.length === 0) {
                fileList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No files found</p>
                        <p class="subtitle">Try a different search term</p>
                    </div>
                `;
                return;
            }
        }
        
        fileArray = fileArray.sort((a, b) => a.name.localeCompare(b.name));
        
        fileList.innerHTML = fileArray.map(file => {
            // Calculate metadata
            const content = file.content || '';
            const words = content.trim().split(/\s+/).filter(w => w.length > 0);
            const readTime = Math.ceil(words.length / 238);
            const lineCount = content.split('\n').length;
            
            // Format date
            const date = new Date(file.modified);
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            return `
                <div class="file-item ${state.currentFileId === file.id ? 'active' : ''}" data-file-id="${file.id}">
                    <div class="file-item-header">
                        <span class="file-name" title="${file.name}">${file.name}</span>
                        <div class="file-actions">
                            <button class="btn btn-icon" onclick="window.fileManagerRemove('${file.id}')" title="Remove">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="file-meta">
                        <span class="meta-item"><i class="fas fa-clock"></i> ${readTime} min</span>
                        <span class="meta-separator">•</span>
                        <span class="meta-item"><i class="fas fa-list-ol"></i> ${lineCount.toLocaleString()}</span>
                        <span class="meta-separator">•</span>
                        <span class="meta-item"><i class="fas fa-calendar"></i> ${formattedDate}</span>
                    </div>
                </div>
            `;
        }).join('');

        fileList.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.file-actions')) {
                    const fileId = item.dataset.fileId;
                    this.selectFile(fileId, item); // Pass the clicked element
                }
            });
        });
    }

    static selectFile(fileId, clickedElement = null) {
        const file = this.getFile(fileId);
        if (!file) return;

        state.currentFileId = fileId;
        this.renderFileList();
        
        // If we have the clicked element (file-item), launch the rocket
        if (clickedElement && clickedElement.classList.contains('file-item')) {
            launchRocket(clickedElement, () => {
                this.showFile(file);
            });
        } else {
            // No animation, just show the file
            this.showFile(file);
        }
    }

    static showFile(file) {
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('content-area').style.display = 'flex';

        const contentArea = document.getElementById('content-area');
        const transitionDuration = getTransitionDuration();
        
        // Fade out current content
        showLoading(contentArea);

        // Wait for fade out, then load new content
        setTimeout(() => {
            try {
                if (state.rawMode) {
                    showRawContent(file.content);
                } else {
                    showRenderedContent(file.content);
                }
            } catch (error) {
                console.error('Error rendering content:', error);
            }
            
            // Fade in new content
            setTimeout(() => {
                hideLoading(contentArea);
            }, 50); // Small delay to ensure content is rendered
        }, transitionDuration); // Wait for fade out to complete
    }

    static showWelcomeScreen() {
        document.getElementById('welcome-screen').style.display = 'flex';
        document.getElementById('content-area').style.display = 'none';
    }

    static exportCurrentFileAsHtml() {
        if (!state.currentFileId) return;
        
        const file = this.getFile(state.currentFileId);
        if (!file) return;

        const mdContent = document.getElementById('markdown-content');
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(el => el.outerHTML)
            .join('\n');

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${file.name}</title>
    ${styles}
</head>
<body>
    <div class="markdown-content">
        ${mdContent.innerHTML}
    </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.md$/, '.html');
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Expose removeFile to global scope for onclick handlers
window.fileManagerRemove = (fileId) => FileManager.removeFile(fileId);
