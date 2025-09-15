/**
 * 完整的国际化系统
 * 合并了 i18n-config.js, i18n.js, i18n-init.js, language-controller.js
 * 提供完整的多语言支持功能
 */

// ===== I18n 配置 =====
window.I18nConfig = {
    // 支持的语言列表
    supportedLanguages: ['zh', 'en', 'vampire'],
    
    // 默认语言
    defaultLanguage: 'zh',
    
    // 回退语言
    fallbackLanguage: 'en',
    
    // 翻译文件路径
    translationsPath: './assets/i18n/',
    
    // 翻译文件扩展名
    fileExtension: '.json',
    
    // 本地存储键名
    storageKey: 'site-language-preference',
    
    // 语言名称映射
    languageNames: {
        'zh': '中文',
        'en': 'English',
        'vampire': '🦇血族古语',
        'ja': '日本語',
        'ko': '한국어',
        'fr': 'Français',
        'de': 'Deutsch',
        'es': 'Español',
        'it': 'Italiano',
        'pt': 'Português',
        'ru': 'Русский'
    },
    
    // 语言代码到完整语言环境的映射
    localeMapping: {
        'zh': 'zh-CN',
        'en': 'en-US',
        'vampire': 'zh-CN', // 使用中文格式
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'es': 'es-ES',
        'it': 'it-IT',
        'pt': 'pt-BR',
        'ru': 'ru-RU'
    },
    
    // 货币代码映射
    currencyMapping: {
        'zh': 'CNY',
        'en': 'USD',
        'ja': 'JPY',
        'ko': 'KRW',
        'fr': 'EUR',
        'de': 'EUR',
        'es': 'EUR',
        'it': 'EUR',
        'pt': 'BRL',
        'ru': 'RUB'
    },
    
    // RTL（从右到左）语言列表
    rtlLanguages: ['ar', 'he', 'fa', 'ur'],
    
    // 自动检测选项
    autoDetect: {
        enabled: true,
        urlFirst: true,
        urlParam: 'lang',
        updateUrl: false
    },
    
    // 缓存选项
    cache: {
        enabled: true,
        maxSize: 1000,
        expiration: 30 * 60 * 1000 // 30 分钟
    },
    
    // 错误处理选项
    errorHandling: {
        missingKeyBehavior: 'key',
        logWarnings: true,
        debugMode: false
    }
};

// ===== I18n 核心类 =====
class I18n {
    constructor(config = {}) {
        this.config = Object.assign({}, window.I18nConfig || {}, config);
        this.translations = {};
        this.currentLanguage = this.config.defaultLanguage;
        this.cache = new Map();
        this.loadPromises = new Map();
        this.events = new Map();
        this.stats = {
            loadTimes: {},
            lookupTimes: [],
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    async init() {
        const startTime = performance.now();
        
        try {
            await this.detectLanguage();
            await this.loadLanguage(this.currentLanguage);
            
            const initTime = performance.now() - startTime;
            this.stats.initTime = initTime;
            
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
        this.saveLanguagePreference(detectedLanguage);
        
        return detectedLanguage;
    }

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

    async loadLanguage(language) {
        if (this.translations[language]) {
            return this.translations[language];
        }
        
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

    async fetchTranslations(language) {
        const url = `${this.config.translationsPath}${language}${this.config.fileExtension}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    }

    t(key, options = {}) {
        try {
            const cacheKey = this.generateCacheKey(key, options);
            
            if (this.cache.has(cacheKey)) {
                this.stats.cacheHits++;
                return this.cache.get(cacheKey);
            }
            
            this.stats.cacheMisses++;
            
            let translation = this.getTranslation(key, this.currentLanguage);
            translation = this.processTranslation(translation, options);
            
            this.setCacheValue(cacheKey, translation);
            
            return translation;
        } catch (error) {
            return this.handleMissingTranslation(key, error);
        }
    }

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

    processTranslation(translation, options = {}) {
        if (typeof translation === 'object' && translation !== null) {
            if ('count' in options) {
                return this.handlePluralization(translation, options);
            }
            return translation;
        }
        
        if (typeof translation === 'string') {
            return this.interpolate(translation, options);
        }
        
        return translation;
    }

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

    interpolate(template, variables = {}) {
        if (typeof template !== 'string') {
            return template;
        }
        
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            if (key in variables) {
                const value = variables[key];
                
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

    handleMissingTranslation(key, error) {
        if (this.config.errorHandling && this.config.errorHandling.logWarnings) {
            console.warn(`[I18n] Missing translation for key: ${key}`, error);
        }
        
        if (this.currentLanguage !== this.config.fallbackLanguage) {
            try {
                return this.getTranslation(key, this.config.fallbackLanguage);
            } catch (fallbackError) {
                // 回退也失败了
            }
        }
        
        switch (this.config.errorHandling && this.config.errorHandling.missingKeyBehavior) {
            case 'empty':
                return '';
            case 'fallback':
                return key.split('.').pop();
            default:
                return key;
        }
    }

    async setLanguage(language) {
        if (!this.config.supportedLanguages.includes(language)) {
            throw new Error(`Unsupported language: ${language}`);
        }
        
        if (language === this.currentLanguage) {
            return true;
        }
        
        const previousLanguage = this.currentLanguage;
        
        try {
            await this.loadLanguage(language);
            this.currentLanguage = language;
            this.saveLanguagePreference(language);
            this.clearCache();
            
            if (this.config.autoDetect && this.config.autoDetect.updateUrl) {
                this.updateUrl(language);
            }
            
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

    generateCacheKey(key, options) {
        return `${this.currentLanguage}:${key}:${JSON.stringify(options)}`;
    }

    setCacheValue(key, value) {
        if (!this.config.cache || !this.config.cache.enabled) {
            return;
        }
        
        if (this.cache.size >= (this.config.cache.maxSize || 1000)) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, value);
    }

    clearCache() {
        this.cache.clear();
        this.stats.cacheHits = 0;
        this.stats.cacheMisses = 0;
    }

    saveLanguagePreference(language) {
        try {
            localStorage.setItem(this.config.storageKey, language);
        } catch (error) {
            console.warn('[I18n] Failed to save language preference:', error);
        }
    }

    updateUrl(language) {
        const url = new URL(window.location);
        url.searchParams.set(this.config.autoDetect.urlParam || 'lang', language);
        window.history.replaceState({}, '', url);
    }

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
        
        // 同时触发 DOM 事件
        if (typeof document !== 'undefined') {
            const customEvent = new CustomEvent(`i18n:${event}`, {
                detail: data,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(customEvent);
        }
    }

    getStats() {
        return {
            currentLanguage: this.currentLanguage,
            loadedLanguages: Object.keys(this.translations),
            cacheSize: this.cache.size,
            cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0,
            ...this.stats
        };
    }

    destroy() {
        this.clearCache();
        this.events.clear();
        this.loadPromises.clear();
    }
}

// ===== 高级语言控制器 =====
class AdvancedLanguageController {
    constructor(options = {}) {
        this.config = Object.assign({}, window.I18nConfig || {}, options);
        this.supportedLanguages = this.config.supportedLanguages || ['zh', 'en'];
        this.defaultLanguage = this.config.defaultLanguage || 'zh';
        this.storageKey = this.config.storageKey || 'site-language-preference';
        this.fallbackLanguage = this.config.fallbackLanguage || 'en';
        
        this.currentLanguage = this.defaultLanguage;
        this.translations = {};
        this.cache = new Map();
        this.formatters = null;
        
        // 吸血鬼萝莉模式相关
        this.clickCount = 0;
        this.vampireActivationThreshold = 20;
        
        this.isLoading = false;
        this.isInitialized = false;
        this.eventListeners = new Map();
        
        this.init();
    }

    async init() {
        try {
            this.isLoading = true;
            
            this.loadLanguagePreference();
            await this.loadTranslations(this.currentLanguage);
            await this.applyLanguage(this.currentLanguage);
            
            this.updateLanguageButton();
            this.updateDocumentLanguage();
            this.initFormatters();
            
            this.isInitialized = true;
            this.isLoading = false;
            
            this.emit('initialized', {
                language: this.currentLanguage,
                supportedLanguages: this.supportedLanguages
            });
            
            console.log(`[I18n] Language controller initialized with language: ${this.currentLanguage}`);
        } catch (error) {
            console.error('[I18n] Failed to initialize language controller:', error);
            this.isLoading = false;
            await this.fallbackToDefault();
        }
    }

    loadLanguagePreference() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLang = urlParams.get('lang');
            if (urlLang && this.supportedLanguages.includes(urlLang)) {
                this.currentLanguage = urlLang;
                this.saveLanguagePreference(urlLang);
                return;
            }

            const savedLanguage = localStorage.getItem(this.storageKey);
            if (savedLanguage && this.supportedLanguages.includes(savedLanguage)) {
                this.currentLanguage = savedLanguage;
                return;
            }

            const browserLanguage = this.detectBrowserLanguage();
            this.currentLanguage = this.supportedLanguages.includes(browserLanguage) 
                ? browserLanguage 
                : this.defaultLanguage;
        } catch (error) {
            console.warn('[I18n] Failed to load language preference:', error);
            this.currentLanguage = this.defaultLanguage;
        }
    }

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

    async loadTranslations(language) {
        if (this.translations[language]) {
            return this.translations[language];
        }

        try {
            const response = await fetch(`${this.config.translationsPath}${language}${this.config.fileExtension}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load translation file for ${language}: ${response.status}`);
            }
            
            const translations = await response.json();
            this.translations[language] = translations;
            
            console.log(`[I18n] Loaded translations for ${language}`);
            return translations;
        } catch (error) {
            console.error(`[I18n] Failed to load translations for ${language}:`, error);
            
            if (language !== this.fallbackLanguage && this.supportedLanguages.includes(this.fallbackLanguage)) {
                console.log(`[I18n] Attempting to load fallback language: ${this.fallbackLanguage}`);
                return await this.loadTranslations(this.fallbackLanguage);
            }
            
            throw error;
        }
    }

    t(key, options = {}) {
        const cacheKey = `${this.currentLanguage}:${key}:${JSON.stringify(options)}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const translation = this.getNestedTranslation(key, this.currentLanguage);
            let result = this.processTranslation(translation, options);
            
            this.cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.warn(`[I18n] Translation not found for key: ${key}`, error);
            
            if (this.currentLanguage !== this.fallbackLanguage) {
                try {
                    const fallbackTranslation = this.getNestedTranslation(key, this.fallbackLanguage);
                    return this.processTranslation(fallbackTranslation, options);
                } catch (fallbackError) {
                    console.warn(`[I18n] Fallback translation not found for key: ${key}`);
                }
            }
            
            return key;
        }
    }

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

    processTranslation(translation, options = {}) {
        if (typeof translation !== 'string') {
            if (typeof translation === 'object' && 'count' in options) {
                return this.handlePluralization(translation, options.count, options);
            }
            return translation;
        }
        
        return this.interpolate(translation, options);
    }

    handlePluralization(pluralObject, count, options = {}) {
        let key;
        
        if (count === 0 && 'zero' in pluralObject) {
            key = 'zero';
        } else if (count === 1 && 'one' in pluralObject) {
            key = 'one';
        } else if ('other' in pluralObject) {
            key = 'other';
        } else {
            key = Object.keys(pluralObject)[0];
        }
        
        const template = pluralObject[key];
        return this.interpolate(template, { ...options, count });
    }

    interpolate(template, variables = {}) {
        if (typeof template !== 'string') {
            return template;
        }
        
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            if (key in variables) {
                const value = variables[key];
                
                if (value instanceof Date) {
                    return this.formatters ? this.formatters.date.format(value) : value.toString();
                }
                
                if (typeof value === 'number') {
                    return this.formatters ? this.formatters.number.format(value) : value.toString();
                }
                
                return value;
            }
            
            return match;
        });
    }

    async switchLanguage() {
        if (this.isLoading) {
            console.warn('[I18n] Language switch in progress, please wait...');
            return;
        }
        
        // 增加点击计数
        this.clickCount++;
        console.log(`[I18n] Language switch clicked ${this.clickCount} times`);
        
        // 检查是否达到吸血鬼萝莉模式激活阈值
        if (this.clickCount === this.vampireActivationThreshold) {
            await this.activateVampireMode();
            // 重置计数器，重新开始计数
            this.clickCount = 0;
            return;
        }
        
        // 正常语言切换逻辑（只在 zh 和 en 之间切换）
        const normalLanguages = ['zh', 'en'];
        const currentIndex = normalLanguages.indexOf(this.currentLanguage);
        let nextIndex;
        
        if (currentIndex === -1) {
            // 如果当前语言是 vampire，切换到 zh
            nextIndex = 0;
        } else {
            // 在 zh 和 en 之间正常切换
            nextIndex = (currentIndex + 1) % normalLanguages.length;
        }
        
        const newLanguage = normalLanguages[nextIndex];
        await this.setLanguage(newLanguage);
    }

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
            
            this.emit('languageChangeStart', {
                from: previousLanguage,
                to: language
            });

            const wasVampireMode = previousLanguage === 'vampire';
            
            this.currentLanguage = language;
            await this.loadTranslations(language);
            await this.applyLanguage(language);

            // 根据语言决定是否应用血族效果
            if (language === 'vampire') {
                this.addVampireEffects();
            } else if (wasVampireMode) {
                // 只有从vampire语言切换出去时才移除效果
                this.removeVampireEffects();
            }

            this.saveLanguagePreference(language);
            this.updateLanguageButton();
            this.updateDocumentLanguage();
            this.initFormatters();
            this.cache.clear();

            this.isLoading = false;

            this.emit('languageChanged', {
                language: language,
                previousLanguage: previousLanguage
            });

            console.log(`[I18n] Language switched from ${previousLanguage} to ${language}`);
            return true;
        } catch (error) {
            console.error(`[I18n] Failed to switch to language ${language}:`, error);
            this.isLoading = false;
            
            this.emit('error', {
                type: 'languageSwitch',
                message: error.message,
                language: language
            });
            
            return false;
        }
    }

    async activateVampireMode() {
        console.log('[I18n] 🦇 Activating Vampire Loli Mode! 🦇');
        
        try {
            // 显示血族萝莉风格的特殊提示
            await this.showVampireActivationAlert();
            
            // 切换到吸血鬼语言包
            await this.setLanguage('vampire');
            
            // 添加血族特效
            this.addVampireEffects();
            
        } catch (error) {
            console.error('[I18n] Failed to activate vampire mode:', error);
        }
    }

    async showVampireActivationAlert() {
        return new Promise((resolve) => {
            if (typeof swal !== 'undefined') {
                swal({
                    title: "🦇 血族觉醒！",
                    text: "",
                    icon: "success",
                    buttons: {
                        confirm: {
                            text: "哼！本大人知道了～",
                            value: true,
                            visible: true,
                            className: "vampire-button",
                            closeModal: true
                        }
                    },
                    content: {
                        element: "div",
                        attributes: {
                            innerHTML: `
                                <div style="text-align: center; color: #8B0000; font-family: '微软雅黑', sans-serif; animation: vampireGlow 2s ease-in-out infinite alternate;">
                                    <div style="font-size: 3em; margin-bottom: 15px; animation: float 3s ease-in-out infinite;">🦇✨🌙</div>
                                    <h3 style="color: #8B0000; font-weight: bold; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                                        血族觉醒！吸血鬼萝莉彩蛋激活！
                                    </h3>
                                    <p style="color: #8B0000; font-size: 1.1em; line-height: 1.6; margin-bottom: 10px;">
                                        呵呵呵～你终于发现了隐藏的血族秘密！
                                    </p>
                                    <p style="color: #CC0000; font-weight: bold; font-size: 1.1em; margin-bottom: 10px;">
                                        现在暂时切换到<span style="color: #8B0000; text-shadow: 1px 1px 2px rgba(255,105,180,0.5);">🦇血族古语🦇</span>模式！
                                    </p>
                                    <p style="color: #8B0000; font-size: 1em; margin-bottom: 15px;">
                                        继续点击20次可以再次激活血族彩蛋哦～
                                    </p>
                                    <div style="font-size: 2em; margin-top: 15px; animation: sparkle 1.5s linear infinite;">🩸👑🦇💫</div>
                                    <style>
                                        @keyframes vampireGlow {
                                            0% { text-shadow: 0 0 5px rgba(139, 0, 0, 0.5); }
                                            100% { text-shadow: 0 0 20px rgba(139, 0, 0, 0.8), 0 0 30px rgba(255, 105, 180, 0.6); }
                                        }
                                        @keyframes float {
                                            0%, 100% { transform: translateY(0px); }
                                            50% { transform: translateY(-10px); }
                                        }
                                        @keyframes sparkle {
                                            0%, 100% { opacity: 1; transform: scale(1); }
                                            50% { opacity: 0.7; transform: scale(1.1); }
                                        }
                                    </style>
                                </div>
                            `
                        }
                    }
                }).then(() => {
                    resolve();
                });
            } else {
                // 如果 sweetalert 不可用，使用原生 alert
                alert("🦇 血族觉醒！\n呵呵呵～你终于发现了隐藏的血族秘密！\n现在你可以使用吾之血族古语了！\n欢迎来到暗夜宫殿，吾的信徒～");
                resolve();
            }
        });
    }

    addVampireEffects() {
        // 检查是否已经有血族效果
        const body = document.body;
        if (body.classList.contains('vampire-mode')) {
            return;
        }
        
        // 通过系统管理器激活血族模式（样式已在CSS中定义）
        if (window.activateVampireMode) {
            window.activateVampireMode(false);
        } else {
            // 后备方案：直接添加CSS类
            body.classList.add('vampire-mode');
        }
        
        console.log('[I18n] 🦇 Vampire visual effects activated!');
    }

    removeVampireEffects() {
        // 检查是否确实有血族效果需要移除
        const body = document.body;
        const hasVampireMode = body.classList.contains('vampire-mode');
        
        if (!hasVampireMode) {
            return;
        }
        
        // 通过系统管理器移除血族模式
        if (window.deactivateVampireMode) {
            window.deactivateVampireMode();
        } else {
            // 后备方案：直接移除CSS类
            body.classList.remove('vampire-mode');
        }
        
        console.log('[I18n] 🦇 Vampire visual effects removed!');
    }

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
                    if (!element.hasAttribute('data-original')) {
                        element.setAttribute('data-original', element.textContent.trim());
                    }
                    element.textContent = text;
                }
            });

            // 处理 placeholder 和 title 属性
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

    updateLanguageButton() {
        const button = document.getElementById('language-switch-btn');
        if (button) {
            // 正常模式下显示下一个语言选项
            const normalLanguages = ['zh', 'en'];
            const currentIndex = normalLanguages.indexOf(this.currentLanguage);
            let nextLanguage, nextLanguageName;
            
            if (currentIndex === -1) {
                // 如果当前语言是 vampire，下一个是 zh
                nextLanguage = 'zh';
                nextLanguageName = this.t(`language.${nextLanguage}`) || 
                                 this.config.languageNames[nextLanguage] ||
                                 '中文';
            } else {
                // 在 zh 和 en 之间正常切换
                const nextIndex = (currentIndex + 1) % normalLanguages.length;
                nextLanguage = normalLanguages[nextIndex];
                nextLanguageName = this.t(`language.${nextLanguage}`) || 
                                 this.config.languageNames[nextLanguage] ||
                                 (nextLanguage === 'zh' ? '中文' : 'English');
            }
            
            button.textContent = nextLanguageName;
            button.setAttribute('title', this.t('common.switchLanguage') || 'Switch Language');
            
            // 如果当前是血族语言，添加特殊样式
            if (this.currentLanguage === 'vampire') {
                button.classList.add('vampire-mode-btn');
            } else {
                button.classList.remove('vampire-mode-btn');
            }
        }
    }

    getNextLanguage() {
        const currentIndex = this.supportedLanguages.indexOf(this.currentLanguage);
        const nextIndex = (currentIndex + 1) % this.supportedLanguages.length;
        return this.supportedLanguages[nextIndex];
    }

    updateDocumentLanguage() {
        // 将vampire语言映射为zh-CN，因为它使用中文语法
        const documentLanguage = this.currentLanguage === 'vampire' ? 'zh-CN' : this.currentLanguage;
        document.documentElement.lang = documentLanguage;
        document.documentElement.setAttribute('dir', this.getTextDirection(this.currentLanguage));
    }

    getTextDirection(language) {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    }

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

    getLocaleCode(language) {
        if (!language || typeof language !== 'string') {
            language = this.defaultLanguage;
        }
        
        return this.config.localeMapping[language] || this.config.localeMapping[this.defaultLanguage] || 'en-US';
    }

    getCurrencyCode(language) {
        if (!language || typeof language !== 'string') {
            language = this.defaultLanguage;
        }
        
        return this.config.currencyMapping[language] || this.config.currencyMapping[this.defaultLanguage] || 'USD';
    }

    saveLanguagePreference(language) {
        try {
            localStorage.setItem(this.storageKey, language);
            sessionStorage.setItem(this.storageKey, language);
            
            if (typeof document !== 'undefined') {
                const expires = new Date();
                expires.setFullYear(expires.getFullYear() + 1);
                document.cookie = `${this.storageKey}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
            }
        } catch (error) {
            console.warn('[I18n] Unable to save language preference:', error);
        }
    }

    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

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
        
        this.dispatchCustomEvent(event, data);
    }

    dispatchCustomEvent(eventName, data) {
        if (typeof document === 'undefined') return;
        
        const event = new CustomEvent(`i18n:${eventName}`, {
            detail: data,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

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
            this.isInitialized = true;
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    isReady() {
        return this.isInitialized && !this.isLoading;
    }

    async reset() {
        try {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.storageKey);
            
            if (typeof document !== 'undefined') {
                document.cookie = `${this.storageKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
            
            this.cache.clear();
            this.currentLanguage = this.defaultLanguage;
            await this.init();
            
            console.log('[I18n] Language controller reset to default settings');
        } catch (error) {
            console.error('[I18n] Failed to reset language controller:', error);
        }
    }

    getStats() {
        const stats = {
            currentLanguage: this.currentLanguage,
            supportedLanguages: this.supportedLanguages,
            loadedLanguages: Object.keys(this.translations),
            cacheSize: this.cache.size,
            isInitialized: this.isInitialized,
            isLoading: this.isLoading
        };
        
        let totalKeys = 0;
        for (const lang in this.translations) {
            totalKeys += this.countKeys(this.translations[lang]);
        }
        stats.totalTranslationKeys = totalKeys;
        
        return stats;
    }

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

    destroy() {
        this.eventListeners.clear();
        this.cache.clear();
        this.isInitialized = false;
        this.isLoading = false;
        
        console.log('[I18n] Language controller destroyed');
    }
}

// ===== 初始化和全局函数 =====

let initPromise = null;
let i18nInstance = null;
let languageController = null;

async function initializeI18nSystem() {
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            console.log('[I18n Init] Starting i18n system initialization...');

            // 创建 i18n 实例
            i18nInstance = new I18n(window.I18nConfig);
            await i18nInstance.init();
            console.log('[I18n Init] I18n core system initialized');

            // 创建高级语言控制器
            languageController = new AdvancedLanguageController(window.I18nConfig);
            
            await new Promise((resolve) => {
                if (languageController.isReady()) {
                    resolve();
                } else {
                    languageController.on('initialized', resolve);
                }
            });

            console.log('[I18n Init] Advanced language controller initialized');

            // 设置全局函数
            setupGlobalFunctions();
            setupAutoTranslation();
            setupEventListeners();

            // 触发初始化完成事件
            window.dispatchEvent(new CustomEvent('i18nSystemReady', {
                detail: {
                    language: getCurrentLanguage(),
                    hasAdvancedController: !!languageController,
                    hasI18nCore: !!i18nInstance
                }
            }));

            console.log('[I18n Init] I18n system fully initialized');
            return true;
        } catch (error) {
            console.error('[I18n Init] Failed to initialize i18n system:', error);
            createFallbackController();
            setupGlobalFunctions();
            return false;
        }
    })();

    return initPromise;
}

function createFallbackController() {
    languageController = {
        currentLanguage: 'zh',
        supportedLanguages: ['zh', 'en'],
        
        getCurrentLanguage() {
            return this.currentLanguage;
        },
        
        async setLanguage(lang) {
            if (this.supportedLanguages.includes(lang)) {
                this.currentLanguage = lang;
                localStorage.setItem('site-language-preference', lang);
                location.reload();
            }
        },
        
        async switchLanguage() {
            const current = this.supportedLanguages.indexOf(this.currentLanguage);
            const next = (current + 1) % this.supportedLanguages.length;
            await this.setLanguage(this.supportedLanguages[next]);
        },
        
        t(key, options = {}) {
            return key;
        },
        
        isReady() {
            return true;
        }
    };
}

function setupGlobalFunctions() {
    // 全局翻译函数
    window.t = function(key, options = {}) {
        if (i18nInstance) {
            return i18nInstance.t(key, options);
        } else if (languageController && languageController.t) {
            return languageController.t(key, options);
        }
        return key;
    };

    // 语言切换函数
    window.switchLanguage = async function() {
        if (languageController) {
            await languageController.switchLanguage();
        }
    };

    // 设置语言函数
    window.setLanguage = async function(lang) {
        if (languageController) {
            await languageController.setLanguage(lang);
        }
    };

    // 获取当前语言函数
    window.getCurrentLanguage = function() {
        if (languageController) {
            return languageController.getCurrentLanguage();
        }
        return 'zh';
    };

    // 格式化函数
    window.formatNumber = function(number, options = {}) {
        if (i18nInstance) {
            return i18nInstance.formatNumber(number, options);
        } else if (languageController && languageController.formatNumber) {
            return languageController.formatNumber(number, options);
        }
        return number.toString();
    };

    window.formatDate = function(date, options = {}) {
        if (i18nInstance) {
            return i18nInstance.formatDate(date, options);
        } else if (languageController && languageController.formatDate) {
            return languageController.formatDate(date, options);
        }
        return date.toString();
    };

    window.formatCurrency = function(amount, currency = null) {
        if (i18nInstance) {
            return i18nInstance.formatCurrency(amount, currency);
        } else if (languageController && languageController.formatCurrency) {
            return languageController.formatCurrency(amount, currency);
        }
        return amount.toString();
    };

    // 暴露实例
    window.i18n = i18nInstance;
    window.languageController = languageController;
}

function setupAutoTranslation() {
    const translateElements = () => {
        // 处理 data-i18n 属性
        const i18nElements = document.querySelectorAll('[data-i18n]');
        i18nElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                const translation = window.t(key);
                if (translation && translation !== key) {
                    element.textContent = translation;
                }
            }
        });

        // 处理 placeholder
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (key) {
                const translation = window.t(key);
                if (translation && translation !== key) {
                    element.placeholder = translation;
                }
            }
        });

        // 处理 title
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (key) {
                const translation = window.t(key);
                if (translation && translation !== key) {
                    element.title = translation;
                }
            }
        });
    };

    // 立即翻译现有元素
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', translateElements);
    } else {
        translateElements();
    }

    // 监听动态添加的元素
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
            let shouldTranslate = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.hasAttribute('data-i18n') || 
                                node.hasAttribute('data-i18n-placeholder') || 
                                node.hasAttribute('data-i18n-title') ||
                                node.querySelector('[data-i18n], [data-i18n-placeholder], [data-i18n-title]')) {
                                shouldTranslate = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldTranslate) {
                setTimeout(translateElements, 10);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 在语言切换时重新翻译
    document.addEventListener('i18n:languageChanged', translateElements);
}

function setupEventListeners() {
    // 监听语言切换事件
    document.addEventListener('i18n:languageChanged', (event) => {
        const { language, previousLanguage } = event.detail;
        
        // 更新文档语言属性（使用有效的语言代码）
        const documentLanguage = language === 'vampire' ? 'zh-CN' : language;
        document.documentElement.lang = documentLanguage;
        
        // 更新页面标题（如果有翻译）
        const titleKey = document.title.getAttribute ? document.title.getAttribute('data-i18n') : null;
        if (titleKey) {
            document.title = window.t(titleKey);
        }
        
        console.log(`[I18n] Language changed from ${previousLanguage} to ${language}`);
    });

    // 监听错误事件
    document.addEventListener('i18n:error', (event) => {
        console.error('[I18n] Error occurred:', event.detail);
    });

    // 键盘快捷键支持（可选）
    document.addEventListener('keydown', (event) => {
        // Ctrl+Alt+L 切换语言
        if (event.ctrlKey && event.altKey && event.code === 'KeyL') {
            event.preventDefault();
            window.switchLanguage();
        }
    });
}

// 初始化入口
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeI18nSystem);
} else {
    initializeI18nSystem();
}

// 暴露初始化函数以供手动调用
window.initI18nSystem = initializeI18nSystem;

// 导出（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        I18n,
        AdvancedLanguageController,
        I18nConfig: window.I18nConfig
    };
} else if (typeof window !== 'undefined') {
    window.I18n = I18n;
    window.AdvancedLanguageController = AdvancedLanguageController;
}