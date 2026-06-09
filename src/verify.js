// main.js
// Entry Point

// ----------------------
// Import global styles
// ----------------------
import "./style/index.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "./style/verify.css";
// ----------------------
// Import local JS modules
// ----------------------
import "./js/utils.js";
import "./js/typed-init.js";
import "./js/cur-effect.js";
import "./js/dark-mode-manager.js";
import "./js/verify-challenge.js";
// ----------------------
// Load translation data before i18n system
// ----------------------
import Lang_ZH from "./config/i18n/zh.js";
import Lang_EN from "./config/i18n/en.js";
import Lang_Vampire from "./config/i18n/vampire.js";
window.i18n = { Lang_ZH, Lang_EN, Lang_Vampire };
// ----------------------
// Initialize i18n system after translation data is loaded
// ----------------------
import "./js/i18n-system.js";
import "./js/link-manager.js";
// ----------------------
// Import npm libraries
// ----------------------
import "instant.page";
// ----------------------
// Import images or other assets
// ----------------------
import "./assets/cur/ayuda.cur";
import "./assets/cur/normal.cur";

import bgUrl from "./assets/img/BG.webp";
const header = document.getElementById("nav");
if (header) {
  header.style.backgroundImage = `url(${bgUrl})`;
}

import avatarUrl from "./assets/img/Avatar.webp";
const avatarImg = document.getElementById("avatar");
if (avatarImg) {
  avatarImg.src = avatarUrl;
}
// ----------------------
// Configure and initialize libraries
// ----------------------
import linksConfig from "./config/links.js";

// Initialize LinkManager with config
if (window.linkManager) {
  window.linkManager.initializeAll(linksConfig);
}

// ----------------------
// Global functions for verify page
// ----------------------
window.togglePGPKey = function () {
  const keyBlock = document.getElementById("pgp-key-block");
  const toggleBtn = document.querySelector(".btn-toggle-key");
  const toggleIcon = toggleBtn?.querySelector(".fa-eye, .fa-eye-slash");
  const toggleText = toggleBtn?.querySelector("[data-i18n]");

  if (!keyBlock) return;

  const wrapper = keyBlock.closest(".key-block-wrapper");
  const isHidden = wrapper ? wrapper.style.display === "none" : false;

  if (isHidden) {
    wrapper.style.display = "block";
    toggleBtn?.classList.add("active");
    toggleBtn?.setAttribute("aria-expanded", "true");
    if (toggleIcon) {
      toggleIcon.className = "fas fa-eye-slash";
    }
    if (toggleText) {
      toggleText.textContent = "隐藏公钥";
      toggleText.dataset.i18n = "verify.pgpKey.buttons.hide";
    }
  } else {
    wrapper.style.display = "none";
    toggleBtn?.classList.remove("active");
    toggleBtn?.setAttribute("aria-expanded", "false");
    if (toggleIcon) {
      toggleIcon.className = "fas fa-eye";
    }
    if (toggleText) {
      toggleText.textContent = "显示公钥";
      toggleText.dataset.i18n = "verify.pgpKey.buttons.show";
    }
  }
};

window.copyPGPKey = function () {
  const keyBlock = document.getElementById("pgp-key-block");
  const btn = document.querySelector(".btn-copy-key");
  if (!keyBlock || !keyBlock.textContent) return;

  navigator.clipboard
    .writeText(keyBlock.textContent)
    .then(() => {
      const icon = btn?.querySelector(".fa-copy, .fa-check");
      if (icon) {
        icon.className = "fas fa-check";
      }
      btn?.classList.add("copied");
      setTimeout(() => {
        if (icon) {
          icon.className = "fas fa-copy";
        }
        btn?.classList.remove("copied");
      }, 2000);
    })
    .catch(() => {
      // Fallback: select text manually
      const range = document.createRange();
      range.selectNodeContents(keyBlock);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
};

window.downloadPGPKey = function (type) {
  const pgpKeyConfig = linksConfig.personal?.pgpKey;
  if (!pgpKeyConfig) {
    console.error("PGP key configuration not found");
    return;
  }

  switch (type) {
    case "local":
      window.location.href = pgpKeyConfig.local;
      break;
    case "remote":
      window.location.href = pgpKeyConfig.remote;
      break;
    default:
      console.error("Invalid PGP key download type:", type);
  }
};
