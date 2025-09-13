/**
 * 剪贴板复制工具函数
 * 提供现代和兼容性的复制功能
 */
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
                swal("Completed！");
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
                swal("Completed！");
                if (callback && typeof callback === 'function') {
                    callback(true);
                }
            } else {
                swal("Copy failed!");
                if (callback && typeof callback === 'function') {
                    callback(false);
                }
            }
        } catch (err) {
            console.error('Fallback copy method failed:', err);
            swal("Copy failed!");
            if (callback && typeof callback === 'function') {
                callback(false);
            }
        }
    }
})();