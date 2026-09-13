/**
 * bootstrap.js
 * Shared page bootstrap: styles, modules, i18n data and link manager init.
 */

// ----------------------
// Import global styles
// ----------------------
import "../style/index.css";
import "../icon.js";
// ----------------------
// Import local JS modules
// ----------------------
import "./utils.js";
import "./typed-init.js";
import "./cur-effect.js";
import "./dark-mode-manager.js";
// ----------------------
// Load translation data before i18n system
// ----------------------
import Lang_ZH from "../config/i18n/zh.js";
import Lang_EN from "../config/i18n/en.js";
import Lang_Vampire from "../config/i18n/vampire.js";
window.i18n = { Lang_ZH, Lang_EN, Lang_Vampire };
// ----------------------
// Initialize i18n system after translation data is loaded
// ----------------------
import "./i18n-system.js";
import "./link-manager.js";
// ----------------------
// Import npm libraries
// ----------------------
import "instant.page";
// ----------------------
// Import images or other assets
// ----------------------
import "../assets/cur/ayuda.cur";
import "../assets/cur/normal.cur";

import bgUrl from "../assets/img/BG.webp";
import avatarUrl from "../assets/img/Avatar.webp";
import linksConfig from "../config/links.js";

/**
 * Apply the shared hero background and preload it for LCP.
 */
function applyBackground() {
  const header = document.getElementById("nav");
  if (header) {
    header.style.backgroundImage = `url(${bgUrl})`;
  }
  const lcpPreload = document.createElement("link");
  lcpPreload.rel = "preload";
  lcpPreload.as = "image";
  lcpPreload.href = bgUrl;
  lcpPreload.fetchPriority = "high";
  document.head.appendChild(lcpPreload);
}

/**
 * Set the avatar image, supporting both id and class based markup.
 */
function applyAvatar() {
  const avatarImg =
    document.getElementById("avatar") || document.querySelector(".avatar-img");
  if (avatarImg) {
    avatarImg.src = avatarUrl;
  }
}

/**
 * Initialize the shared page chrome and the link manager.
 * @param {Object} [options]
 * @param {Object} [options.config] - Optional config override (defaults to links.js)
 */
export function bootstrapPage({ config } = {}) {
  applyBackground();
  applyAvatar();

  const finalConfig = config || linksConfig;

  if (window.linkManager) {
    window.linkManager.initializeAll(finalConfig);
  }

  return finalConfig;
}

export { bgUrl, avatarUrl, linksConfig };
