/**
 * 页面交互效果
 * 包含控制台消息、浏览器标题切换等页面效果
 */
(function() {
    // 控制台消息
    console.clear();
    console.log('每天都是新的一天');

    // 浏览器萌标题切换效果
    window.addEventListener('focus', function() { 
        document.title = '(ฅ>ω<*ฅ) 诶嘿嘿，你回来啦！';
    });
    
    window.addEventListener('blur', function() { 
        document.title = '╭(°A°`)╮ 你要去哪里？';
    });
})();