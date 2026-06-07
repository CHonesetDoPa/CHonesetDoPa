/**
 * Utils
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
            let textarea = document.createElement("textarea");
            textarea.setAttribute("readonly", "readonly");
            textarea.value = data;
            // 隐藏元素，避免页面抖动
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            textarea.style.top = '0';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 99999); // 兼容 iOS
            
            // NOTE: document.execCommand('Copy') is deprecated and only used here for legacy browser support.
            // Remove this fallback when support for old browsers is no longer required.
            let success = document.execCommand("Copy");
            document.body.removeChild(textarea);
            
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
        // 在修改标题前，如果当前标题不是萌标题，说明它被其他脚本（如 i18n）修改了，我们应该更新 originalTitle
        if (document.title !== '(ฅ>ω<*ฅ) 诶嘿嘿，你回来啦！' && document.title !== '╭(°A°`)╮ 你要去哪里？') {
            originalTitle = document.title;
        }
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

// ES Modules 导出
export const copy = window.copy;
export const debounce = window.debounce;

// 导出信息到控制台（开发模式）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(' Utils.js loaded successfully');
    console.log(' Available functions: copy, debounce');
}