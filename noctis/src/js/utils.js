/**
 * utils.js
 * Clipboard, page interaction and misc utilities.
 */

import Swal from "sweetalert2";

// ===== 剪贴板工具函数 =====
(function () {
  /**
   * 复制文本到剪贴板（使用 Clipboard API）
   * @param {string} data - 要复制的文本内容
   */
  window.copy = function (data) {
    navigator.clipboard
      .writeText(data)
      .then(function () {
        Swal.fire({ title: window.t("common.copySuccess") });
      })
      .catch(function (err) {
        console.error("Clipboard API failed:", err);
        Swal.fire({
          title: window.t("common.copyFailed"),
          icon: "error",
        });
      });
  };
})();

// ===== 页面交互效果 =====
(function () {
  // 控制台消息
  console.clear();
  console.log("每天都是新的一天");

  // 浏览器萌标题切换效果
  const tOr = (key, fallback) => {
    const v = typeof window.t === "function" ? window.t(key) : null;
    return v && v !== key ? v : fallback;
  };
  const titleBack = () =>
    tOr("common.tabTitleBack", "(ฅ>ω<*ฅ) 诶嘿嘿，你回来啦！");
  const titleGone = () => tOr("common.tabTitleGone", "╭(°A°`)╮ 你要去哪里？");

  let originalTitle = document.title;
  let isTabActive = true;

  window.addEventListener("focus", function () {
    isTabActive = true;
    document.title = titleBack();

    // 2秒后恢复原标题
    setTimeout(() => {
      if (isTabActive) {
        document.title = originalTitle;
      }
    }, 2000);
  });

  window.addEventListener("blur", function () {
    isTabActive = false;
    const gone = titleGone();
    if (document.title !== titleBack() && document.title !== gone) {
      originalTitle = document.title;
    }
    document.title = gone;
  });

  // 语言切换时同步未激活标签页的标题
  document.addEventListener("i18n:languageChanged", () => {
    if (!isTabActive) document.title = titleGone();
  });

  // 页面加载时保存原始标题
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      originalTitle = document.title;
    });
  } else {
    originalTitle = document.title;
  }
})();

// ===== 其他工具函数 =====

// ES Modules 导出
export const copy = window.copy;

// 导出信息到控制台（开发模式）
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  console.log(" Utils.js loaded successfully");
  console.log(" Available functions: copy");
}
