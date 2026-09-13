/**
 * i18n-system.js
 * Language detection, switching, caching and rendering.
 */

import Swal from "sweetalert2";

// ===== I18n 配置 =====
const DEFAULT_I18N_CONFIG = {
  supportedLanguages: ["zh", "en", "vampire"],
  defaultLanguage: "zh",
  fallbackLanguage: "en",
  storageKey: "site-language-preference",
  autoDetect: { enabled: true },
  inlineTranslations: {
    enabled: true,
    mapping: { zh: "Lang_ZH", en: "Lang_EN", vampire: "Lang_Vampire" },
  },
  cache: { enabled: true, maxSize: 1000 },
  errorHandling: { missingKeyBehavior: "key" },
};

const DEFAULT_INLINE_TRANSLATION_MAPPING = {
  zh: "Lang_ZH",
  en: "Lang_EN",
  vampire: "Lang_Vampire",
};

function getBundledTranslation(language, config = {}) {
  const source = typeof window !== "undefined" ? window.i18n : null;
  if (!source || typeof source !== "object") return null;
  const inlineConfig = config.inlineTranslations || {};
  if (inlineConfig.enabled === false) return null;
  const combined = Object.assign(
    {},
    DEFAULT_INLINE_TRANSLATION_MAPPING,
    inlineConfig.mapping || {},
  );
  const lang = typeof language === "string" ? language.trim() : "";
  if (!lang) return null;
  const variants = [
    combined[lang],
    combined[lang.toLowerCase()],
    combined[lang.toUpperCase()],
    lang,
    lang.toLowerCase(),
    lang.toUpperCase(),
    `Lang_${lang.charAt(0).toUpperCase()}${lang.slice(1).toLowerCase()}`,
    `Lang_${lang.toUpperCase()}`,
  ];
  for (const k of variants) {
    if (!k) continue;
    if (Object.prototype.hasOwnProperty.call(source, k)) return source[k];
  }
  return null;
}

// ===== I18n 类（合并控制器） =====
class I18n {
  constructor(config = {}) {
    this.config = Object.assign(
      {},
      window.I18nConfig || DEFAULT_I18N_CONFIG,
      config,
    );
    this.translations = {};
    this.currentLanguage = this.config.defaultLanguage;
    this.cache = new Map();
    this.events = new Map();
    this.stats = { cacheHits: 0, cacheMisses: 0 };

    // 控制器状态
    this.isLoading = false;
    this.isInitialized = false;
    this.clickCount = 0;
    this.vampireActivationThreshold = 10;
  }

  async init() {
    try {
      this.isLoading = true;
      await this.detectLanguage();
      await this.loadLanguage(this.currentLanguage);
      await this.applyLanguage(this.currentLanguage).catch(() => {});
      this.updateLanguageButton();
      this.updateDocumentLanguage();
      this.isInitialized = true;
      this.isLoading = false;
      this.emit("initialized", { language: this.currentLanguage });
      return true;
    } catch (err) {
      this.emit("error", { type: "init", error: err });
      this.isLoading = false;
      return false;
    }
  }

  async detectLanguage() {
    let detected = null;
    try {
      const autoDetect = this.config.autoDetect || {};
      // 优先读取本地存储的偏好
      const saved = localStorage.getItem(this.config.storageKey);
      if (saved && this.config.supportedLanguages.includes(saved))
        detected = saved;
      // 其次回退到浏览器语言检测
      if (!detected && autoDetect.enabled) {
        const b = this.detectBrowserLanguage();
        if (b) detected = b;
      }
    } catch {
      /* ignore */
    }
    if (!detected) detected = this.config.defaultLanguage;
    this.currentLanguage = detected;
    // 仅当本地存储已有偏好时才持久化，
    // 避免把浏览器自动检测结果写死，用户无法回到自动检测。
    if (localStorage.getItem(this.config.storageKey)) {
      this.saveLanguagePreference(detected);
    }
    return detected;
  }

  detectBrowserLanguage() {
    const langs = [navigator.language, ...(navigator.languages || [])].filter(
      Boolean,
    );
    for (const l of langs) {
      const s = l.substring(0, 2).toLowerCase();
      if (this.config.supportedLanguages.includes(s)) return s;
    }
    return null;
  }

  async loadLanguage(language) {
    if (this.translations[language]) return this.translations[language];
    const inline = getBundledTranslation(language, this.config);
    if (inline) {
      this.translations[language] = inline;
      this.emit("languageLoaded", { language, source: "bundle" });
      return inline;
    }
    throw new Error(`No translations available for language: ${language}`);
  }

  async loadTranslations(language) {
    try {
      return await this.loadLanguage(language);
    } catch (err) {
      if (
        language !== this.config.fallbackLanguage &&
        this.config.supportedLanguages.includes(this.config.fallbackLanguage)
      ) {
        return await this.loadTranslations(this.config.fallbackLanguage);
      }
      throw err;
    }
  }

  t(key, options = {}) {
    try {
      const cacheKey = this.generateCacheKey(key, options);
      if (this.cache.has(cacheKey)) {
        this.stats.cacheHits++;
        return this.cache.get(cacheKey);
      }
      this.stats.cacheMisses++;
      const translation = this.getTranslation(key, this.currentLanguage);
      const processed = this.processTranslation(translation, options);
      this.setCacheValue(cacheKey, processed);
      return processed;
    } catch (err) {
      return this.handleMissingTranslation(key, err);
    }
  }

  getTranslation(key, language) {
    const translations = this.translations[language];
    if (!translations) throw new Error(`Language ${language} not loaded`);
    const parts = key.split(".");
    let v = translations;
    for (const p of parts) {
      if (v && typeof v === "object" && p in v) v = v[p];
      else throw new Error(`Translation key ${key} not found`);
    }
    return v;
  }

  processTranslation(translation, options = {}) {
    if (typeof translation === "object" && translation !== null) {
      if ("count" in options)
        return this.handlePluralization(translation, options);
      return translation;
    }
    if (typeof translation === "string")
      return this.interpolate(translation, options);
    return translation;
  }

  handlePluralization(pluralRules, options) {
    const { count } = options;
    let rule;
    if (count === 0 && "zero" in pluralRules) rule = "zero";
    else if (count === 1 && "one" in pluralRules) rule = "one";
    else if ("other" in pluralRules) rule = "other";
    else rule = Object.keys(pluralRules)[0];
    return this.interpolate(pluralRules[rule], options);
  }

  interpolate(template, vars = {}) {
    if (typeof template !== "string") return template;
    return template.replace(/\{\{(\w+)\}\}/g, (m, k) =>
      k in vars ? vars[k] : m,
    );
  }

  handleMissingTranslation(key, _error) {
    if (this.currentLanguage !== this.config.fallbackLanguage) {
      try {
        return this.getTranslation(key, this.config.fallbackLanguage);
      } catch {
        /* fall through to default behavior */
      }
    }
    return this.config.errorHandling &&
      this.config.errorHandling.missingKeyBehavior === "empty"
      ? ""
      : key;
  }

  async setLanguage(language) {
    if (!this.config.supportedLanguages.includes(language))
      throw new Error(`Unsupported language: ${language}`);
    if (language === this.currentLanguage) return true;
    const previous = this.currentLanguage;
    try {
      this.isLoading = true;
      this.emit("languageChangeStart", { from: previous, to: language });
      const wasVampire = previous === "vampire";
      await this.loadTranslations(language);
      this.currentLanguage = language;
      await this.applyLanguage(language);
      if (language === "vampire") this.addVampireEffects();
      else if (wasVampire) this.removeVampireEffects();
      this.saveLanguagePreference(language);
      this.updateLanguageButton();
      this.updateDocumentLanguage();
      this.clearCache();
      this.isLoading = false;
      this.emit("languageChanged", { language, previousLanguage: previous });
      return true;
    } catch (err) {
      this.isLoading = false;
      this.emit("error", { type: "setLanguage", language, error: err });
      return false;
    }
  }

  generateCacheKey(key, options) {
    return `${this.currentLanguage}:${key}:${JSON.stringify(options)}`;
  }
  setCacheValue(key, value) {
    if (!this.config.cache || !this.config.cache.enabled) return;
    if (this.cache.size >= (this.config.cache.maxSize || 1000))
      this.cache.delete(this.cache.keys().next().value);
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
    } catch {}
  }

  // apply translations to DOM
  async applyLanguage(_language) {
    try {
      // 通用属性翻译：data-i18n-<attr>="key"，可选 data-i18n-<attr>-vars='{"k":"v"}'
      const attrTargets = [
        { attr: "data-i18n", apply: (el, v) => (el.textContent = v) },
        {
          attr: "data-i18n-placeholder",
          apply: (el, v) => (el.placeholder = v),
        },
        { attr: "data-i18n-title", apply: (el, v) => (el.title = v) },
        {
          attr: "data-i18n-aria-label",
          apply: (el, v) => el.setAttribute("aria-label", v),
        },
        { attr: "data-i18n-alt", apply: (el, v) => el.setAttribute("alt", v) },
        {
          attr: "data-i18n-meta-content",
          apply: (el, v) => el.setAttribute("content", v),
        },
      ];

      attrTargets.forEach(({ attr, apply }) => {
        document.querySelectorAll(`[${attr}]`).forEach((el) => {
          const k = el.getAttribute(attr);
          if (!k) return;
          const vars = this.parseVars(el.getAttribute(`${attr}-vars`));
          const t = this.t(k, vars);
          if (t && t !== k) apply(el, t);
        });
      });
    } catch (e) {
      console.error("[I18n] applyLanguage error", e);
    }
  }

  /**
   * 解析 data-i18n-*-vars 属性中的插值变量
   * @param {string|null} raw - JSON 字符串
   * @returns {Object} 变量对象
   */
  parseVars(raw) {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  updateLanguageButton() {
    const btn = document.getElementById("language-switch-btn");
    if (!btn) return;
    const normal = ["zh", "en"];
    const idx = normal.indexOf(this.currentLanguage);
    const next = idx === -1 ? "zh" : normal[(idx + 1) % normal.length];
    const name = this.t(`language.${next}`);
    btn.textContent = name;
    btn.setAttribute("title", this.t("common.switchLanguage"));
    if (this.currentLanguage === "vampire")
      btn.classList.add("vampire-mode-btn");
    else btn.classList.remove("vampire-mode-btn");
  }

  updateDocumentLanguage() {
    const docLang =
      this.currentLanguage === "vampire" ? "zh-CN" : this.currentLanguage;
    document.documentElement.lang = docLang;
    document.documentElement.setAttribute("dir", "ltr");
  }

  async switchLanguage() {
    if (this.isLoading) return;
    this.clickCount++;
    if (this.clickCount === this.vampireActivationThreshold) {
      await this.activateVampireMode();
      this.clickCount = 0;
      return;
    }
    const normal = ["zh", "en"];
    const idx = normal.indexOf(this.currentLanguage);
    const next = idx === -1 ? "zh" : normal[(idx + 1) % normal.length];
    await this.setLanguage(next);
  }

  async activateVampireMode() {
    try {
      await this.showVampireActivationAlert();
      await this.setLanguage("vampire");
      this.addVampireEffects();
    } catch (e) {
      console.error(e);
    }
  }

  async showVampireActivationAlert() {
    return new Promise((resolve) => {
      const t = window.t || ((k) => k);
      Swal.fire({
        title: t("greeting.vampireMode.activated"),
        text: "",
        icon: "success",
      }).then(() => resolve());
    });
  }

  addVampireEffects() {
    const b = document.body;
    if (b.classList.contains("vampire-mode")) return;
    if (window.activateVampireMode) window.activateVampireMode(false);
    else b.classList.add("vampire-mode");
  }
  removeVampireEffects() {
    const b = document.body;
    if (window.deactivateVampireMode) window.deactivateVampireMode();
    else b.classList.remove("vampire-mode");
  }

  on(evt, cb) {
    if (!this.events.has(evt)) this.events.set(evt, []);
    this.events.get(evt).push(cb);
  }
  off(evt, cb) {
    if (!this.events.has(evt)) return;
    const arr = this.events.get(evt);
    const idx = arr.indexOf(cb);
    if (idx > -1) arr.splice(idx, 1);
  }
  emit(evt, data) {
    if (this.events.has(evt))
      this.events.get(evt).forEach((fn) => {
        try {
          fn(data);
        } catch {}
      });
    if (typeof document !== "undefined")
      document.dispatchEvent(
        new CustomEvent(`i18n:${evt}`, { detail: data, bubbles: true }),
      );
  }

  getStats() {
    return {
      currentLanguage: this.currentLanguage,
      loadedLanguages: Object.keys(this.translations),
      cacheSize: this.cache.size,
      ...this.stats,
    };
  }
  isReady() {
    return this.isInitialized && !this.isLoading;
  }
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  getSupportedLanguages() {
    return [...(this.config.supportedLanguages || [])];
  }
  destroy() {
    this.clearCache();
    this.events.clear();
  }
}

// ===== 初始化和全局函数 =====
let initPromise = null;
let i18nInstance = null;
let languageController = null;

async function initializeI18nSystem() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      // 翻译数据由 bootstrap.js 在本模块加载前同步导入，必然可用
      i18nInstance = new I18n(window.I18nConfig);
      await i18nInstance.init();
      languageController = i18nInstance;
      setupGlobalFunctions();
      setupAutoTranslation();
      // 与 i18n:* 事件保持一致：派发到 document 并允许冒泡，
      // 确保监听 document 的模块（如 link-manager）能收到
      document.dispatchEvent(
        new CustomEvent("i18nSystemReady", {
          detail: {
            language: window.getCurrentLanguage(),
            hasAdvancedController: !!languageController,
            hasI18nCore: !!i18nInstance,
          },
          bubbles: true,
        }),
      );
      return true;
    } catch {
      return false;
    }
  })();
  return initPromise;
}

function setupGlobalFunctions() {
  const original =
    typeof window !== "undefined" && window.i18n ? window.i18n : null;
  window.t = function (k, o = {}) {
    if (i18nInstance) return i18nInstance.t(k, o);
    else if (languageController && languageController.t)
      return languageController.t(k, o);
    return k;
  };
  window.switchLanguage = async function () {
    if (languageController && languageController.switchLanguage)
      await languageController.switchLanguage();
  };
  window.setLanguage = async function (l) {
    if (languageController && languageController.setLanguage)
      await languageController.setLanguage(l);
  };
  window.getCurrentLanguage = function () {
    if (languageController && languageController.getCurrentLanguage)
      return languageController.getCurrentLanguage();
    return "zh";
  };
  window.i18nInstance = i18nInstance;
  window.languageController = languageController;
  if (
    original &&
    (original.Lang_ZH || original.Lang_EN || original.Lang_Vampire)
  )
    window.i18n = original;
  else window.i18n = i18nInstance;
}

function setupAutoTranslation() {
  // 复用 I18n 实例的 applyLanguage，避免两套重复的 DOM 翻译逻辑。
  const translate = () => {
    if (i18nInstance && typeof i18nInstance.applyLanguage === "function") {
      i18nInstance.applyLanguage(i18nInstance.currentLanguage);
    }
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", translate);
  else translate();
  if (typeof MutationObserver !== "undefined") {
    const obs = new MutationObserver((muts) => {
      let s = false;
      muts.forEach((m) => {
        if (m.type === "childList")
          m.addedNodes.forEach((n) => {
            if (n.nodeType === Node.ELEMENT_NODE) {
              if (
                n.hasAttribute &&
                (n.hasAttribute("data-i18n") ||
                  n.hasAttribute("data-i18n-placeholder") ||
                  n.hasAttribute("data-i18n-title") ||
                  n.hasAttribute("data-i18n-aria-label") ||
                  n.hasAttribute("data-i18n-alt") ||
                  n.hasAttribute("data-i18n-meta-content") ||
                  n.querySelector(
                    "[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label], [data-i18n-alt], [data-i18n-meta-content]",
                  ))
              )
                s = true;
            }
          });
      });
      if (s) setTimeout(translate, 10);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  document.addEventListener("i18n:languageChanged", translate);
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", initializeI18nSystem);
else initializeI18nSystem();
