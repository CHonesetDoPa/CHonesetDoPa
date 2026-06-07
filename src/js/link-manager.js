/*
    * link-manager.js
    * author: CHonesetDoPa
    * version: 2.0.0 (Modularized)
 */
import { ConfigManager } from './link-manager/config-manager.js';
import { InteractionHandler } from './link-manager/interaction-handler.js';
import { UIRenderer } from './link-manager/ui-renderer.js';
import { debounce } from './utils.js';

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
        this.addCustomStyles();
        
        // 使用防抖延迟执行渲染，确保 DOM 已加载
        const renderWithDelay = debounce ? debounce(() => {
            this.renderComponents();
        }, 100) : () => setTimeout(() => this.renderComponents(), 100);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderWithDelay);
        } else {
            renderWithDelay();
        }
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
            // 语言切换时不需要重建 DOM（data-i18n 系统自动更新文本），
            // 避免 container.innerHTML = '' 导致的闪动。
            // 仅更新需要手动处理的状态信息。
            const config = this.configManager.getConfig();
            if (config) {
                this.uiRenderer.updateStatusInfo(config);
                this.uiRenderer.updateCopyright(config);
            }
        }, 50);
    }

    /**
     * 添加自定义样式（精简版）
     */
    addCustomStyles() {
        // 检查是否已经添加过样式
        if (document.getElementById('link-manager-styles')) return;
        
        // 由于主要样式已经移到 index.css 中，这里只保留必要的动态样式
        console.log('Link manager styles are now managed in index.css');
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
            this.uiRenderer.renderSocialMediaIcons('social-media-icons-placeholder', config);

            // 渲染社交媒体列表
            this.uiRenderer.renderSocialMediaList('social-media-list', config);

            // 渲染相关网站列表
            this.uiRenderer.renderRelatedSites('related-sites-list', config);

            // 其他更新操作
            this.uiRenderer.updateStatusInfo(config);
            this.uiRenderer.updateCopyright(config);
            
            // i18n 系统会处理可访问性文本的更新（title / aria-label）
        });
    }
}

// 创建全局实例
window.linkManager = new LinkManager();

// 监听 i18n 系统就绪事件
document.addEventListener('i18nSystemReady', () => {
    console.log('[LinkManager] I18n system ready, rendering components');
    window.linkManager.renderComponents();
});

document.addEventListener('i18n:languageChanged', () => {
    console.log('[LinkManager] Language changed, re-rendering link components');
    window.linkManager.handleLanguageSwitch();
});
