/**
 * verify-challenge.js
 * PGP key display and signature verification.
 */

import linksConfig from "../config/links.js";

// Known key metadata (extracted from PGP comment headers)
const CH_KEY_FINGERPRINT = "E802A6BF8C2B8ED71B9D08FFC6881736D7BC83D8";
const CH_KEY_USER = "CHonesetDoPa <ch@nekoc.cc>";

// Path to the public PGP key file (single source of truth in links.js)
const CH_PUBLIC_KEY_PATH = linksConfig.personal?.pgpKey?.local || "/ch.asc";

/**
 * Show result/info in the result area
 * @param {string} type - Result type (success/error/info)
 * @param {string} title - Result title
 * @param {string} message - Result message
 * @param {Array<{label: string, value: string}>} [details] - Optional label/value rows
 */
function showResult(type, title, message, details) {
  const resultDiv = document.getElementById("verification-result");
  resultDiv.className = `verification-result result-${type}`;
  resultDiv.textContent = "";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  resultDiv.append(heading, paragraph);

  if (Array.isArray(details) && details.length > 0) {
    details.forEach(({ label, value }) => {
      const row = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label;
      row.append(strong, document.createTextNode(` ${value}`));
      resultDiv.appendChild(row);
    });
  }

  resultDiv.style.display = "block";
  resultDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Download public key from the server
 */
function downloadPublicKey() {
  try {
    const a = document.createElement("a");
    a.href = CH_PUBLIC_KEY_PATH;
    a.download = "ch-public-key.asc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showResult(
      "success",
      window.t("verify.pgpKey.downloadSuccess"),
      window.t("verify.pgpKey.downloadMsg"),
      [
        {
          label: window.t("verify.pgpKey.labels.userId"),
          value: CH_KEY_USER,
        },
        {
          label: window.t("verify.pgpKey.labels.fingerprint"),
          value: CH_KEY_FINGERPRINT,
        },
        {
          label: window.t("verify.pgpKey.labels.usage"),
          value: window.t("verify.pgpKey.downloadUsage"),
        },
      ],
    );
  } catch (error) {
    showResult(
      "error",
      window.t("verify.pgpKey.downloadFailed"),
      `${window.t("verify.pgpKey.downloadFailedMsg")}: ${error.message}`,
    );
  }
}

/**
 * Initialize page — fetch PGP public key from server
 */
async function initializePage() {
  const keyBlock = document.getElementById("pgp-key-block");
  if (keyBlock) {
    try {
      const resp = await fetch(CH_PUBLIC_KEY_PATH);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      keyBlock.textContent = await resp.text();
    } catch {
      const _t = (k) => (window.t ? window.t(k) : k);
      keyBlock.textContent = _t("verify.pgpKey.loadFailed");
    }
  }
  console.log(
    `✓ CH PGP public key loaded - User: ${CH_KEY_USER}, Fingerprint: ${CH_KEY_FINGERPRINT}`,
  );
}

// ----------------------
// Global functions for verify page (HTML onclick handlers)
// ----------------------
/**
 * Replace a Font Awesome icon element (<i> or <svg>) with a new <i> tag,
 * letting Font Awesome's dom.watch() re-render the SVG automatically.
 * @param {Element} oldIcon - The current icon element to replace
 * @param {string} newClass - The new Font Awesome class (e.g. "fas fa-eye-slash")
 */
function replaceFaIcon(oldIcon, newClass) {
  if (!oldIcon) return;
  const newIcon = document.createElement("i");
  newIcon.setAttribute("class", newClass);
  newIcon.setAttribute("aria-hidden", "true");
  oldIcon.replaceWith(newIcon);
}

window.togglePGPKey = function () {
  const keyBlock = document.getElementById("pgp-key-block");
  const toggleBtn = document.querySelector(".btn-toggle-key");
  const toggleIcon = toggleBtn?.querySelector(
    ".fa-eye, .fa-eye-slash, [data-icon='eye'], [data-icon='eye-slash']",
  );
  const toggleText = toggleBtn?.querySelector("[data-i18n]");

  if (!keyBlock) return;

  const wrapper = keyBlock.closest(".key-block-wrapper");
  const isHidden = wrapper ? wrapper.style.display === "none" : false;

  if (isHidden) {
    wrapper.style.display = "block";
    toggleBtn?.classList.add("active");
    toggleBtn?.setAttribute("aria-expanded", "true");
    replaceFaIcon(toggleIcon, "fas fa-eye-slash");
    if (toggleText) {
      toggleText.textContent = window.t("verify.pgpKey.buttons.hide");
      toggleText.dataset.i18n = "verify.pgpKey.buttons.hide";
    }
  } else {
    wrapper.style.display = "none";
    toggleBtn?.classList.remove("active");
    toggleBtn?.setAttribute("aria-expanded", "false");
    replaceFaIcon(toggleIcon, "fas fa-eye");
    if (toggleText) {
      toggleText.textContent = window.t("verify.pgpKey.buttons.show");
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
      const icon = btn?.querySelector(
        ".fa-copy, .fa-check, [data-icon='copy'], [data-icon='check']",
      );
      replaceFaIcon(icon, "fas fa-check");
      btn?.classList.add("copied");
      setTimeout(() => {
        const currentIcon = btn?.querySelector(
          ".fa-check, [data-icon='check']",
        );
        replaceFaIcon(currentIcon, "fas fa-copy");
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
    case "remote":
      window.location.href = pgpKeyConfig.remote;
      break;
    default:
      console.error("Invalid PGP key download type:", type);
  }
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePage);

// Expose functions to global scope for HTML onclick handlers
window.downloadPublicKey = downloadPublicKey;
