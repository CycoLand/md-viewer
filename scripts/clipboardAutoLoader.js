// Clipboard auto-loader for cycod integration
// Checks URL parameters and automatically loads content from clipboard if requested

import { FileManager } from './fileManager.js';

export class ClipboardAutoLoader {
    constructor() {
        this.checkAndLoadFromClipboard();
    }

    /**
     * Checks if useClipboard parameter is present and loads from clipboard
     */
    async checkAndLoadFromClipboard() {
        const urlParams = new URLSearchParams(window.location.search);
        const useClipboard = urlParams.get('useClipboard');
        
        if (useClipboard === 'true') {
            await this.loadFromClipboard();
        }
    }

    /**
     * Reads clipboard content and creates a new document
     */
    async loadFromClipboard() {
        try {
            // Show loading notification
            this.showNotification('Reading from clipboard...', 'info');
            
            // Request clipboard permission and read text
            const text = await navigator.clipboard.readText();
            
            if (!text || text.trim().length === 0) {
                this.showNotification('Clipboard is empty', 'warning');
                return;
            }
            
            // Create a new file with the clipboard content
            const fileName = this.generateFileName();
            const fileId = FileManager.addFile(fileName, text);
            
            // Select the newly created file to display it
            FileManager.selectFile(fileId);
            
            // Show success notification
            this.showNotification('Agent response loaded successfully!', 'success');
            
            // Clean up URL (remove the parameter)
            this.cleanUpUrl();
            
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                this.showNotification(
                    'Clipboard access denied. Please allow clipboard permissions and refresh the page.',
                    'error',
                    10000 // Show for 10 seconds
                );
            } else {
                this.showNotification(
                    `Failed to read clipboard: ${error.message}`,
                    'error'
                );
            }
            console.error('Clipboard read error:', error);
        }
    }

    /**
     * Generates a filename with timestamp
     */
    generateFileName() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        return `Agent Response ${dateStr} ${timeStr}.md`;
    }

    /**
     * Removes the useClipboard parameter from URL without reloading
     */
    cleanUpUrl() {
        const url = new URL(window.location.href);
        url.searchParams.delete('useClipboard');
        window.history.replaceState({}, document.title, url.toString());
    }

    /**
     * Shows a notification to the user
     */
    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            maxWidth: '400px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            animation: 'notificationSlideIn 0.3s ease-out',
            transition: 'opacity 0.3s ease-out'
        });
        
        // Type is shown by an icon as well as the color. Dark text: white on
        // these fills measured 2.2-3.8:1; #0f172a is 4.7:1 or better on each.
        const colors = {
            success: { bg: '#10b981', text: '#0f172a', icon: 'fa-circle-check' },
            error: { bg: '#ef4444', text: '#0f172a', icon: 'fa-circle-xmark' },
            warning: { bg: '#f59e0b', text: '#0f172a', icon: 'fa-triangle-exclamation' },
            info: { bg: '#3b82f6', text: '#0f172a', icon: 'fa-circle-info' }
        };
        
        const color = colors[type] || colors.info;
        notification.style.backgroundColor = color.bg;
        notification.style.color = color.text;
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        const icon = document.createElement('i');
        icon.className = 'fas ' + color.icon;
        icon.setAttribute('aria-hidden', 'true');
        notification.prepend(icon);
        
        // Add animation styles if not already in document
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes notificationSlideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes notificationSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            notification.style.animation = 'notificationSlideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}
