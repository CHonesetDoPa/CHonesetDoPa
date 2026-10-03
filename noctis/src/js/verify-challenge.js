/**
 * verify-challenge.js
 * PGP key display and signature verification.
 */

import linksConfig from "../config/links.js";

const verifyState = {
  activeKeyId: null,
  loadRequestId: 0,
  provenanceOpen: false,
};

function getConfiguredKeySet() {
  const configured = linksConfig.personal?.pgpKeys;
  if (!Array.isArray(configured)) return [];

  return configured.map((key, index) => {
    const provenance = key.provenance || {};
    const signers = Array.isArray(provenance.signers) ? provenance.signers : [];
    const signatures = Array.isArray(provenance.signatures)
      ? provenance.signatures
      : provenance.signaturePath
        ? [{ path: provenance.signaturePath, fileName: provenance.fileName }]
        : [];
    const primarySigner = signers[0] || {};

    return {
      id: key.id,
      label: key.label,
      status: key.status,
      local: key.local,
      remote: index === 0 ? key.remote : null,
      fileName: key.fileName,
      userId: key.userId,
      fingerprint: key.fingerprint,
      algorithm: key.algorithm,
      timeline: key.timeline,
      provenance: {
        signers,
        signatures,
        signerUserId: provenance.signerUserId || primarySigner.userId,
        signerFingerprint:
          provenance.signerFingerprint || primarySigner.fingerprint,
        targetFingerprint: provenance.targetFingerprint || key.fingerprint,
        descriptionKey: provenance.descriptionKey,
        description: provenance.description,
      },
    };
  });
}

function getActiveKey() {
  const keys = getConfiguredKeySet();
  if (verifyState.activeKeyId) {
    return keys.find((key) => key.id === verifyState.activeKeyId) || keys[0];
  }

  return keys[0];
}

function getTranslationText(keyPath) {
  if (window.t && typeof window.t === "function") {
    const value = window.t(keyPath);
    if (value) return value;
  }
  return keyPath;
}

function getLegacyKeyYear(keyId) {
  const match = typeof keyId === "string" && keyId.match(/^legacy-(\d{4})$/i);
  return match ? match[1] : null;
}

function getKeyTabLabel(key, index) {
  if (key.status === "active") {
    return getTranslationText("verify.pgpKey.tabs.current");
  }

  const legacyYear = getLegacyKeyYear(key.id);
  if (legacyYear) {
    return getTranslationText("verify.pgpKey.tabs.legacyWithYear").replace(
      "{{year}}",
      legacyYear,
    );
  }

  if (key.label === "Legacy") {
    return getTranslationText("verify.pgpKey.tabs.legacy");
  }

  if (typeof key.label === "string" && key.label.trim()) {
    return key.label;
  }

  if (index === 0) {
    return getTranslationText("verify.pgpKey.tabs.legacy");
  }

  return getTranslationText("verify.pgpKey.tabs.history");
}

function handleTabKeyNavigation(event, currentIndex, orderedKeys) {
  if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
    return;
  }

  const maxIndex = orderedKeys.length - 1;
  let nextIndex = currentIndex;

  if (event.key === "ArrowRight")
    nextIndex = currentIndex === maxIndex ? 0 : currentIndex + 1;
  if (event.key === "ArrowLeft")
    nextIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = maxIndex;

  const nextKey = orderedKeys[nextIndex];
  if (!nextKey) return;

  event.preventDefault();
  setActiveKey(nextKey.id);
  const nextButton = document.getElementById(`verify-key-tab-${nextKey.id}`);
  nextButton?.focus();
}

function renderKeyTabs() {
  const tabContainer = document.getElementById("pgp-key-tabs");
  const keys = getConfiguredKeySet();
  if (!tabContainer) return;

  if (!verifyState.activeKeyId) {
    verifyState.activeKeyId = keys[0]?.id || null;
  }

  tabContainer.replaceChildren();
  tabContainer.setAttribute(
    "aria-label",
    getTranslationText("verify.pgpKey.tabs.listLabel"),
  );

  keys.forEach((key, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = `verify-key-tab-${key.id}`;
    tab.className = `key-tab${
      !verifyState.provenanceOpen && verifyState.activeKeyId === key.id
        ? " active"
        : ""
    }`;
    tab.setAttribute("role", "tab");
    tab.setAttribute(
      "aria-selected",
      String(!verifyState.provenanceOpen && verifyState.activeKeyId === key.id),
    );
    tab.setAttribute("aria-controls", `verify-key-panel-${key.id}`);
    tab.dataset.keyId = key.id;
    tab.tabIndex = verifyState.activeKeyId === key.id ? 0 : -1;
    tab.textContent = getKeyTabLabel(key, index);

    tab.addEventListener("click", () => setActiveKey(key.id));
    tab.addEventListener("keydown", (event) =>
      handleTabKeyNavigation(event, index, keys),
    );

    tabContainer.appendChild(tab);
  });

  const hasProvenanceChain = keys.some(
    (key) => key.provenance?.signatures?.length,
  );
  if (hasProvenanceChain) {
    const provenanceTab = document.createElement("button");
    provenanceTab.type = "button";
    provenanceTab.id = "verify-key-tab-provenance";
    provenanceTab.className = `key-tab provenance-tab${
      verifyState.provenanceOpen ? " active" : ""
    }`;
    provenanceTab.setAttribute("role", "tab");
    provenanceTab.setAttribute("aria-controls", "key-provenance");
    provenanceTab.setAttribute(
      "aria-selected",
      String(verifyState.provenanceOpen),
    );
    provenanceTab.textContent = getTranslationText(
      "verify.pgpKey.provenance.timelineTitle",
    );
    provenanceTab.addEventListener("click", () => {
      verifyState.provenanceOpen = true;
      renderKeyTabs();
      updateCurrentKeyMeta();
    });
    tabContainer.appendChild(provenanceTab);
  }
}

function getTimelineLabel(key) {
  const labelKey = key.timeline?.labelKey;
  if (!labelKey) return getKeyTabLabel(key, 0);

  const label = getTranslationText(labelKey);
  const year = getLegacyKeyYear(key.id);
  return year ? label.replace("{{year}}", year) : label;
}

function renderProvenanceDetails(detailsNode, activeKey, previousKey) {
  const descriptionKey =
    activeKey.provenance?.descriptionKey ||
    "verify.pgpKey.provenance.description";
  const description = activeKey.provenance?.descriptionKey
    ? getTranslationText(descriptionKey)
    : activeKey.provenance?.description || descriptionKey;
  const signerLabel = getTranslationText("verify.pgpKey.provenance.signer");
  const targetLabel = getTranslationText("verify.pgpKey.provenance.target");
  const clearSignatureLabel = getTranslationText(
    "verify.pgpKey.provenance.clearSignature",
  );
  const notAvailable = getTranslationText(
    "verify.pgpKey.provenance.notAvailable",
  );
  const title = getTranslationText("verify.pgpKey.provenance.title");
  const signatures = activeKey.provenance?.signatures || [];

  const header = document.createElement("div");
  header.className = "provenance-header";
  const icon = document.createElement("i");
  icon.className = "fas fa-signature";
  icon.setAttribute("aria-hidden", "true");
  const heading = document.createElement("h3");
  heading.textContent = getTranslationText(
    "verify.pgpKey.provenance.verificationProcess",
  );
  header.append(icon, heading);

  const descriptionNode = document.createElement("p");
  descriptionNode.append(document.createTextNode(`${title}: ${description}`));

  const list = document.createElement("ul");
  list.className = "provenance-list";
  const signerItem = document.createElement("li");
  const signers = activeKey.provenance?.signers || [];
  const signerText = signers
    .map((signer) => signer.userId)
    .filter(Boolean)
    .join(", ");
  appendLabeledValue(
    signerItem,
    signerLabel,
    signerText || previousKey?.userId || notAvailable,
  );
  const targetItem = document.createElement("li");
  appendLabeledValue(targetItem, targetLabel, activeKey.fingerprint);
  const signatureItem = document.createElement("li");
  appendLabeledValue(signatureItem, clearSignatureLabel);

  if (signatures.length > 0) {
    signatures.forEach((signature, index) => {
      if (index > 0) signatureItem.append(", ");
      const link = document.createElement("a");
      link.href = signature.path;
      link.download = signature.fileName || "";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = signature.fileName || signature.path;
      signatureItem.append(" ", link);
    });
  } else {
    const unavailable = document.createElement("span");
    unavailable.className = "provenance-muted";
    unavailable.textContent = notAvailable;
    signatureItem.append(" ", unavailable);
  }

  list.append(signerItem, targetItem, signatureItem);
  detailsNode.replaceChildren(header, descriptionNode, list);
}

function appendLabeledValue(container, label, value = "") {
  const strong = document.createElement("strong");
  strong.textContent = label;
  container.append(strong, " ", document.createTextNode(value));
}

function renderProvenanceTimeline(provenanceNode, keys, activeKey) {
  const activeIndex = keys.findIndex((key) => key.id === activeKey.id);
  const timelineKeys = [...keys].reverse();
  const timelineNodes = timelineKeys.map((key) => {
    const keyIndex = keys.findIndex((item) => item.id === key.id);
    const previousKey = keyIndex >= 0 ? keys[keyIndex + 1] : null;
    const isSelected = key.id === activeKey.id;
    const node = document.createElement("button");
    node.type = "button";
    node.className = `provenance-node${isSelected ? " active" : ""}`;
    node.dataset.keyId = key.id;
    node.setAttribute("aria-pressed", String(isSelected));
    const marker = document.createElement("span");
    marker.className = "provenance-node-marker";
    marker.setAttribute("aria-hidden", "true");
    const date = document.createElement("span");
    date.className = "provenance-node-date";
    date.textContent = key.timeline?.date || "";
    const label = document.createElement("span");
    label.className = "provenance-node-label";
    label.textContent = getTimelineLabel(key);
    node.append(marker, date, label);
    node.addEventListener("click", () => {
      timelineNodes.forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-pressed", "false");
      });
      node.classList.add("active");
      node.setAttribute("aria-pressed", "true");
      renderProvenanceDetails(
        provenanceNode.querySelector(".provenance-details"),
        key,
        previousKey,
      );
    });
    return node;
  });

  const panel = document.createElement("div");
  panel.className = "provenance-panel";
  const header = document.createElement("div");
  header.className = "provenance-header";
  const icon = document.createElement("i");
  icon.className = "fas fa-route";
  icon.setAttribute("aria-hidden", "true");
  const heading = document.createElement("h3");
  heading.textContent = getTranslationText(
    "verify.pgpKey.provenance.timelineTitle",
  );
  header.append(icon, heading);
  const hint = document.createElement("p");
  hint.className = "provenance-hint";
  hint.textContent = getTranslationText(
    "verify.pgpKey.provenance.timelineHint",
  );
  const timeline = document.createElement("div");
  timeline.className = "provenance-timeline";
  timeline.setAttribute("role", "list");
  const details = document.createElement("div");
  details.className = "provenance-details";
  details.setAttribute("aria-live", "polite");
  panel.append(header, hint, timeline, details);
  timelineNodes.forEach((node) => timeline.appendChild(node));
  provenanceNode.appendChild(panel);

  const selectedKey = keys[activeIndex] || keys[0];
  const selectedIndex = keys.findIndex((key) => key.id === selectedKey?.id);
  renderProvenanceDetails(
    details,
    selectedKey,
    selectedIndex >= 0 ? keys[selectedIndex + 1] : null,
  );
}

function updateCurrentKeyMeta() {
  const activeKey = getActiveKey();
  const userNode = document.getElementById("key-user-id");
  const fingerprintNode = document.getElementById("key-fingerprint");
  const algorithmNode = document.getElementById("key-algorithm");
  const provenanceNode = document.getElementById("key-provenance");
  const keyPanel = document.getElementById("key-verification-panel");
  const toggleText = document.querySelector(".btn-toggle-key [data-i18n]");
  const remoteButton = document.getElementById("remote-pgp-key-button");

  if (!activeKey) {
    if (remoteButton) {
      remoteButton.hidden = true;
      remoteButton.disabled = true;
      remoteButton.setAttribute("aria-hidden", "true");
      remoteButton.style.display = "none";
    }
    if (keyPanel) keyPanel.hidden = true;
    if (provenanceNode) provenanceNode.hidden = true;
    return;
  }

  if (keyPanel) {
    keyPanel.hidden = verifyState.provenanceOpen;
    keyPanel.setAttribute("aria-hidden", String(verifyState.provenanceOpen));
    keyPanel.setAttribute("aria-labelledby", `verify-key-tab-${activeKey.id}`);
  }
  if (provenanceNode) {
    provenanceNode.hidden = !verifyState.provenanceOpen;
    provenanceNode.setAttribute(
      "aria-hidden",
      String(!verifyState.provenanceOpen),
    );
  }

  if (userNode) userNode.textContent = activeKey.userId;
  if (fingerprintNode) fingerprintNode.textContent = activeKey.fingerprint;
  if (algorithmNode) algorithmNode.textContent = activeKey.algorithm;
  if (remoteButton) {
    const hasRemoteResource = Boolean(activeKey.remote);
    remoteButton.hidden = !hasRemoteResource;
    remoteButton.disabled = !hasRemoteResource;
    remoteButton.setAttribute("aria-hidden", String(!hasRemoteResource));
    remoteButton.style.display = hasRemoteResource ? "" : "none";
  }

  if (provenanceNode) {
    const keys = getConfiguredKeySet();
    provenanceNode.replaceChildren();
    if (verifyState.provenanceOpen) {
      const hasProvenanceChain = keys.some(
        (key) => key.provenance?.signatures?.length,
      );
      if (hasProvenanceChain) {
        renderProvenanceTimeline(provenanceNode, keys, activeKey);
      }
    }
  }

  if (toggleText) {
    const wrapper = document.querySelector(".key-block-wrapper");
    const isOpen = wrapper && wrapper.style.display !== "none";
    toggleText.textContent = isOpen
      ? getTranslationText("verify.pgpKey.buttons.hide")
      : getTranslationText("verify.pgpKey.buttons.show");
  }
}

function setActiveKey(keyId) {
  const keys = getConfiguredKeySet();
  const selectedKey = keys.find((key) => key.id === keyId) || keys[0];
  if (!selectedKey) return;

  verifyState.provenanceOpen = false;
  verifyState.activeKeyId = selectedKey.id;
  renderKeyTabs();
  updateCurrentKeyMeta();
  const wrapper = document.querySelector(".key-block-wrapper");
  if (wrapper && wrapper.style.display !== "none") {
    void loadActiveKey(selectedKey);
  }
}

async function loadActiveKey(activeKey) {
  const keyBlock = document.getElementById("pgp-key-block");
  if (!keyBlock) return;

  const requestId = ++verifyState.loadRequestId;
  const isCurrentRequest = () =>
    requestId === verifyState.loadRequestId &&
    getActiveKey()?.id === activeKey?.id;

  const fallbackText = getTranslationText("verify.pgpKey.loadFailed");

  if (!activeKey?.local) {
    if (isCurrentRequest()) keyBlock.textContent = fallbackText;
    return;
  }

  try {
    const resp = await fetch(activeKey.local);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const keyText = await resp.text();
    if (isCurrentRequest()) keyBlock.textContent = keyText;
  } catch {
    if (isCurrentRequest()) keyBlock.textContent = fallbackText;
  }
}

function showResult(type, title, message, details) {
  const resultDiv = document.getElementById("verification-result");
  if (!resultDiv) return;

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

function showKeyConfigurationError() {
  const message = getTranslationText("verify.pgpKey.configurationError");
  const keyBlock = document.getElementById("pgp-key-block");
  const localButton = document.querySelector(
    '.verification-buttons [onclick="downloadPublicKey()"]',
  );
  const toggleButton = document.querySelector(".btn-toggle-key");

  if (keyBlock) keyBlock.textContent = message;
  if (localButton) localButton.disabled = true;
  if (toggleButton) toggleButton.disabled = true;
  showResult("error", getTranslationText("verify.pgpKey.loadFailed"), message);
}

function downloadPublicKey() {
  const activeKey = getActiveKey();
  if (!activeKey) {
    showKeyConfigurationError();
    return;
  }

  try {
    const keyUrl = activeKey.local;
    const a = document.createElement("a");
    a.href = keyUrl;
    a.download = activeKey.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showResult(
      "success",
      getTranslationText("verify.pgpKey.downloadSuccess"),
      getTranslationText("verify.pgpKey.downloadMsg"),
      [
        {
          label: getTranslationText("verify.pgpKey.labels.userId"),
          value: activeKey.userId,
        },
        {
          label: getTranslationText("verify.pgpKey.labels.fingerprint"),
          value: activeKey.fingerprint,
        },
        {
          label: getTranslationText("verify.pgpKey.labels.usage"),
          value: getTranslationText("verify.pgpKey.downloadUsage"),
        },
      ],
    );
  } catch (error) {
    showResult(
      "error",
      getTranslationText("verify.pgpKey.downloadFailed"),
      `${getTranslationText("verify.pgpKey.downloadFailedMsg")}: ${error.message}`,
    );
  }
}

async function initializePage() {
  const configuredKeys = getConfiguredKeySet();
  if (configuredKeys.length === 0) {
    showKeyConfigurationError();
    console.error("PGP key configuration is empty");
    return;
  }

  renderKeyTabs();
  updateCurrentKeyMeta();
}

function replaceFaIcon(oldIcon, newClass) {
  if (!oldIcon) return;
  const newIcon = document.createElement("i");
  newIcon.setAttribute("class", newClass);
  newIcon.setAttribute("aria-hidden", "true");
  oldIcon.replaceWith(newIcon);
}

window.togglePGPKey = async function () {
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

    const activeKey = getActiveKey();
    if (activeKey) {
      await loadActiveKey(activeKey);
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
      const range = document.createRange();
      range.selectNodeContents(keyBlock);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
};

window.downloadPGPKey = function (type) {
  const activeKey = getActiveKey();
  if (!activeKey) {
    console.error("PGP key configuration not found");
    return;
  }

  switch (type) {
    case "remote":
      if (activeKey.remote) {
        window.location.href = activeKey.remote;
      }
      break;
    default:
      console.error("Invalid PGP key download type:", type);
  }
};

document.addEventListener("DOMContentLoaded", initializePage);
document.addEventListener("i18n:languageChanged", () => {
  renderKeyTabs();
  updateCurrentKeyMeta();
});
window.downloadPublicKey = downloadPublicKey;
