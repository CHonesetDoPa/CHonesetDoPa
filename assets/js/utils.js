/**
 * 通用工具函数集合
 * 合并了 clipboard-utils.js 和 page-effects.js 的功能
 * 包含剪贴板操作、页面交互效果等工具函数
 */

// ===== 剪贴板工具函数 =====
(function() {
    /**
     * 复制文本到剪贴板
     * @param {string} data - 要复制的文本内容
     * @param {function} callback - 回调函数，参数为成功/失败状态
     */
    window.copy = function(data, callback) {
        // 优先使用现代的 Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(data).then(function() {
                if (typeof swal !== 'undefined') {
                    swal("Completed！");
                }
                if (callback && typeof callback === 'function') {
                    callback(true);
                }
            }).catch(function(err) {
                console.error('Clipboard API failed, falling back to legacy method:', err);
                copyFallback(data, callback);
            });
        } else {
            // 回退到旧方法作为兼容性支持
            copyFallback(data, callback);
        }
    };

    /**
     * 兼容性复制方法
     * @param {string} data - 要复制的文本内容
     * @param {function} callback - 回调函数，参数为成功/失败状态
     */
    function copyFallback(data, callback) {
        try {
            let input = document.createElement("input");
            input.setAttribute("readonly", "readonly");
            input.value = data;
            document.body.appendChild(input);
            input.select();
            
            // 使用已废弃的方法作为最后的回退选项
            let success = document.execCommand("Copy");
            document.body.removeChild(input);
            
            if (success) {
                if (typeof swal !== 'undefined') {
                    swal("Completed！");
                }
                if (callback && typeof callback === 'function') {
                    callback(true);
                }
            } else {
                if (typeof swal !== 'undefined') {
                    swal("Copy failed!");
                }
                if (callback && typeof callback === 'function') {
                    callback(false);
                }
            }
        } catch (err) {
            console.error('Fallback copy method failed:', err);
            if (typeof swal !== 'undefined') {
                swal("Copy failed!");
            }
            if (callback && typeof callback === 'function') {
                callback(false);
            }
        }
    }
})();

// ===== 页面交互效果 =====
(function() {
    // 控制台消息
    console.clear();
    console.log('每天都是新的一天');

    // 浏览器萌标题切换效果
    let originalTitle = document.title;
    let isTabActive = true;

    window.addEventListener('focus', function() { 
        isTabActive = true;
        document.title = '(ฅ>ω<*ฅ) 诶嘿嘿，你回来啦！';
        
        // 2秒后恢复原标题
        setTimeout(() => {
            if (isTabActive) {
                document.title = originalTitle;
            }
        }, 2000);
    });
    
    window.addEventListener('blur', function() { 
        isTabActive = false;
        document.title = '╭(°A°`)╮ 你要去哪里？';
    });

    // 页面加载时保存原始标题
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            originalTitle = document.title;
        });
    } else {
        originalTitle = document.title;
    }
})();

// ===== 其他工具函数 =====

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
window.debounce = function(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
    };
};

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
window.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * 简单的事件发布订阅模式
 */
window.EventBus = (function() {
    const events = {};
    
    return {
        on(event, callback) {
            if (!events[event]) {
                events[event] = [];
            }
            events[event].push(callback);
        },
        
        off(event, callback) {
            if (events[event]) {
                const index = events[event].indexOf(callback);
                if (index > -1) {
                    events[event].splice(index, 1);
                }
            }
        },
        
        emit(event, data) {
            if (events[event]) {
                events[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in event listener for ${event}:`, error);
                    }
                });
            }
        }
    };
})();

/**
 * 检查设备类型
 * @returns {Object} 设备信息
 */
window.getDeviceInfo = function() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent));
    const isDesktop = !isMobile && !isTablet;
    
    return {
        isMobile,
        isTablet,
        isDesktop,
        userAgent,
        touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
};

/**
 * 获取浏览器信息
 * @returns {Object} 浏览器信息
 */
window.getBrowserInfo = function() {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edge') === -1) {
        browserName = 'Chrome';
        browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
        browserName = 'Safari';
        browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Edge') > -1) {
        browserName = 'Edge';
        browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }
    
    return {
        name: browserName,
        version: browserVersion,
        userAgent
    };
};

/**
 * 滚动到指定元素
 * @param {string|HTMLElement} target - 目标元素或选择器
 * @param {Object} options - 滚动选项
 */
window.scrollToElement = function(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
        element.scrollIntoView({ ...defaultOptions, ...options });
    }
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
window.formatFileSize = function(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @param {string} charset - 字符集
 * @returns {string} 随机字符串
 */
window.generateRandomString = function(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
};

/**
 * 检查网络连接状态
 * @returns {Object} 网络状态信息
 */
window.getNetworkStatus = function() {
    return {
        online: navigator.onLine,
        connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection || null,
        effectiveType: (navigator.connection && navigator.connection.effectiveType) || 'unknown'
    };
};

// 导出信息到控制台（开发模式）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(' Utils.js loaded successfully');
    console.log(' Available functions: copy, debounce, throttle, getDeviceInfo, getBrowserInfo, scrollToElement, formatFileSize, generateRandomString, getNetworkStatus');
    console.log(' EventBus available for pub/sub pattern');
}