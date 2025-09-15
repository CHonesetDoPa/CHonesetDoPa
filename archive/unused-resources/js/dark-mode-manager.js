/**
 * 自动夜间模式管理器
 * 自动检测系统深色模式偏好并在页面间同步状态
 */
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
        
        // 显示提示信息
        if (typeof swal !== 'undefined') {
            const message = isSystemDark 
                ? "检测到系统切换到深色模式，已自动开启夜间模式" 
                : "检测到系统切换到浅色模式，已自动关闭夜间模式";
            swal({
                title: "模式自动切换",
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

        // 更新按钮状态（如果存在）
        this.updateButtonState();
    }

    updateButtonState() {
        const darkButton = document.querySelector('.dark-button');
        if (darkButton) {
            if (this.isDarkMode) {
                darkButton.title = '当前为夜间模式，点击切换到浅色模式';
            } else {
                darkButton.title = '当前为浅色模式，点击切换到夜间模式';
            }
        }
    }

    toggle() {
        this.isDarkMode = !this.isDarkMode;
        this.applyDarkMode();
        this.saveState();
        
        // 显示切换提示
        if (typeof swal !== 'undefined') {
            const message = this.isDarkMode ? "已切换到夜间模式" : "已切换到浅色模式";
            swal({
                title: "模式已切换",
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

    // 获取模式信息用于调试
    getModeInfo() {
        return {
            current: this.getCurrentMode(),
            system: this.isSystemDarkMode() ? 'dark' : 'light',
            autoFollowSystem: true
        };
    }
}

// 全局实例
let autoDarkModeManager = null;

// 初始化函数
function initAutoDarkMode() {
    if (!autoDarkModeManager) {
        autoDarkModeManager = new AutoDarkModeManager();
        
        // 更新全局变量
        window.autoDarkModeManager = autoDarkModeManager;
        
        // 在控制台显示初始化信息
        console.log('🌙 自动夜间模式管理器已初始化');
        console.log('模式信息:', autoDarkModeManager.getModeInfo());
    }
    return autoDarkModeManager;
}

// 兼容原有的 dark() 函数
function dark() {
    if (autoDarkModeManager) {
        autoDarkModeManager.toggle();
    } else {
        // 降级到原有实现
        document.body.classList.toggle("dark-mode");
    }
}

// 获取当前模式状态
function getCurrentDarkMode() {
    return autoDarkModeManager ? autoDarkModeManager.getCurrentMode() : 'light';
}

// 检查是否为夜间模式
function isDarkModeActive() {
    return autoDarkModeManager ? autoDarkModeManager.isDarkMode : false;
}

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoDarkMode);
} else {
    initAutoDarkMode();
}

// 导出到全局作用域
window.initAutoDarkMode = initAutoDarkMode;
window.getCurrentDarkMode = getCurrentDarkMode;
window.isDarkModeActive = isDarkModeActive;
