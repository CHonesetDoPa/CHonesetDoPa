/**
 * I18n 初始化脚本
 * 整合语言控制器和 i18n 系统
 */

(function() {
    'use strict';

    // 等待 DOM 和所有依赖加载完成
    let initPromise = null;

    async function initializeI18nSystem() {
        if (initPromise) {
            return initPromise;
        }

        initPromise = (async () => {
            try {
                console.log('[I18n Init] Starting i18n system initialization...');

                // 确保配置已加载
                if (typeof window.I18nConfig === 'undefined') {
                    console.warn('[I18n Init] I18nConfig not found, using default configuration');
                    window.I18nConfig = {
                        supportedLanguages: ['zh', 'en'],
                        defaultLanguage: 'zh',
                        translationsPath: './assets/i18n/',
                        fileExtension: '.json',
                        storageKey: 'site-language-preference'
                    };
                }

                // 创建 i18n 实例
                if (typeof window.I18n !== 'undefined') {
                    window.i18n = new window.I18n(window.I18nConfig);
                    await window.i18n.init();
                    console.log('[I18n Init] I18n core system initialized');
                }

                // 创建高级语言控制器
                if (typeof window.AdvancedLanguageController !== 'undefined') {
                    window.languageController = new window.AdvancedLanguageController(window.I18nConfig);
                    
                    // 等待语言控制器初始化完成
                    await new Promise((resolve) => {
                        if (window.languageController.isReady()) {
                            resolve();
                        } else {
                            window.languageController.on('initialized', resolve);
                        }
                    });

                    console.log('[I18n Init] Advanced language controller initialized');
                } else {
                    console.warn('[I18n Init] AdvancedLanguageController not found, using fallback');
                    createFallbackController();
                }

                // 设置全局函数
                setupGlobalFunctions();

                // 设置自动翻译
                setupAutoTranslation();

                // 设置事件监听
                setupEventListeners();

                // 触发初始化完成事件
                window.dispatchEvent(new CustomEvent('i18nSystemReady', {
                    detail: {
                        language: getCurrentLanguage(),
                        hasAdvancedController: !!window.languageController,
                        hasI18nCore: !!window.i18n
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
        // 创建最基本的回退控制器
        window.languageController = {
            currentLanguage: 'zh',
            supportedLanguages: ['zh', 'en'],
            
            getCurrentLanguage() {
                return this.currentLanguage;
            },
            
            async setLanguage(lang) {
                if (this.supportedLanguages.includes(lang)) {
                    this.currentLanguage = lang;
                    localStorage.setItem('site-language-preference', lang);
                    location.reload(); // 简单的页面刷新
                }
            },
            
            async switchLanguage() {
                const current = this.supportedLanguages.indexOf(this.currentLanguage);
                const next = (current + 1) % this.supportedLanguages.length;
                await this.setLanguage(this.supportedLanguages[next]);
            },
            
            t(key, options = {}) {
                return key; // 简单返回键名
            },
            
            isReady() {
                return true;
            }
        };
    }

    function setupGlobalFunctions() {
        // 全局翻译函数
        window.t = function(key, options = {}) {
            if (window.i18n) {
                return window.i18n.t(key, options);
            } else if (window.languageController && window.languageController.t) {
                return window.languageController.t(key, options);
            }
            return key;
        };

        // 语言切换函数
        window.switchLanguage = async function() {
            if (window.languageController) {
                await window.languageController.switchLanguage();
            }
        };

        // 设置语言函数
        window.setLanguage = async function(lang) {
            if (window.languageController) {
                await window.languageController.setLanguage(lang);
            }
        };

        // 获取当前语言函数
        window.getCurrentLanguage = function() {
            if (window.languageController) {
                return window.languageController.getCurrentLanguage();
            }
            return 'zh';
        };

        // 格式化函数
        window.formatNumber = function(number, options = {}) {
            if (window.i18n) {
                return window.i18n.formatNumber(number, options);
            } else if (window.languageController && window.languageController.formatNumber) {
                return window.languageController.formatNumber(number, options);
            }
            return number.toString();
        };

        window.formatDate = function(date, options = {}) {
            if (window.i18n) {
                return window.i18n.formatDate(date, options);
            } else if (window.languageController && window.languageController.formatDate) {
                return window.languageController.formatDate(date, options);
            }
            return date.toString();
        };

        window.formatCurrency = function(amount, currency = null) {
            if (window.i18n) {
                return window.i18n.formatCurrency(amount, currency);
            } else if (window.languageController && window.languageController.formatCurrency) {
                return window.languageController.formatCurrency(amount, currency);
            }
            return amount.toString();
        };
    }

    function setupAutoTranslation() {
        // 自动翻译页面上已有的元素
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
                    setTimeout(translateElements, 10); // 延迟执行避免频繁调用
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
            
            // 更新文档语言属性
            document.documentElement.lang = language;
            
            // 更新页面标题（如果有翻译）
            const titleKey = document.title.getAttribute ? document.title.getAttribute('data-i18n') : null;
            if (titleKey) {
                document.title = window.t(titleKey);
            }
            
            // 记录语言切换
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

})();
