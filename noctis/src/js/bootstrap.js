/**
 * bootstrap.js
 * Shared page bootstrap: styles, modules and link manager init.
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
// Initialize i18n system
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

import linksConfig from "../config/links.js";

/**
 * Initialize the shared page chrome and the link manager.
 * @param {Object} [options]
 * @param {Object} [options.config] - Optional config override (defaults to links.js)
 */
export function bootstrapPage({ config } = {}) {
  const finalConfig = config || linksConfig;

  if (window.linkManager) {
    window.linkManager.initializeAll(finalConfig);
  }

  return finalConfig;
}

export { linksConfig };
