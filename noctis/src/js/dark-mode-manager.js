/**
 * dark-mode-manager.js
 * Auto dark mode with vampire mode support.
 */

import "./utils.js";
import Swal from "sweetalert2";

class AutoDarkModeManager {
  constructor() {
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.storageKey = "ch-auto-dark-mode";
    this.vampireStorageKey = "ch-vampire-mode";
    this.isDarkMode = false;
    this.isVampireMode = false;

    this.init();
  }

  init() {
    // 检查本地存储的状态
    this.loadSavedState();

    // 监听系统深色模式变化
    this.mediaQuery.addEventListener("change", (e) => {
      if (!this.isVampireMode) {
        // 血族模式时不响应系统变化
        this.handleSystemModeChange(e.matches);
      }
    });

    // 初始化应用模式
    this.applyCurrentMode();

    // 监听页面可见性变化，用于同步其他标签页的状态
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.syncFromStorage();
      }
    });

    // 监听存储变化（跨标签页同步）
    window.addEventListener("storage", (e) => {
      if (e.key === this.storageKey || e.key === this.vampireStorageKey) {
        this.syncFromStorage();
      }
    });

    // 监听i18n语言变化
    document.addEventListener("i18n:languageChanged", (event) => {
      this.handleLanguageChange(
        event.detail.language,
        event.detail.previousLanguage,
      );
    });
  }

  loadSavedState() {
    try {
      // 加载暗黑模式状态
      const savedDarkState = localStorage.getItem(this.storageKey);
      if (savedDarkState !== null) {
        this.isDarkMode = JSON.parse(savedDarkState);
      } else {
        // 首次访问，使用系统偏好
        this.isDarkMode = this.mediaQuery.matches;
      }

      // 加载血族模式状态
      const savedVampireState = localStorage.getItem(this.vampireStorageKey);
      if (savedVampireState !== null) {
        this.isVampireMode = JSON.parse(savedVampireState);
      }
    } catch (e) {
      console.warn("Failed to load mode states:", e);
      this.isDarkMode = this.mediaQuery.matches;
      this.isVampireMode = false;
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.isDarkMode));
      localStorage.setItem(
        this.vampireStorageKey,
        JSON.stringify(this.isVampireMode),
      );

      // 跨标签页同步依赖浏览器原生的 storage 事件（真实事件只在其他标签页触发），
      // 同标签页状态已在本地更新，无需手动合成 StorageEvent 自广播。
    } catch (e) {
      console.warn("Failed to save mode states:", e);
    }
  }

  syncFromStorage() {
    const savedDarkState = localStorage.getItem(this.storageKey);
    const savedVampireState = localStorage.getItem(this.vampireStorageKey);

    let stateChanged = false;

    if (savedDarkState !== null) {
      const newDarkState = JSON.parse(savedDarkState);
      if (newDarkState !== this.isDarkMode) {
        this.isDarkMode = newDarkState;
        stateChanged = true;
      }
    }

    if (savedVampireState !== null) {
      const newVampireState = JSON.parse(savedVampireState);
      if (newVampireState !== this.isVampireMode) {
        this.isVampireMode = newVampireState;
        stateChanged = true;
      }
    }

    if (stateChanged) {
      this.applyCurrentMode();
    }
  }

  handleLanguageChange(newLanguage, previousLanguage) {
    // 当语言切换到vampire时激活血族模式
    if (newLanguage === "vampire" && !this.isVampireMode) {
      this.activateVampireMode(false); // 不显示提示，因为i18n系统已经显示了
    }
    // 当从vampire语言切换出去时，如果是血族模式则退出
    else if (previousLanguage === "vampire" && this.isVampireMode) {
      this.deactivateVampireMode();
    }
  }

  handleSystemModeChange(isSystemDark) {
    // 血族模式时不响应系统变化
    if (this.isVampireMode) {
      return;
    }

    // 自动跟随系统深色模式变化
    this.isDarkMode = isSystemDark;
    this.applyCurrentMode();
    this.saveState();

    // Display notification
    {
      const t = window.t || ((k) => k);
      Swal.fire({
        title: t("greeting.autoModeSwitch.title"),
        text: isSystemDark
          ? t("greeting.autoModeSwitch.dark")
          : t("greeting.autoModeSwitch.light"),
        icon: "info",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  }

  applyCurrentMode() {
    const body = document.body;

    if (this.isVampireMode) {
      body.classList.remove("dark-mode");
      body.classList.add("vampire-mode");
    } else if (this.isDarkMode) {
      body.classList.remove("vampire-mode");
      body.classList.add("dark-mode");
    } else {
      body.classList.remove("dark-mode", "vampire-mode");
    }

    // 触发模式变化事件
    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: {
          mode: this.getCurrentMode(),
          isDark: this.isDarkMode,
          isVampire: this.isVampireMode,
        },
      }),
    );
  }

  activateVampireMode(showNotification = true) {
    this.isVampireMode = true;
    this.applyCurrentMode();
    this.saveState();

    console.log("[Theme] Vampire mode activated!");

    if (showNotification) {
      const t = window.t || ((k) => k);
      Swal.fire({
        title: t("greeting.vampireMode.activated"),
        text: t("greeting.vampireMode.welcome"),
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  }

  deactivateVampireMode() {
    this.isVampireMode = false;
    this.applyCurrentMode();
    this.saveState();

    console.log("[Theme] Vampire mode deactivated!");
  }

  toggle() {
    if (this.isVampireMode) {
      // 从血族模式切换到普通模式
      this.deactivateVampireMode();
    } else {
      // 在普通暗黑模式间切换
      this.isDarkMode = !this.isDarkMode;
      this.applyCurrentMode();
      this.saveState();
    }

    // Show toggle notification
    {
      const t = window.t || ((k) => k);
      const message = this.isVampireMode
        ? t("greeting.modeSwitch.vampireExit")
        : this.isDarkMode
          ? t("greeting.modeSwitch.dark")
          : t("greeting.modeSwitch.light");
      Swal.fire({
        title: t("greeting.modeSwitch.title"),
        text: message,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }

  getCurrentMode() {
    if (this.isVampireMode) return "vampire";
    return this.isDarkMode ? "dark" : "light";
  }
}

// Global instance
let autoDarkModeManager = null;

function initAutoDarkMode() {
  if (!autoDarkModeManager) {
    autoDarkModeManager = new AutoDarkModeManager();
    window.autoDarkModeManager = autoDarkModeManager;
    console.log(" Auto dark mode manager initialized");
  }
}

// Compatible with original dark() function
function dark() {
  autoDarkModeManager.toggle();
}

// Activate vampire mode
function activateVampireMode(showNotification = true) {
  autoDarkModeManager.activateVampireMode(showNotification);
}

// Deactivate vampire mode
function deactivateVampireMode() {
  autoDarkModeManager.deactivateVampireMode();
}

// Auto-initialize after page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAutoDarkMode);
} else {
  initAutoDarkMode();
}

// Export to global scope
window.dark = dark;
window.activateVampireMode = activateVampireMode;
window.deactivateVampireMode = deactivateVampireMode;

// Export class
export { AutoDarkModeManager };
