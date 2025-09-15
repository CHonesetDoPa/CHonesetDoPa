/**
 * System Managers Collection
 * Merged functionality from dark-mode-manager.js and greeting-system.js
 * Includes automatic dark mode management and greeting system
 */

// ===== Auto Dark Mode Manager =====
class AutoDarkModeManager {
    constructor() {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.storageKey = 'ch-auto-dark-mode';
        this.isDarkMode = false;
        
        this.init();
    }

    init() {
        // 检查本地存储的状态
        this.loadSavedState();
        
        // 监听系统深色模式变化
        this.mediaQuery.addEventListener('change', (e) => {
            this.handleSystemModeChange(e.matches);
        });

        // 初始化应用模式
        this.applyDarkMode();
        
        // 监听页面可见性变化，用于同步其他标签页的状态
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncFromStorage();
            }
        });

        // 监听存储变化（跨标签页同步）
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.syncFromStorage();
            }
        });
    }

    loadSavedState() {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (savedState !== null) {
                this.isDarkMode = JSON.parse(savedState);
            } else {
                // 首次访问，使用系统偏好
                this.isDarkMode = this.mediaQuery.matches;
            }
        } catch (e) {
            console.warn('Failed to load dark mode state:', e);
            this.isDarkMode = this.mediaQuery.matches;
        }
    }

    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.isDarkMode));
            
            // 广播状态变化到其他标签页
            window.dispatchEvent(new StorageEvent('storage', {
                key: this.storageKey,
                newValue: JSON.stringify(this.isDarkMode),
                url: window.location.href
            }));
        } catch (e) {
            console.warn('Failed to save dark mode state:', e);
        }
    }

    syncFromStorage() {
        const savedState = localStorage.getItem(this.storageKey);
        if (savedState !== null) {
            const newState = JSON.parse(savedState);
            if (newState !== this.isDarkMode) {
                this.isDarkMode = newState;
                this.applyDarkMode();
            }
        }
    }

    handleSystemModeChange(isSystemDark) {
        // 自动跟随系统深色模式变化
        this.isDarkMode = isSystemDark;
        this.applyDarkMode();
        this.saveState();
        
        // Display notification
        if (typeof swal !== 'undefined') {
            const message = isSystemDark 
                ? "Detected system switch to dark mode, dark mode automatically enabled" 
                : "Detected system switch to light mode, dark mode automatically disabled";
            swal({
                title: "Auto Mode Switch",
                text: message,
                icon: "info",
                timer: 3000,
                buttons: false
            });
        }
    }

    applyDarkMode() {
        const body = document.body;
        
        if (this.isDarkMode) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }

        // Update button state (if exists)
        this.updateButtonState();
    }

    updateButtonState() {
        const darkButton = document.querySelector('.dark-button');
        if (darkButton) {
            if (this.isDarkMode) {
                darkButton.title = 'Currently in dark mode, click to switch to light mode';
            } else {
                darkButton.title = 'Currently in light mode, click to switch to dark mode';
            }
        }
    }

    toggle() {
        this.isDarkMode = !this.isDarkMode;
        this.applyDarkMode();
        this.saveState();
        
        // Show toggle notification
        if (typeof swal !== 'undefined') {
            const message = this.isDarkMode ? "Switched to dark mode" : "Switched to light mode";
            swal({
                title: "Mode Switched",
                text: message,
                icon: "success",
                timer: 2000,
                buttons: false
            });
        }
    }

    getCurrentMode() {
        return this.isDarkMode ? 'dark' : 'light';
    }

    isSystemDarkMode() {
        return this.mediaQuery.matches;
    }

    // Get mode info for debugging
    getModeInfo() {
        return {
            current: this.getCurrentMode(),
            system: this.isSystemDarkMode() ? 'dark' : 'light',
            autoFollowSystem: true
        };
    }
}

// ===== Greeting System =====
class GreetingSystem {
    constructor() {
        this.greetings = {
            dawn: { title: "It's late at night!", text: "Please take a rest~", icon: "info" },
            morning: { title: "Good morning!", text: "Have a great day", icon: "info" },
            evening: { title: "Good evening!", text: "Currently set to {mode}, the system will automatically adjust according to your device preferences~", icon: "info" }
        };
        
        this.init();
    }

    init() {
        // Show greeting after page loads
        window.addEventListener('load', () => {
            // Ensure other systems are initialized
            setTimeout(() => {
                this.showGreeting();
            }, 100);
        });
    }

    showGreeting() {
        if (typeof swal === 'undefined') {
            console.log('Greeting System: SweetAlert not loaded, skipping greeting display');
            return;
        }

        const now = new Date();
        const hour = now.getHours();
        
        if (hour > 0) {
            if (hour < 6) {
                // Dawn (0-6 AM)
                swal(this.greetings.dawn);
            } else if (hour < 9) {
                // Morning (6-9 AM)
                swal(this.greetings.morning);
            } else if (hour > 21 && hour < 24) {
                // Evening (9 PM - 12 AM)
                this.showEveningGreeting();
            }
        }
    }

    showEveningGreeting() {
        // Check if dark mode manager exists
        let currentMode = "light mode";
        if (window.autoDarkModeManager && typeof window.autoDarkModeManager.getCurrentMode === 'function') {
            currentMode = window.autoDarkModeManager.getCurrentMode() === 'dark' ? "dark mode" : "light mode";
        } else if (typeof isDarkModeActive === 'function') {
            currentMode = isDarkModeActive() ? "dark mode" : "light mode";
        }
        
        const greeting = { ...this.greetings.evening };
        greeting.text = greeting.text.replace('{mode}', currentMode);
        greeting.timer = 4000;
        greeting.buttons = false;
        
        swal(greeting);
    }

    // Manually trigger greeting
    triggerGreeting(type = 'auto') {
        if (type === 'auto') {
            this.showGreeting();
        } else if (this.greetings[type]) {
            swal(this.greetings[type]);
        }
    }

    // Custom greeting message
    setCustomGreeting(type, greeting) {
        if (this.greetings[type]) {
            this.greetings[type] = { ...this.greetings[type], ...greeting };
        }
    }
}

// ===== Performance Monitor =====
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            domReady: 0,
            firstPaint: 0,
            firstContentfulPaint: 0
        };
        
        this.init();
    }

    init() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            this.recordMetrics();
        });

        // Monitor DOM ready time
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.metrics.domReady = performance.now();
            });
        } else {
            this.metrics.domReady = performance.now();
        }
    }

    recordMetrics() {
        try {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.loadTime = navigation.loadEventEnd - navigation.navigationStart;
            }

            // Record First Paint and First Contentful Paint
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                if (entry.name === 'first-paint') {
                    this.metrics.firstPaint = entry.startTime;
                } else if (entry.name === 'first-contentful-paint') {
                    this.metrics.firstContentfulPaint = entry.startTime;
                }
            });

            // Output performance info in development environment
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log(' Performance Metrics:', this.metrics);
            }
        } catch (error) {
            console.warn('Performance monitoring failed:', error);
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }
}

// ===== System Status Monitor =====
class SystemStatusMonitor {
    constructor() {
        this.status = {
            online: navigator.onLine,
            visibility: document.visibilityState,
            darkMode: false,
            language: document.documentElement.lang || 'zh'
        };
        
        this.init();
    }

    init() {
        // Listen to network status
        window.addEventListener('online', () => {
            this.status.online = true;
            this.onStatusChange('network', 'online');
        });

        window.addEventListener('offline', () => {
            this.status.online = false;
            this.onStatusChange('network', 'offline');
        });

        // Listen to page visibility
        document.addEventListener('visibilitychange', () => {
            this.status.visibility = document.visibilityState;
            this.onStatusChange('visibility', document.visibilityState);
        });

        // Listen to language changes
        document.addEventListener('i18n:languageChanged', (event) => {
            this.status.language = event.detail.language;
            this.onStatusChange('language', event.detail.language);
        });
    }

    onStatusChange(type, value) {
        // Trigger custom event
        window.dispatchEvent(new CustomEvent('systemStatusChange', {
            detail: { type, value, status: this.getStatus() }
        }));

        // Log status changes in development environment
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(` System status changed - ${type}:`, value);
        }
    }

    getStatus() {
        return { ...this.status };
    }
}

// ===== Global Instances and Initialization =====

// Global instances
let autoDarkModeManager = null;
let greetingSystem = null;
let performanceMonitor = null;
let systemStatusMonitor = null;

// Initialization function
function initSystemManagers() {
    try {
        // Initialize dark mode manager
        if (!autoDarkModeManager) {
            autoDarkModeManager = new AutoDarkModeManager();
            window.autoDarkModeManager = autoDarkModeManager;
            console.log(' Auto dark mode manager initialized');
        }

        // Initialize greeting system
        if (!greetingSystem) {
            greetingSystem = new GreetingSystem();
            window.greetingSystem = greetingSystem;
            console.log(' Greeting system initialized');
        }

        // Initialize performance monitor
        if (!performanceMonitor) {
            performanceMonitor = new PerformanceMonitor();
            window.performanceMonitor = performanceMonitor;
        }

        // Initialize system status monitor
        if (!systemStatusMonitor) {
            systemStatusMonitor = new SystemStatusMonitor();
            window.systemStatusMonitor = systemStatusMonitor;
        }

        return true;
    } catch (error) {
        console.error('System managers initialization failed:', error);
        return false;
    }
}

// Compatible with original dark() function
function dark() {
    if (autoDarkModeManager) {
        autoDarkModeManager.toggle();
    } else {
        // Fallback to original implementation
        document.body.classList.toggle("dark-mode");
    }
}

// Get current mode status
function getCurrentDarkMode() {
    return autoDarkModeManager ? autoDarkModeManager.getCurrentMode() : 'light';
}

// Check if dark mode is active
function isDarkModeActive() {
    return autoDarkModeManager ? autoDarkModeManager.isDarkMode : false;
}

// Get system status
function getSystemStatus() {
    return {
        darkMode: getCurrentDarkMode(),
        performance: performanceMonitor ? performanceMonitor.getMetrics() : {},
        system: systemStatusMonitor ? systemStatusMonitor.getStatus() : {}
    };
}

// Auto-initialize after page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSystemManagers);
} else {
    initSystemManagers();
}

// Export to global scope
window.initSystemManagers = initSystemManagers;
window.getCurrentDarkMode = getCurrentDarkMode;
window.isDarkModeActive = isDarkModeActive;
window.getSystemStatus = getSystemStatus;

// Export classes (for module environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AutoDarkModeManager,
        GreetingSystem,
        PerformanceMonitor,
        SystemStatusMonitor
    };
}