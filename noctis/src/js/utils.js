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
  let originalTitle = document.title;
  let isTabActive = true;

  window.addEventListener("focus", function () {
    isTabActive = true;
    document.title = "(ฅ>ω<*ฅ) 诶嘿嘿，你回来啦！";

    // 2秒后恢复原标题
    setTimeout(() => {
      if (isTabActive) {
        document.title = originalTitle;
      }
    }, 2000);
  });

  window.addEventListener("blur", function () {
    isTabActive = false;
    if (
      document.title !== "(ฅ>ω<*ฅ) 诶嘿嘿，你回来啦！" &&
      document.title !== "╭(°A°`)╮ 你要去哪里？"
    ) {
      originalTitle = document.title;
    }
    document.title = "╭(°A°`)╮ 你要去哪里？";
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

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
window.debounce = function (func, wait, immediate) {
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
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  console.log(" Utils.js loaded successfully");
  console.log(" Available functions: copy, debounce");
}
