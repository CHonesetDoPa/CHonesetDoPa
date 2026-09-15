/**
 * link-manager.js
 * Link manager integrating config, interactions and UI rendering.
 */
import { ConfigManager } from "./link-manager/config-manager.js";
import { InteractionHandler } from "./link-manager/interaction-handler.js";
import { UIRenderer } from "./link-manager/ui-renderer.js";

class LinkManager {
  constructor() {
    this.configManager = new ConfigManager();
    // Accessibility is now handled by the i18n controller
    this.interactionHandler = new InteractionHandler();
    this.uiRenderer = new UIRenderer();

    this.isInitialized = false;
    this.languageSwitchTimer = null;
  }

  /**
   * 初始化所有组件
   * @param {Object} [config] - 可选的配置对象
   */
  async initializeAll(config) {
    // 如果提供了配置，或者尚未初始化，则进行初始化
    if (config || !this.isInitialized) {
      await this.configManager.init(config);
      this.isInitialized = true;
    }

    const currentConfig = this.configManager.getConfig();

    this.interactionHandler.updateGlobalFunctions(currentConfig);

    // 渲染由 i18nSystemReady 事件统一触发（见文件底部监听），
    // 避免与事件回调产生双重渲染导致 DOM 重建闪动。
  }

  /**
   * 处理语言切换
   */
  handleLanguageSwitch() {
    // 使用防抖避免频繁调用
    if (this.languageSwitchTimer) {
      clearTimeout(this.languageSwitchTimer);
    }

    this.languageSwitchTimer = setTimeout(() => {
      const config = this.configManager.getConfig();
      if (config) {
        this.uiRenderer.renderRelatedSites("related-sites-list", config);
        this.uiRenderer.updateStatusInfo(config);
      }
    }, 50);
  }

  /**
   * 渲染所有组件
   */
  renderComponents() {
    const config = this.configManager.getConfig();
    if (!config) return;

    // 使用 requestAnimationFrame 优化渲染性能
    requestAnimationFrame(() => {
      // 渲染社交媒体图标
      this.uiRenderer.renderSocialMediaIcons(
        "social-media-icons-placeholder",
        config,
      );

      // 渲染社交媒体列表
      this.uiRenderer.renderSocialMediaList("social-media-list", config);

      // 渲染相关网站列表
      this.uiRenderer.renderRelatedSites("related-sites-list", config);

      // 其他更新操作
      this.uiRenderer.updateStatusInfo(config);

      // i18n 系统会处理可访问性文本的更新（title / aria-label）
    });
  }
}

// 创建全局实例
window.linkManager = new LinkManager();

// 监听 i18n 系统就绪事件
document.addEventListener("i18nSystemReady", () => {
  console.log("[LinkManager] I18n system ready, rendering components");
  window.linkManager.renderComponents();
});

document.addEventListener("i18n:languageChanged", () => {
  console.log("[LinkManager] Language changed, updating status info");
  window.linkManager.handleLanguageSwitch();
});
