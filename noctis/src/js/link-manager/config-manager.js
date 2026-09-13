/**
 * config-manager.js
 * Loads and provides link configuration.
 */
export class ConfigManager {
  constructor() {
    this.config = null;
  }

  /**
   * 初始化配置
   * @param {Object} [config] - 可选的配置对象
   * @returns {Promise<void>}
   */
  async init(config) {
    if (this.config) {
      return;
    }

    try {
      // 1. 优先使用传入的配置
      if (config) {
        this.config = config;
        console.log("Link config loaded from arguments");
        return;
      }

      // 未找到配置，使用空对象
      this.config = {};
      console.warn("No link config found, using empty config");
    } catch (error) {
      console.error("Failed to load link config:", error);
      this.config = {};
    }
  }

  getConfig() {
    return this.config;
  }
}
