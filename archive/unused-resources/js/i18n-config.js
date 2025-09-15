/**
 * I18n 配置文件
 * 配置国际化系统的各种选项和设置
 */

// 全局 i18n 配置
window.I18nConfig = {
    // 支持的语言列表
    supportedLanguages: ['zh', 'en'],
    
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
    
    // 日期时间格式选项
    dateTimeFormats: {
        short: {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        },
        medium: {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        },
        long: {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        },
        full: {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
    },
    
    // 数字格式选项
    numberFormats: {
        decimal: {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        },
        currency: {
            style: 'currency',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        },
        percent: {
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        }
    },
    
    // 自动检测选项
    autoDetect: {
        // 是否自动检测浏览器语言
        enabled: true,
        
        // 是否优先使用 URL 参数中的语言
        urlFirst: true,
        
        // URL 参数名
        urlParam: 'lang',
        
        // 是否在语言切换时更新 URL
        updateUrl: false
    },
    
    // 缓存选项
    cache: {
        // 是否启用缓存
        enabled: true,
        
        // 缓存大小限制
        maxSize: 1000,
        
        // 缓存过期时间（毫秒）
        expiration: 30 * 60 * 1000 // 30 分钟
    },
    
    // 错误处理选项
    errorHandling: {
        // 当翻译键不存在时的行为
        // 'key' - 返回键名
        // 'fallback' - 尝试回退语言
        // 'empty' - 返回空字符串
        missingKeyBehavior: 'key',
        
        // 是否在控制台显示警告
        logWarnings: true,
        
        // 是否在开发环境显示调试信息
        debugMode: false
    },
    
    // 性能监控选项
    performance: {
        // 是否启用性能监控
        enabled: true,
        
        // 是否记录加载时间
        logLoadTimes: true,
        
        // 是否记录翻译查找时间
        logLookupTimes: false
    },
    
    // 插件和扩展
    plugins: {
        // 是否启用变量插值
        interpolation: true,
        
        // 是否启用复数形式处理
        pluralization: true,
        
        // 是否启用命名空间
        namespaces: true,
        
        // 是否启用格式化器
        formatters: true
    },
    
    // 预加载选项
    preload: {
        // 是否预加载所有支持的语言
        enabled: false,
        
        // 预加载的语言列表（如果为空则预加载所有支持的语言）
        languages: [],
        
        // 预加载的命名空间
        namespaces: ['common', 'site', 'navigation']
    }
};

// 验证配置的函数
function validateI18nConfig(config) {
    const errors = [];
    
    if (!config.supportedLanguages || !Array.isArray(config.supportedLanguages)) {
        errors.push('supportedLanguages must be an array');
    }
    
    if (!config.defaultLanguage || typeof config.defaultLanguage !== 'string') {
        errors.push('defaultLanguage must be a string');
    }
    
    if (config.supportedLanguages && !config.supportedLanguages.includes(config.defaultLanguage)) {
        errors.push('defaultLanguage must be in supportedLanguages');
    }
    
    if (!config.translationsPath || typeof config.translationsPath !== 'string') {
        errors.push('translationsPath must be a string');
    }
    
    if (errors.length > 0) {
        console.error('[I18n Config] Configuration validation failed:', errors);
        return false;
    }
    
    return true;
}

// 验证当前配置
if (!validateI18nConfig(window.I18nConfig)) {
    console.error('[I18n Config] Using default configuration due to validation errors');
    
    // 使用最小化的默认配置
    window.I18nConfig = {
        supportedLanguages: ['zh', 'en'],
        defaultLanguage: 'zh',
        fallbackLanguage: 'en',
        translationsPath: './assets/i18n/',
        fileExtension: '.json',
        storageKey: 'site-language-preference'
    };
}

// 导出配置（用于模块环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.I18nConfig;
}
