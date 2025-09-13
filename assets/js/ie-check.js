/**
 * IE浏览器兼容性检查
 * 检测用户是否使用IE浏览器，并提示使用现代浏览器
 */
(function() {
    if (!!window.ActiveXObject || "ActiveXObject" in window) { // is IE?
        alert('内个,这边建议您使用Chrome/Firefox浏览器呢~');
    }
})();