/**
 * site-interactions.js
 * Binds page controls without relying on inline event handlers.
 */

const actions = {
  "toggle-theme": () => window.dark?.(),
  "switch-language": () => window.switchLanguage?.(),
  "sponsor-wechat": () => window.sponsor_wechat?.(),
  "sponsor-patreon": () => window.sponsor_patreon?.(),
  "sponsor-afdian": () => window.sponsor_afdian?.(),
  "sponsor-opencollective": () => window.sponsor_opencollective?.(),
  "toggle-pgp-key": () => window.togglePGPKey?.(),
  "copy-pgp-key": () => window.copyPGPKey?.(),
  "download-public-key": () => window.downloadPublicKey?.(),
  "download-pgp-key": (event) =>
    window.downloadPGPKey?.(event.currentTarget.dataset.keyType),
};

function bindSiteInteractions() {
  document.querySelectorAll("[data-action]").forEach((element) => {
    const action = actions[element.dataset.action];
    if (!action || element.dataset.bound === "true") return;

    element.addEventListener("click", action);
    element.dataset.bound = "true";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindSiteInteractions, {
    once: true,
  });
} else {
  bindSiteInteractions();
}

export { bindSiteInteractions };
