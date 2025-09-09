/**
 * 高级国际化语言控制器 - Advanced I18n Language Controller
 * 
 * 功能特点：
 * - 支持多语言切换和自动检测
 * - 基于 JSON 的翻译文件管理
 * - 支持变量插值和复数形式
 * - 命名空间支持
 * - 实时语言切换
 * - 本地存储用户偏好
 * - 性能优化的缓存机制
 * - 丰富的事件系统
 */
class AdvancedLanguageController {
    constructor(options = {}) {
        // 核心配置
        this.supportedLanguages = options.supportedLanguages || ['zh', 'en'];
        this.defaultLanguage = options.defaultLanguage || 'zh';
        this.storageKey = options.storageKey || 'site-language-preference';
        this.fallbackLanguage = options.fallbackLanguage || 'en';
        
        // 初始化当前语言为默认语言
        this.currentLanguage = this.defaultLanguage;
        
        // 翻译数据存储
        this.translations = {};
        this.cache = new Map();
        
        // 路径配置
        this.translationsPath = options.translationsPath || './assets/i18n/';
        this.translationFileExtension = options.fileExtension || '.json';
        
        // 格式化选项 - 延迟初始化
        this.formatters = null;
        
        // 状态标志
        this.isLoading = false;
        this.isInitialized = false;
        
        // 事件监听器
        this.eventListeners = new Map();
        
        // 初始化
        this.init();
    }

    /**
     * 初始化语言控制器
     */
    async init() {
        try {
            this.isLoading = true;
            
            // 加载语言偏好
            this.loadLanguagePreference();
            
            // 加载翻译文件
            await this.loadTranslations(this.currentLanguage);
            
            // 应用语言设置
            await this.applyLanguage(this.currentLanguage);
            
            // 更新界面
            this.updateLanguageButton();
            this.updateDocumentLanguage();
            
            // 初始化格式化器
            this.initFormatters();
            
            // 标记为已初始化
            this.isInitialized = true;
            this.isLoading = false;
            
            // 触发初始化完成事件
            this.emit('initialized', {
                language: this.currentLanguage,
                supportedLanguages: this.supportedLanguages
            });
            
            console.log(`[I18n] Language controller initialized with language: ${this.currentLanguage}`);
            
        } catch (error) {
            console.error('[I18n] Failed to initialize language controller:', error);
            this.isLoading = false;
            
            // 回退到默认语言
            await this.fallbackToDefault();
        }
    }

    /**
     * 加载语言偏好设置
     */
    loadLanguagePreference() {
        try {
            // 1. 首先检查 URL 参数中的语言设置
            const urlParams = new URLSearchParams(window.location.search);
            const urlLang = urlParams.get('lang');
            if (urlLang && this.supportedLanguages.includes(urlLang)) {
                this.currentLanguage = urlLang;
                this.saveLanguagePreference(urlLang);
                return;
            }

            // 2. 检查本地存储的用户偏好
            const savedLanguage = localStorage.getItem(this.storageKey);
            if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
                this.currentLanguage = savedLanguage;
                return;
            }

            // 3. 检测浏览器语言
            const browserLanguage = this.detectBrowserLanguage();
            this.currentLanguage = this.supportedLanguages.includes(browserLanguage) 
                ? browserLanguage 
                : this.defaultLanguage;
                
        } catch (error) {
            console.warn('[I18n] Failed to load language preference:', error);
            this.currentLanguage = this.defaultLanguage;
        }
    }

    /**
     * 检测浏览器语言
     */
    detectBrowserLanguage() {
        const languages = [
            navigator.language,
            ...(navigator.languages || []),
            navigator.userLanguage,
            navigator.browserLanguage,
            navigator.systemLanguage
        ].filter(Boolean);

        for (const lang of languages) {
            const mainLang = lang.substring(0, 2).toLowerCase();
            if (this.supportedLanguages.includes(mainLang)) {
                return mainLang;
            }
        }

        return this.defaultLanguage;
    }

    /**
     * 加载翻译文件
     */
    async loadTranslations(language) {
        if (this.translations[language]) {
            return this.translations[language];
        }

        try {
            const response = await fetch(`${this.translationsPath}${language}${this.translationFileExtension}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load translation file for ${language}: ${response.status}`);
            }
            
            const translations = await response.json();
            this.translations[language] = translations;
            
            console.log(`[I18n] Loaded translations for ${language}`);
            return translations;
            
        } catch (error) {
            console.error(`[I18n] Failed to load translations for ${language}:`, error);
            
            // 如果不是回退语言，尝试加载回退语言
            if (language !== this.fallbackLanguage && this.supportedLanguages.includes(this.fallbackLanguage)) {
                console.log(`[I18n] Attempting to load fallback language: ${this.fallbackLanguage}`);
                return await this.loadTranslations(this.fallbackLanguage);
            }
            
            throw error;
        }
    }

    /**
     * 获取翻译文本
     */
    t(key, options = {}) {
        const cacheKey = `${this.currentLanguage}:${key}:${JSON.stringify(options)}`;
        
        // 检查缓存
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const translation = this.getNestedTranslation(key, this.currentLanguage);
            let result = this.processTranslation(translation, options);
            
            // 缓存结果
            this.cache.set(cacheKey, result);
            
            return result;
            
        } catch (error) {
            console.warn(`[I18n] Translation not found for key: ${key}`, error);
            
            // 尝试回退语言
            if (this.currentLanguage !== this.fallbackLanguage) {
                try {
                    const fallbackTranslation = this.getNestedTranslation(key, this.fallbackLanguage);
                    return this.processTranslation(fallbackTranslation, options);
                } catch (fallbackError) {
                    console.warn(`[I18n] Fallback translation not found for key: ${key}`);
                }
            }
            
            // 返回键名作为最后的回退
            return key;
        }
    }

    /**
     * 获取嵌套的翻译值
     */
    getNestedTranslation(key, language) {
        const translations = this.translations[language];
        if (!translations) {
            throw new Error(`No translations loaded for language: ${language}`);
        }
        
        const keys = key.split('.');
        let result = translations;
        
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                throw new Error(`Translation key not found: ${key}`);
            }
        }
        
        return result;
    }

    /**
     * 处理翻译（插值、复数等）
     */
    processTranslation(translation, options = {}) {
        if (typeof translation !== 'string') {
            // 处理复数形式
            if (typeof translation === 'object' && 'count' in options) {
                return this.handlePluralization(translation, options.count, options);
            }
            return translation;
        }
        
        // 处理变量插值
        return this.interpolate(translation, options);
    }

    /**
     * 处理复数形式
     */
    handlePluralization(pluralObject, count, options = {}) {
        let key;
        
        if (count === 0 && 'zero' in pluralObject) {
            key = 'zero';
        } else if (count === 1 && 'one' in pluralObject) {
            key = 'one';
        } else if ('other' in pluralObject) {
            key = 'other';
        } else {
            // 回退到第一个可用的键
            key = Object.keys(pluralObject)[0];
        }
        
        const template = pluralObject[key];
        return this.interpolate(template, { ...options, count });
    }

    /**
     * 变量插值
     */
    interpolate(template, variables = {}) {
        if (typeof template !== 'string') {
            return template;
        }
        
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            if (key in variables) {
                const value = variables[key];
                
                // 如果值是日期对象，格式化它
                if (value instanceof Date) {
                    return this.formatters.date.format(value);
                }
                
                // 如果值是数字，格式化它
                if (typeof value === 'number') {
                    return this.formatters.number.format(value);
                }
                
                return value;
            }
            
            return match;
        });
    }

    /**
     * 切换语言
     */
    async switchLanguage() {
        if (this.isLoading) {
            console.warn('[I18n] Language switch in progress, please wait...');
            return;
        }
        
        const currentIndex = this.supportedLanguages.indexOf(this.currentLanguage);
        const nextIndex = (currentIndex + 1) % this.supportedLanguages.length;
        const newLanguage = this.supportedLanguages[nextIndex];
        
        await this.setLanguage(newLanguage);
    }

    /**
     * 设置特定语言
     */
    async setLanguage(language) {
        if (!this.supportedLanguages.includes(language)) {
            console.warn(`[I18n] Unsupported language: ${language}`);
            return false;
        }

        if (language === this.currentLanguage) {
            console.log(`[I18n] Language ${language} is already active`);
            return true;
        }

        try {
            this.isLoading = true;
            const previousLanguage = this.currentLanguage;
            
            // 触发语言切换开始事件
            this.emit('languageChangeStart', {
                from: previousLanguage,
                to: language
            });

            // 更新当前语言
            this.currentLanguage = language;

            // 加载翻译文件
            await this.loadTranslations(language);

            // 应用语言设置
            await this.applyLanguage(language);

            // 保存偏好
            this.saveLanguagePreference(language);

            // 更新界面
            this.updateLanguageButton();
            this.updateDocumentLanguage();
            
            // 更新格式化器
            this.initFormatters();
            
            // 清除缓存
            this.cache.clear();

            this.isLoading = false;

            // 触发语言切换完成事件
            this.emit('languageChanged', {
                language: language,
                previousLanguage: previousLanguage
            });

            console.log(`[I18n] Language switched from ${previousLanguage} to ${language}`);
            return true;

        } catch (error) {
            console.error(`[I18n] Failed to switch to language ${language}:`, error);
            this.isLoading = false;
            
            // 触发错误事件
            this.emit('error', {
                type: 'languageSwitch',
                message: error.message,
                language: language
            });
            
            return false;
        }
    }

    /**
     * 应用语言设置到页面元素
     */
    async applyLanguage(language) {
        try {
            // 处理 data-i18n 属性的元素
            const i18nElements = document.querySelectorAll('[data-i18n]');
            i18nElements.forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (key) {
                    const translation = this.t(key);
                    if (translation && translation !== key) {
                        element.textContent = translation;
                    }
                }
            });

            // 兼容旧的 data-en/data-zh 属性方式
            const legacyElements = document.querySelectorAll('[data-en], [data-zh]');
            const attributeName = `data-${language}`;
            
            legacyElements.forEach(element => {
                const text = element.getAttribute(attributeName);
                if (text) {
                    // 保存原始文本
                    if (!element.hasAttribute('data-original')) {
                        element.setAttribute('data-original', element.textContent.trim());
                    }
                    element.textContent = text;
                }
            });

            // 处理 input 元素的 placeholder
            const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
            placeholderElements.forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                if (key) {
                    const translation = this.t(key);
                    if (translation && translation !== key) {
                        element.placeholder = translation;
                    }
                }
            });

            // 处理 title 属性
            const titleElements = document.querySelectorAll('[data-i18n-title]');
            titleElements.forEach(element => {
                const key = element.getAttribute('data-i18n-title');
                if (key) {
                    const translation = this.t(key);
                    if (translation && translation !== key) {
                        element.title = translation;
                    }
                }
            });
            
        } catch (error) {
            console.error('[I18n] Failed to apply language:', error);
            throw error;
        }
    }

    /**
     * 更新语言切换按钮显示
     */
    updateLanguageButton() {
        const button = document.getElementById('language-switch-btn');
        if (button) {
            const nextLanguage = this.getNextLanguage();
            const nextLanguageName = this.t(`language.${nextLanguage}`) || 
                                   (nextLanguage === 'zh' ? '中文' : 'English');
            button.textContent = nextLanguageName;
            button.setAttribute('title', this.t('common.switchLanguage') || 'Switch Language');
        }
        
        // 兼容旧的方式
        const legacyButtons = document.querySelectorAll('[onclick*="switchLanguage"][data-en][data-zh]');
        legacyButtons.forEach(button => {
            const nextLanguage = this.getNextLanguage();
            const nextLanguageName = button.getAttribute(`data-${nextLanguage}`);
            if (nextLanguageName) {
                button.textContent = nextLanguageName;
            }
        });
    }

    /**
     * 获取下一个语言
     */
    getNextLanguage() {
        const currentIndex = this.supportedLanguages.indexOf(this.currentLanguage);
        const nextIndex = (currentIndex + 1) % this.supportedLanguages.length;
        return this.supportedLanguages[nextIndex];
    }

    /**
     * 更新文档语言属性
     */
    updateDocumentLanguage() {
        document.documentElement.lang = this.currentLanguage;
        document.documentElement.setAttribute('dir', this.getTextDirection(this.currentLanguage));
    }

    /**
     * 获取文本方向
     */
    getTextDirection(language) {
        // RTL 语言列表
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    }

    /**
     * 初始化格式化器
     */
    initFormatters() {
        try {
            const locale = this.getLocaleCode(this.currentLanguage);
            
            this.formatters = {
                currency: new Intl.NumberFormat(locale, { 
                    style: 'currency', 
                    currency: this.getCurrencyCode(this.currentLanguage) 
                }),
                number: new Intl.NumberFormat(locale),
                date: new Intl.DateTimeFormat(locale),
                time: new Intl.DateTimeFormat(locale, { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                datetime: new Intl.DateTimeFormat(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                relative: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
            };
        } catch (error) {
            console.warn('[I18n] Failed to initialize formatters, using fallback:', error);
            
            // 使用回退的格式化器
            const fallbackLocale = 'en-US';
            this.formatters = {
                currency: new Intl.NumberFormat(fallbackLocale, { 
                    style: 'currency', 
                    currency: 'USD' 
                }),
                number: new Intl.NumberFormat(fallbackLocale),
                date: new Intl.DateTimeFormat(fallbackLocale),
                time: new Intl.DateTimeFormat(fallbackLocale, { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                datetime: new Intl.DateTimeFormat(fallbackLocale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                relative: new Intl.RelativeTimeFormat(fallbackLocale, { numeric: 'auto' })
            };
        }
    }

    /**
     * 获取完整的语言代码
     */
    getLocaleCode(language) {
        // 确保语言不为空
        if (!language || typeof language !== 'string') {
            language = this.defaultLanguage;
        }
        
        const localeCodes = {
            'zh': 'zh-CN',
            'en': 'en-US',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'es': 'es-ES',
            'it': 'it-IT',
            'pt': 'pt-BR',
            'ru': 'ru-RU'
        };
        
        return localeCodes[language] || localeCodes[this.defaultLanguage] || 'en-US';
    }

    /**
     * 获取货币代码
     */
    getCurrencyCode(language) {
        // 确保语言不为空
        if (!language || typeof language !== 'string') {
            language = this.defaultLanguage;
        }
        
        const currencyCodes = {
            'zh': 'CNY',
            'en': 'USD',
            'ja': 'JPY',
            'ko': 'KRW',
            'fr': 'EUR',
            'de': 'EUR',
            'es': 'EUR',
            'it': 'EUR'
        };
        
        return currencyCodes[language] || currencyCodes[this.defaultLanguage] || 'USD';
    }

    /**
     * 保存语言偏好到本地存储
     */
    saveLanguagePreference(language) {
        try {
            localStorage.setItem(this.storageKey, language);
            
            // 同时保存到 sessionStorage 以支持会话级别的偏好
            sessionStorage.setItem(this.storageKey, language);
            
            // 如果支持，也保存到 cookie（用于服务器端渲染）
            if (typeof document !== 'undefined') {
                const expires = new Date();
                expires.setFullYear(expires.getFullYear() + 1);
                document.cookie = `${this.storageKey}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
            }
            
        } catch (error) {
            console.warn('[I18n] Unable to save language preference:', error);
        }
    }

    /**
     * 事件系统 - 添加事件监听器
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     */
    off(event, callback) {
        if (!this.eventListeners.has(event)) {
            return;
        }
        
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        if (!this.eventListeners.has(event)) {
            return;
        }
        
        const listeners = this.eventListeners.get(event);
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[I18n] Error in event listener for ${event}:`, error);
            }
        });
        
        // 同时触发 DOM 事件
        this.dispatchCustomEvent(event, data);
    }

    /**
     * 分发自定义 DOM 事件
     */
    dispatchCustomEvent(eventName, data) {
        if (typeof document === 'undefined') return;
        
        const event = new CustomEvent(`i18n:${eventName}`, {
            detail: data,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    /**
     * 格式化数字
     */
    formatNumber(number, options = {}) {
        try {
            if (!this.formatters) {
                this.initFormatters();
            }
            return this.formatters.number.format(number);
        } catch (error) {
            console.warn('[I18n] Number formatting failed:', error);
            return number.toString();
        }
    }

    /**
     * 格式化货币
     */
    formatCurrency(amount, currency = null) {
        try {
            if (!this.formatters) {
                this.initFormatters();
            }
            
            if (currency) {
                const formatter = new Intl.NumberFormat(this.getLocaleCode(this.currentLanguage), {
                    style: 'currency',
                    currency: currency
                });
                return formatter.format(amount);
            }
            return this.formatters.currency.format(amount);
        } catch (error) {
            console.warn('[I18n] Currency formatting failed:', error);
            return amount.toString();
        }
    }

    /**
     * 格式化日期
     */
    formatDate(date, options = {}) {
        try {
            if (!this.formatters) {
                this.initFormatters();
            }
            
            if (options.style) {
                const formatter = new Intl.DateTimeFormat(this.getLocaleCode(this.currentLanguage), options);
                return formatter.format(date);
            }
            return this.formatters.date.format(date);
        } catch (error) {
            console.warn('[I18n] Date formatting failed:', error);
            return date.toString();
        }
    }

    /**
     * 格式化相对时间
     */
    formatRelativeTime(value, unit) {
        try {
            if (!this.formatters) {
                this.initFormatters();
            }
            return this.formatters.relative.format(value, unit);
        } catch (error) {
            console.warn('[I18n] Relative time formatting failed:', error);
            return `${value} ${unit}`;
        }
    }

    /**
     * 回退到默认语言
     */
    async fallbackToDefault() {
        console.warn(`[I18n] Falling back to default language: ${this.defaultLanguage}`);
        
        try {
            await this.loadTranslations(this.defaultLanguage);
            this.currentLanguage = this.defaultLanguage;
            await this.applyLanguage(this.defaultLanguage);
            this.updateLanguageButton();
            this.updateDocumentLanguage();
            this.isInitialized = true;
            
        } catch (error) {
            console.error('[I18n] Failed to fallback to default language:', error);
            // 如果连默认语言都失败了，至少要确保基本功能可用
            this.isInitialized = true;
        }
    }

    /**
     * 动态添加翻译
     */
    addTranslations(language, translations, namespace = '') {
        if (!this.translations[language]) {
            this.translations[language] = {};
        }
        
        if (namespace) {
            if (!this.translations[language][namespace]) {
                this.translations[language][namespace] = {};
            }
            Object.assign(this.translations[language][namespace], translations);
        } else {
            Object.assign(this.translations[language], translations);
        }
        
        // 清除相关缓存
        this.clearCacheForLanguage(language);
        
        console.log(`[I18n] Added translations for ${language}${namespace ? ' (namespace: ' + namespace + ')' : ''}`);
    }

    /**
     * 清除特定语言的缓存
     */
    clearCacheForLanguage(language) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${language}:`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * 获取当前语言
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * 获取支持的语言列表
     */
    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    /**
     * 检查是否已初始化
     */
    isReady() {
        return this.isInitialized && !this.isLoading;
    }

    /**
     * 重置到默认设置
     */
    async reset() {
        try {
            // 清除本地存储
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.storageKey);
            
            // 清除 cookie
            if (typeof document !== 'undefined') {
                document.cookie = `${this.storageKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
            
            // 清除缓存
            this.cache.clear();
            
            // 重新初始化
            this.currentLanguage = this.defaultLanguage;
            await this.init();
            
            console.log('[I18n] Language controller reset to default settings');
            
        } catch (error) {
            console.error('[I18n] Failed to reset language controller:', error);
        }
    }

    /**
     * 手动刷新语言显示
     */
    async refresh() {
        if (!this.isReady()) {
            console.warn('[I18n] Controller not ready for refresh');
            return;
        }
        
        try {
            await this.applyLanguage(this.currentLanguage);
            this.updateLanguageButton();
            this.updateDocumentLanguage();
            
            console.log('[I18n] Language display refreshed');
            
        } catch (error) {
            console.error('[I18n] Failed to refresh language display:', error);
        }
    }

    /**
     * 获取性能统计信息
     */
    getStats() {
        const stats = {
            currentLanguage: this.currentLanguage,
            supportedLanguages: this.supportedLanguages,
            loadedLanguages: Object.keys(this.translations),
            cacheSize: this.cache.size,
            isInitialized: this.isInitialized,
            isLoading: this.isLoading
        };
        
        // 计算翻译键的总数
        let totalKeys = 0;
        for (const lang in this.translations) {
            totalKeys += this.countKeys(this.translations[lang]);
        }
        stats.totalTranslationKeys = totalKeys;
        
        return stats;
    }

    /**
     * 递归计算对象中键的数量
     */
    countKeys(obj) {
        let count = 0;
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                count += this.countKeys(obj[key]);
            } else {
                count++;
            }
        }
        return count;
    }

    /**
     * 销毁实例
     */
    destroy() {
        // 清除所有事件监听器
        this.eventListeners.clear();
        
        // 清除缓存
        this.cache.clear();
        
        // 重置状态
        this.isInitialized = false;
        this.isLoading = false;
        
        console.log('[I18n] Language controller destroyed');
    }
}

// 创建全局语言控制器实例
let languageController;

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 创建高级语言控制器实例
        languageController = new AdvancedLanguageController({
            supportedLanguages: ['zh', 'en'],
            defaultLanguage: 'zh',
            translationsPath: './assets/i18n/',
            storageKey: 'site-language-preference'
        });
        
        // 暴露全局函数供 HTML 调用
        window.switchLanguage = async function() {
            if (languageController) {
                await languageController.switchLanguage();
            }
        };
        
        window.setLanguage = async function(lang) {
            if (languageController) {
                await languageController.setLanguage(lang);
            }
        };
        
        window.getCurrentLanguage = function() {
            return languageController ? languageController.getCurrentLanguage() : 'zh';
        };
        
        window.t = function(key, options = {}) {
            return languageController ? languageController.t(key, options) : key;
        };
        
        // 暴露格式化函数
        window.formatNumber = function(number, options = {}) {
            return languageController ? languageController.formatNumber(number, options) : number.toString();
        };
        
        window.formatCurrency = function(amount, currency = null) {
            return languageController ? languageController.formatCurrency(amount, currency) : amount.toString();
        };
        
        window.formatDate = function(date, options = {}) {
            return languageController ? languageController.formatDate(date, options) : date.toString();
        };
        
        // 等待初始化完成
        await new Promise((resolve) => {
            if (languageController.isReady()) {
                resolve();
            } else {
                languageController.on('initialized', resolve);
            }
        });
        
        console.log('[I18n] Global language controller initialized successfully');
        
    } catch (error) {
        console.error('[I18n] Failed to initialize global language controller:', error);
        
        // 创建简化的回退实例
        languageController = {
            getCurrentLanguage: () => 'zh',
            switchLanguage: () => console.warn('Language controller not available'),
            setLanguage: () => console.warn('Language controller not available'),
            t: (key) => key
        };
        
        window.switchLanguage = languageController.switchLanguage;
        window.setLanguage = languageController.setLanguage;
        window.getCurrentLanguage = languageController.getCurrentLanguage;
        window.t = languageController.t;
    }
});

// 高级事件监听示例
document.addEventListener('i18n:languageChanged', function(event) {
    const { language, previousLanguage } = event.detail;
    console.log(`[I18n] Language changed from ${previousLanguage} to ${language}`);
    
    // 可以在这里执行额外的语言切换逻辑
    // 例如：重新加载某些组件、更新第三方插件的语言等
});

document.addEventListener('i18n:error', function(event) {
    console.error('[I18n] Error occurred:', event.detail);
});

// 性能监控
if (typeof window !== 'undefined' && window.performance) {
    document.addEventListener('i18n:initialized', function() {
        const navigationStart = performance.timing.navigationStart;
        const initTime = Date.now() - navigationStart;
        console.log(`[I18n] Initialization completed in ${initTime}ms`);
    });
}

// 导出类以供模块化使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedLanguageController;
} else if (typeof window !== 'undefined') {
    window.AdvancedLanguageController = AdvancedLanguageController;
}

// 如果是 ES6 模块环境
if (typeof exports !== 'undefined') {
    exports.AdvancedLanguageController = AdvancedLanguageController;
}
