/*
 * i18n-system.js
 * author: CHonesetDoPa
 * version: 2.0.0 (Modularized)
 */
// ===== I18n 配置 =====
const DEFAULT_I18N_CONFIG = {
  supportedLanguages: ["zh", "en", "vampire"],
  defaultLanguage: "zh",
  fallbackLanguage: "en",
  storageKey: "site-language-preference",
  autoDetect: { enabled: true, urlParam: "lang" },
  inlineTranslations: {
    enabled: true,
    mapping: { zh: "Lang_ZH", en: "Lang_EN", vampire: "Lang_Vampire" },
  },
  languageNames: { zh: "中文", en: "English", vampire: "血族古语" },
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
    let detected = this.config.defaultLanguage;
    try {
      if (this.config.autoDetect && this.config.autoDetect.urlFirst) {
        const p = new URLSearchParams(window.location.search);
        const urlLang = p.get(this.config.autoDetect.urlParam || "lang");
        if (urlLang && this.config.supportedLanguages.includes(urlLang))
          detected = urlLang;
      }
      if (detected === this.config.defaultLanguage) {
        const saved = localStorage.getItem(this.config.storageKey);
        if (saved && this.config.supportedLanguages.includes(saved))
          detected = saved;
      }
      if (
        detected === this.config.defaultLanguage &&
        this.config.autoDetect &&
        this.config.autoDetect.enabled
      ) {
        const b = this.detectBrowserLanguage();
        if (b) detected = b;
      }
    } catch (e) {
      /* ignore */
    }
    this.currentLanguage = detected;
    this.saveLanguagePreference(detected);
    return detected;
  }

  detectBrowserLanguage() {
    const langs = [
      navigator.language,
      ...(navigator.languages || []),
      navigator.userLanguage,
      navigator.browserLanguage,
    ].filter(Boolean);
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

  handleMissingTranslation(key, error) {
    if (this.currentLanguage !== this.config.fallbackLanguage) {
      try {
        return this.getTranslation(key, this.config.fallbackLanguage);
      } catch (e) {}
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
    } catch (e) {}
  }
  updateUrl(language) {
    const url = new URL(window.location);
    url.searchParams.set(this.config.autoDetect.urlParam || "lang", language);
    window.history.replaceState({}, "", url);
  }

  // apply translations to DOM
  async applyLanguage(language) {
    try {
      const i18nEls = document.querySelectorAll("[data-i18n]");
      i18nEls.forEach((el) => {
        const k = el.getAttribute("data-i18n");
        if (k) {
          const t = this.t(k);
          if (t && t !== k) el.textContent = t;
        }
      });
      const phEls = document.querySelectorAll("[data-i18n-placeholder]");
      phEls.forEach((el) => {
        const k = el.getAttribute("data-i18n-placeholder");
        if (k) {
          const t = this.t(k);
          if (t && t !== k) el.placeholder = t;
        }
      });
      const titleEls = document.querySelectorAll("[data-i18n-title]");
      titleEls.forEach((el) => {
        const k = el.getAttribute("data-i18n-title");
        if (k) {
          const t = this.t(k);
          if (t && t !== k) el.title = t;
        }
      });
      // 更新 aria-label（由 i18n 负责可访问性文本）
      const ariaEls = document.querySelectorAll("[data-i18n-aria-label]");
      ariaEls.forEach((el) => {
        const k = el.getAttribute("data-i18n-aria-label");
        if (k) {
          const t = this.t(k);
          if (t && t !== k) el.setAttribute("aria-label", t);
        }
      });
      const altEls = document.querySelectorAll("[data-i18n-alt]");
      altEls.forEach((el) => {
        const k = el.getAttribute("data-i18n-alt");
        if (k) {
          const t = this.t(k);
          if (t && t !== k) el.setAttribute("alt", t);
        }
      });
      const metaEls = document.querySelectorAll("[data-i18n-meta-content]");
      metaEls.forEach((el) => {
        const k = el.getAttribute("data-i18n-meta-content");
        if (k) {
          const t = this.t(k);
          if (t && t !== k) el.setAttribute("content", t);
        }
      });
    } catch (e) {
      console.error("[I18n] applyLanguage error", e);
    }
  }

  updateLanguageButton() {
    const btn = document.getElementById("language-switch-btn");
    if (!btn) return;
    const normal = ["zh", "en"];
    const idx = normal.indexOf(this.currentLanguage);
    const next = idx === -1 ? "zh" : normal[(idx + 1) % normal.length];
    const name =
      this.t(`language.${next}`) ||
      this.config.languageNames[next] ||
      (next === "zh" ? "中文" : "English");
    btn.textContent = name;
    btn.setAttribute(
      "title",
      this.t("common.switchLanguage") || "Switch Language",
    );
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
      if (typeof swal !== "undefined") {
        const t = window.t || ((k) => k);
        swal({
          title: t("greeting.vampireMode.activated") || "血族觉醒！",
          text: "",
          icon: "success",
          buttons: true,
        }).then(() => resolve());
      } else {
        alert(t("greeting.vampireMode.activated") || "血族觉醒！");
        resolve();
      }
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
        } catch (e) {}
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
      if (!window.i18n || typeof window.i18n !== "object") {
        createFallbackController();
        setupGlobalFunctions();
        return false;
      }
      const hasValid =
        window.i18n.Lang_ZH || window.i18n.Lang_EN || window.i18n.Lang_Vampire;
      if (!hasValid) {
        createFallbackController();
        setupGlobalFunctions();
        return false;
      }
      i18nInstance = new I18n(window.I18nConfig);
      await i18nInstance.init();
      languageController = i18nInstance;
      setupGlobalFunctions();
      setupAutoTranslation();
      setupEventListeners();
      window.dispatchEvent(
        new CustomEvent("i18nSystemReady", {
          detail: {
            language: getCurrentLanguage(),
            hasAdvancedController: !!languageController,
            hasI18nCore: !!i18nInstance,
          },
        }),
      );
      return true;
    } catch (e) {
      createFallbackController();
      setupGlobalFunctions();
      return false;
    }
  })();
  return initPromise;
}

function createFallbackController() {
  languageController = {
    currentLanguage: "zh",
    supportedLanguages: ["zh", "en"],
    isInitialized: false,
    getCurrentLanguage() {
      return this.currentLanguage;
    },
    async setLanguage(lang) {
      if (this.supportedLanguages.includes(lang)) {
        this.currentLanguage = lang;
        try {
          localStorage.setItem("site-language-preference", lang);
        } catch (e) {}
      }
    },
    async switchLanguage() {
      const i = this.supportedLanguages.indexOf(this.currentLanguage);
      const n = (i + 1) % this.supportedLanguages.length;
      await this.setLanguage(this.supportedLanguages[n]);
    },
    t(key) {
      return key;
    },
    isReady() {
      return true;
    },
  };
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
  const translate = () => {
    const els = document.querySelectorAll("[data-i18n]");
    els.forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (k) {
        const t = window.t(k);
        if (t && t !== k) el.textContent = t;
      }
    });
    const ph = document.querySelectorAll("[data-i18n-placeholder]");
    ph.forEach((el) => {
      const k = el.getAttribute("data-i18n-placeholder");
      if (k) {
        const t = window.t(k);
        if (t && t !== k) el.placeholder = t;
      }
    });
    const tt = document.querySelectorAll("[data-i18n-title]");
    tt.forEach((el) => {
      const k = el.getAttribute("data-i18n-title");
      if (k) {
        const t = window.t(k);
        if (t && t !== k) el.title = t;
      }
    });
    // aria-label support
    const ar = document.querySelectorAll("[data-i18n-aria-label]");
    ar.forEach((el) => {
      const k = el.getAttribute("data-i18n-aria-label");
      if (k) {
        const t = window.t(k);
        if (t && t !== k) el.setAttribute("aria-label", t);
      }
    });
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
                  n.querySelector(
                    "[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label]",
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

function setupEventListeners() {
  document.addEventListener("i18n:languageChanged", (e) => {
    const { language, previousLanguage } = e.detail || {};
    const docLang = language === "vampire" ? "zh-CN" : language;
    document.documentElement.lang = docLang;
    const titleKey =
      document.title && document.title.getAttribute
        ? document.title.getAttribute("data-i18n")
        : null;
    if (titleKey) document.title = window.t(titleKey);
  });
  document.addEventListener("i18n:error", (e) =>
    console.error("[I18n] Error:", e.detail),
  );
  document.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey && ev.altKey && ev.code === "KeyL") {
      ev.preventDefault();
      window.switchLanguage();
    }
  });
}

function waitForTranslationData(maxWait = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    (function check() {
      if (
        window.i18n &&
        typeof window.i18n === "object" &&
        (window.i18n.Lang_ZH || window.i18n.Lang_EN || window.i18n.Lang_Vampire)
      ) {
        resolve(true);
        return;
      }
      if (Date.now() - start > maxWait) {
        resolve(false);
        return;
      }
      setTimeout(check, 50);
    })();
  });
}

async function safeInitializeI18nSystem() {
  try {
    const has = await waitForTranslationData();
    if (has) return await initializeI18nSystem();
    createFallbackController();
    setupGlobalFunctions();
    return false;
  } catch (e) {
    createFallbackController();
    setupGlobalFunctions();
    return false;
  }
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", safeInitializeI18nSystem);
else safeInitializeI18nSystem();

window.initI18nSystem = initializeI18nSystem;
window.safeInitI18nSystem = safeInitializeI18nSystem;

const I18nConfig =
  typeof window !== "undefined" && window.I18nConfig
    ? window.I18nConfig
    : DEFAULT_I18N_CONFIG;
if (typeof window !== "undefined") window.I18n = I18n;
export { I18n, I18nConfig };
