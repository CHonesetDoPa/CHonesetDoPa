/**
 * Typed.js 打字机效果初始化
 * 初始化博客标题的打字机动画效果
 */
(function() {
    // 等待DOM加载完成和typed.min.js库加载完成
    document.addEventListener('DOMContentLoaded', function() {
        // 确保Typed库已加载
        if (typeof Typed !== 'undefined') {
            var typed = new Typed(".blogtitle", {
                strings: ['每一天都是新的一天', 'Everyday is a new day', '毎日が新しい日です'],
                startDelay: 300,
                typeSpeed: 100,
                loop: true,
                backSpeed: 50,
                showCursor: true
            });
        }
    });
})();