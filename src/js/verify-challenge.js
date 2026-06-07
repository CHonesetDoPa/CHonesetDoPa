/**
 * PGP Key Display for CH Security Verification Center
 */

// Known key metadata (extracted from PGP comment headers)
const CH_KEY_FINGERPRINT = "E802A6BF8C2B8ED71B9D08FFC6881736D7BC83D8";
const CH_KEY_USER = "CHonesetDoPa <ch@nekoc.cc>";

// Path to the public PGP key file
const CH_PUBLIC_KEY_PATH = "/ch.asc";

/**
 * Show result/info in the result area
 */
function showResult(type, title, message) {
  const resultDiv = document.getElementById("verification-result");
  resultDiv.className = `verification-result result-${type}`;
  resultDiv.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
    `;
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
      window.t("verify.pgpKey.downloadSuccess") || "下载完成",
      `${window.t("verify.pgpKey.downloadMsg") || "CH的PGP公钥已下载成功！"}<br>
             <strong>${window.t("verify.pgpKey.labels.userId") || "用户ID:"}</strong> ${CH_KEY_USER}<br>
             <strong>${window.t("verify.pgpKey.labels.fingerprint") || "指纹:"}</strong> ${CH_KEY_FINGERPRINT}<br>
             <strong>${window.t("verify.pgpKey.labels.usage") || "使用方法:"}</strong> ${window.t("verify.pgpKey.downloadUsage") || "请将下载的密钥文件导入到您的PGP软件中进行验证。"}`,
    );
  } catch (error) {
    showResult("error", window.t("verify.pgpKey.downloadFailed") || "下载失败", `${window.t("verify.pgpKey.downloadFailedMsg") || "无法下载公钥"}: ${error.message}`);
  }
}

/**
 * Show public key information (fetches key content from server)
 */
async function showPublicKeyInfo() {
  let keyContent = "";
  try {
    const resp = await fetch(CH_PUBLIC_KEY_PATH);
    keyContent = await resp.text();
  } catch {
    keyContent = "（无法加载公钥内容）";
  }

  showResult(
    "success",
    window.t("verify.pgpKey.keyInfoTitle") || "CH的PGP公钥信息",
    `<strong>${window.t("verify.pgpKey.labels.userId") || "用户ID:"}</strong> ${CH_KEY_USER}<br>
         <strong>${window.t("verify.pgpKey.labels.fingerprint") || "指纹:"}</strong> ${CH_KEY_FINGERPRINT}<br>
         <strong>${window.t("verify.pgpKey.labels.algorithm") || "算法:"}</strong> ECDSA (NIST P-256)<br>
         <strong>${window.t("verify.pgpKey.labels.keyLength") || "密钥长度:"}</strong> 256 bits<br>
         <strong>${window.t("verify.pgpKey.labels.fileName") || "文件:"}</strong> ch-public-key.asc<br>
         <br>
         <details>
           <summary style="cursor:pointer;color:var(--primary-color);">${window.t("verify.pgpKey.showFullKey") || "点击查看完整公钥内容"}</summary>
           <pre style="font-size:12px;margin-top:8px;white-space:pre-wrap;word-break:break-all;">${keyContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
         </details>`,
  );
}

/**
 * Initialize page — fetch PGP public key from server
 */
async function initializePage() {
  const keyBlock = document.getElementById("pgp-key-block");
  if (keyBlock) {
    try {
      const resp = await fetch(CH_PUBLIC_KEY_PATH);
      keyBlock.textContent = await resp.text();
    } catch {
      keyBlock.textContent = "（无法加载公钥）";
    }
  }
  console.log(
    `✓ CH PGP public key loaded - User: ${CH_KEY_USER}, Fingerprint: ${CH_KEY_FINGERPRINT}`,
  );
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePage);

// Expose functions to global scope for HTML onclick handlers
window.downloadPublicKey = downloadPublicKey;
window.showPublicKeyInfo = showPublicKeyInfo;
