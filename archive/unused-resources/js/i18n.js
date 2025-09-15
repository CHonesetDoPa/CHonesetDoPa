/**
 * I18n 核心库
 * 提供高级的国际化功能
 */

class I18n {
    constructor(config = {}) {
        // 合并配置
        this.config = Object.assign({}, window.I18nConfig || {}, config);
        
        // 内部状态
        this.translations = {};
        this.currentLanguage = this.config.defaultLanguage;
        this.cache = new Map();
        this.loadPromises = new Map();
        
        // 事件系统
        this.events = new Map();
        
        // 性能监控
        this.stats = {
            loadTimes: {},
            lookupTimes: [],
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    /**
     * 初始化 i18n 系统
     */
    async init() {
        const startTime = performance.now();
        
        try {
            // 检测语言
            await this.detectLanguage();
            
            // 加载当前语言的翻译
            await this.loadLanguage(this.currentLanguage);
            
            // 预加载其他语言（如果配置了）
            if (this.config.preload && this.config.preload.enabled) {
                this.preloadLanguages();
            }
            
            // 记录初始化时间
            const initTime = performance.now() - startTime;
            this.stats.initTime = initTime;
            
            if (this.config.performance && this.config.performance.logLoadTimes) {
                console.log(`[I18n] Initialized in ${initTime.toFixed(2)}ms`);
            }
            
            this.emit('initialized', {
                language: this.currentLanguage,
                initTime: initTime
            });
            
            return true;
            
        } catch (error) {
            console.error('[I18n] Initialization failed:', error);
            this.emit('error', { type: 'init', error });
            return false;
        }
    }

    /**
     * 检测语言
     */
    async detectLanguage() {
        let detectedLanguage = this.config.defaultLanguage;
        
        // 1. 检查 URL 参数
        if (this.config.autoDetect && this.config.autoDetect.urlFirst) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLang = urlParams.get(this.config.autoDetect.urlParam || 'lang');
            if (urlLang && this.config.supportedLanguages.includes(urlLang)) {
                detectedLanguage = urlLang;
            }
        }
        
        // 2. 检查本地存储
        if (detectedLanguage === this.config.defaultLanguage) {
            const stored = localStorage.getItem(this.config.storageKey);
            if (stored && this.config.supportedLanguages.includes(stored)) {
                detectedLanguage = stored;
            }
        }
        
        // 3. 检测浏览器语言
        if (detectedLanguage === this.config.defaultLanguage && this.config.autoDetect && this.config.autoDetect.enabled) {
            const browserLang = this.detectBrowserLanguage();
            if (browserLang) {
                detectedLanguage = browserLang;
            }
        }
        
        this.currentLanguage = detectedLanguage;
        
        // 保存到本地存储
        this.saveLanguagePreference(detectedLanguage);
        
        return detectedLanguage;
    }

    /**
     * 检测浏览器语言
     */
    detectBrowserLanguage() {
        const languages = [
            navigator.language,
            ...(navigator.languages || []),
            navigator.userLanguage,
            navigator.browserLanguage
        ].filter(Boolean);

        for (const lang of languages) {
            const shortLang = lang.substring(0, 2).toLowerCase();
            if (this.config.supportedLanguages.includes(shortLang)) {
                return shortLang;
            }
        }

        return null;
    }

    /**
     * 加载语言翻译文件
     */
    async loadLanguage(language) {
        if (this.translations[language]) {
            return this.translations[language];
        }
        
        // 如果已经在加载中，返回现有的 Promise
        if (this.loadPromises.has(language)) {
            return this.loadPromises.get(language);
        }
        
        const startTime = performance.now();
        
        const loadPromise = this.fetchTranslations(language);
        this.loadPromises.set(language, loadPromise);
        
        try {
            const translations = await loadPromise;
            this.translations[language] = translations;
            
            const loadTime = performance.now() - startTime;
            this.stats.loadTimes[language] = loadTime;
            
            if (this.config.performance && this.config.performance.logLoadTimes) {
                console.log(`[I18n] Loaded ${language} in ${loadTime.toFixed(2)}ms`);
            }
            
            this.emit('languageLoaded', { language, loadTime });
            
            return translations;
            
        } catch (error) {
            console.error(`[I18n] Failed to load language ${language}:`, error);
            this.emit('error', { type: 'load', language, error });
            throw error;
        } finally {
            this.loadPromises.delete(language);
        }
    }

    /**
     * 获取翻译文件
     */
    async fetchTranslations(language) {
        const url = `${this.config.translationsPath}${language}${this.config.fileExtension}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * 预加载语言
     */
    async preloadLanguages() {
        const languagesToPreload = this.config.preload.languages.length > 0 
            ? this.config.preload.languages 
            : this.config.supportedLanguages.filter(lang => lang !== this.currentLanguage);
        
        const promises = languagesToPreload.map(lang => 
            this.loadLanguage(lang).catch(error => {
                console.warn(`[I18n] Failed to preload ${lang}:`, error);
            })
        );
        
        await Promise.all(promises);
        console.log(`[I18n] Preloaded ${languagesToPreload.length} languages`);
    }

    /**
     * 获取翻译
     */
    t(key, options = {}) {
        const startTime = this.config.performance && this.config.performance.logLookupTimes 
            ? performance.now() : null;
        
        try {
            const cacheKey = this.generateCacheKey(key, options);
            
            // 检查缓存
            if (this.cache.has(cacheKey)) {
                this.stats.cacheHits++;
                return this.cache.get(cacheKey);
            }
            
            this.stats.cacheMisses++;
            
            // 获取翻译
            let translation = this.getTranslation(key, this.currentLanguage);
            
            // 处理翻译（插值、复数等）
            translation = this.processTranslation(translation, options);
            
            // 缓存结果
            this.setCacheValue(cacheKey, translation);
            
            return translation;
            
        } catch (error) {
            return this.handleMissingTranslation(key, error);
        } finally {
            if (startTime) {
                const lookupTime = performance.now() - startTime;
                this.stats.lookupTimes.push(lookupTime);
            }
        }
    }

    /**
     * 获取原始翻译值
     */
    getTranslation(key, language) {
        const translations = this.translations[language];
        if (!translations) {
            throw new Error(`Language ${language} not loaded`);
        }
        
        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                throw new Error(`Translation key ${key} not found`);
            }
        }
        
        return value;
    }

    /**
     * 处理翻译（插值、复数等）
     */
    processTranslation(translation, options = {}) {
        if (typeof translation === 'object' && translation !== null) {
            // 处理复数
            if ('count' in options) {
                return this.handlePluralization(translation, options);
            }
            return translation;
        }
        
        if (typeof translation === 'string') {
            // 处理插值
            return this.interpolate(translation, options);
        }
        
        return translation;
    }

    /**
     * 处理复数形式
     */
    handlePluralization(pluralRules, options) {
        const { count } = options;
        
        let rule;
        if (count === 0 && 'zero' in pluralRules) {
            rule = 'zero';
        } else if (count === 1 && 'one' in pluralRules) {
            rule = 'one';
        } else if ('other' in pluralRules) {
            rule = 'other';
        } else {
            rule = Object.keys(pluralRules)[0];
        }
        
        const template = pluralRules[rule];
        return this.interpolate(template, options);
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
                
                // 格式化特殊类型的值
                if (value instanceof Date) {
                    return this.formatDate(value);
                } else if (typeof value === 'number') {
                    return this.formatNumber(value);
                }
                
                return value;
            }
            
            return match;
        });
    }

    /**
     * 处理缺失的翻译
     */
    handleMissingTranslation(key, error) {
        if (this.config.errorHandling && this.config.errorHandling.logWarnings) {
            console.warn(`[I18n] Missing translation for key: ${key}`, error);
        }
        
        // 尝试回退语言
        if (this.currentLanguage !== this.config.fallbackLanguage) {
            try {
                return this.getTranslation(key, this.config.fallbackLanguage);
            } catch (fallbackError) {
                // 回退也失败了
            }
        }
        
        // 根据配置决定返回什么
        switch (this.config.errorHandling && this.config.errorHandling.missingKeyBehavior) {
            case 'empty':
                return '';
            case 'fallback':
                return key.split('.').pop(); // 返回最后一部分作为回退
            default:
                return key;
        }
    }

    /**
     * 切换语言
     */
    async setLanguage(language) {
        if (!this.config.supportedLanguages.includes(language)) {
            throw new Error(`Unsupported language: ${language}`);
        }
        
        if (language === this.currentLanguage) {
            return true;
        }
        
        const previousLanguage = this.currentLanguage;
        
        try {
            // 加载新语言
            await this.loadLanguage(language);
            
            // 更新当前语言
            this.currentLanguage = language;
            
            // 保存偏好
            this.saveLanguagePreference(language);
            
            // 清除缓存
            this.clearCache();
            
            // 更新 URL（如果配置了）
            if (this.config.autoDetect && this.config.autoDetect.updateUrl) {
                this.updateUrl(language);
            }
            
            // 触发事件
            this.emit('languageChanged', {
                language,
                previousLanguage
            });
            
            return true;
            
        } catch (error) {
            console.error(`[I18n] Failed to set language to ${language}:`, error);
            this.emit('error', { type: 'setLanguage', language, error });
            return false;
        }
    }

    /**
     * 生成缓存键
     */
    generateCacheKey(key, options) {
        return `${this.currentLanguage}:${key}:${JSON.stringify(options)}`;
    }

    /**
     * 设置缓存值
     */
    setCacheValue(key, value) {
        if (!this.config.cache || !this.config.cache.enabled) {
            return;
        }
        
        // 检查缓存大小限制
        if (this.cache.size >= (this.config.cache.maxSize || 1000)) {
            // 删除最旧的条目
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, value);
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
        this.stats.cacheHits = 0;
        this.stats.cacheMisses = 0;
    }

    /**
     * 保存语言偏好
     */
    saveLanguagePreference(language) {
        try {
            localStorage.setItem(this.config.storageKey, language);
        } catch (error) {
            console.warn('[I18n] Failed to save language preference:', error);
        }
    }

    /**
     * 更新 URL
     */
    updateUrl(language) {
        const url = new URL(window.location);
        url.searchParams.set(this.config.autoDetect.urlParam || 'lang', language);
        window.history.replaceState({}, '', url);
    }

    /**
     * 格式化数字
     */
    formatNumber(number, options = {}) {
        try {
            const locale = this.config.localeMapping[this.currentLanguage] || this.currentLanguage;
            const formatter = new Intl.NumberFormat(locale, options);
            return formatter.format(number);
        } catch (error) {
            console.warn('[I18n] Number formatting failed:', error);
            return number.toString();
        }
    }

    /**
     * 格式化日期
     */
    formatDate(date, options = {}) {
        try {
            const locale = this.config.localeMapping[this.currentLanguage] || this.currentLanguage;
            const formatter = new Intl.DateTimeFormat(locale, options);
            return formatter.format(date);
        } catch (error) {
            console.warn('[I18n] Date formatting failed:', error);
            return date.toString();
        }
    }

    /**
     * 格式化货币
     */
    formatCurrency(amount, currency = null) {
        try {
            const locale = this.config.localeMapping[this.currentLanguage] || this.currentLanguage;
            const currencyCode = currency || this.config.currencyMapping[this.currentLanguage] || 'USD';
            
            const formatter = new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currencyCode
            });
            
            return formatter.format(amount);
        } catch (error) {
            console.warn('[I18n] Currency formatting failed:', error);
            return amount.toString();
        }
    }

    /**
     * 事件系统
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[I18n] Error in event callback for ${event}:`, error);
                }
            });
        }
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            currentLanguage: this.currentLanguage,
            loadedLanguages: Object.keys(this.translations),
            cacheSize: this.cache.size,
            cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0,
            ...this.stats
        };
    }

    /**
     * 销毁实例
     */
    destroy() {
        this.clearCache();
        this.events.clear();
        this.loadPromises.clear();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
} else if (typeof window !== 'undefined') {
    window.I18n = I18n;
}
