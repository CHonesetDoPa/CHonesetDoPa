// 获取浏览器语言
var userLang = navigator.language || navigator.userLanguage;

// 根据浏览器语言自动切换
if (userLang.startsWith('en')) {
  loadContent('en');
} else if (userLang.startsWith('zh')) {
  loadContent('zh');
}

// 手动切换
function changeLanguage(lang) {
  loadContent(lang);
}

// 使用AJAX动态更新内容
function loadContent(lang) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.body.innerHTML = this.responseText;
    }
  };
  xhttp.open('GET', 'content/content-' + lang + '.html', true);
  xhttp.send();
}
