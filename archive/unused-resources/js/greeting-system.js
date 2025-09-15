/**
 * 问候系统
 * 根据当前时间显示不同的问候消息
 */
(function() {
    window.addEventListener('load', function() {
        // 确保自动夜间模式管理器已初始化
        setTimeout(() => {
            var now = new Date();
            var hour = now.getHours();
            
            if (hour > 0) {
                if (hour < 6) {
                    swal({ 
                        title: "凌晨了!", 
                        text: "注意休息~", 
                        icon: "info" 
                    });
                } else if (hour < 9) {
                    swal({ 
                        title: "早上好!", 
                        text: "Good morning", 
                        icon: "info" 
                    });
                } else if (hour > 21 && hour < 24) {
                    // 检查是否有 isDarkModeActive 函数可用
                    var currentMode = "浅色模式";
                    if (typeof isDarkModeActive === 'function') {
                        currentMode = isDarkModeActive() ? "夜间模式" : "浅色模式";
                    }
                    
                    swal({
                        title: "晚上好!",
                        text: `当前已自动设置为${currentMode}，系统会根据您的设备偏好自动调整~`,
                        icon: "info",
                        timer: 4000,
                        buttons: false
                    });
                }
            }
        }, 100);
    });
})();