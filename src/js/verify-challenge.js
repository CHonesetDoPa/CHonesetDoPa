/**
 * PGP Key Display for CH Security Verification Center
 */

const CH_PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: E802 A6BF 8C2B 8ED7 1B9D  08FF C688 1736 D7BC 83D8
Comment: CHonesetDoPa <ch@nekoc.cc>

xlIEZqocZBMIKoZIzj0DAQcCAwRUyW13TRE5jBnvhkFo3WbS3njbb22juGI9ia5H
90UCHtsEDzTwsvkZnFfsV4IrEEC8azzPmD/ifpio2Dvfn0IYzRpDSG9uZXNldERv
UGEgPGNoQG5la29jLmNjPsKJBBMTCAAaBAsJCAcCFQgCFgECGQEFgmaqHGQCngEC
mwMAIQkQxogXNte8g9gWIQToAqa/jCuO1xudCP/GiBc217yD2Dc0AP9jxYPAMVEg
JBgAlZlfFgWemdJtDJnJUCgROshSC6H1iQEAkpl/Tz5sQvVdu58sN6Z6LdmyDohL
j7gaXepEn3ShR17OUgRmqhxkEwgqhkjOPQMBBwIDBFFPJVstKuaxyIkQcnL3HG6n
9kaXkkdsTyOI9S7Vc6wY8Ch+p7T7Rg2OZgAIv6pB9Jo24nKDUPIhtY21jkJzC8HC
eAQYEwgACQWCZqocZAKbIAAhCRDGiBc217yD2BYhBOgCpr+MK47XG50I/8aIFzbX
vIPYTfwBAOK1cFPGwCHXN/tpydhxm3wQkBCH0iah3EeBo12fLMl1AP4xPBiM/wqv
1oi3YUxBpVIpyTMpG0gaLyK/gGQoZzaiZc5WBGaqHGQSCCqGSM49AwEHAgMEcK2n
u/MGJIYVOBszdhxbQtIRRTvCXdYHc7Gru2NIsvkFpHMNk4LjQG0QFSA9iwziKy8g
lgUzwgLxQA4tyximMwMBCAfCeAQYEwgACQWCZqocZAKbDAAhCRDGiBc217yD2BYh
BOgCpr+MK47XG50I/8aIFzbXvIPYPn4BAIOCXyJ8zZKygwKXrW/2podRMyHUdQj9
rTIhezzgMAozAQCP8sakQCk8vXVKVyFBA1aTIe/Z0IzEACxx2HB3KpeXXA==
=cXbI
-----END PGP PUBLIC KEY BLOCK-----`;

// Known key metadata (extracted from PGP comment headers)
const CH_KEY_FINGERPRINT = "E802A6BF8C2B8ED71B9D08FFC6881736D7BC83D8";
const CH_KEY_USER = "CHonesetDoPa <ch@nekoc.cc>";

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
 * Download public key directly from the embedded CH_PUBLIC_KEY
 */
function downloadPublicKey() {
  try {
    const keyBlob = new Blob([CH_PUBLIC_KEY], { type: "text/plain" });
    const url = URL.createObjectURL(keyBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ch-public-key.asc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showResult(
      "success",
      "下载完成",
      `CH的PGP公钥已下载成功！<br>
             <strong>密钥信息:</strong><br>
             用户ID: ${CH_KEY_USER}<br>
             指纹: ${CH_KEY_FINGERPRINT}<br>
             <strong>使用方法:</strong> 请将下载的密钥文件导入到您的PGP软件中进行验证。`,
    );
  } catch (error) {
    showResult("error", "下载失败", `无法下载公钥: ${error.message}`);
  }
}

/**
 * Show public key information
 */
function showPublicKeyInfo() {
  showResult(
    "success",
    "CH的PGP公钥信息",
    `<strong>用户ID:</strong> ${CH_KEY_USER}<br>
         <strong>指纹:</strong> ${CH_KEY_FINGERPRINT}<br>
         <strong>算法:</strong> ECDSA (NIST P-256)<br>
         <strong>密钥长度:</strong> 256 bits<br>
         <strong>文件:</strong> ch-public-key.asc<br>
         <br>
         <details>
           <summary style="cursor:pointer;color:var(--primary-color);">点击查看完整公钥内容</summary>
           <pre style="font-size:12px;margin-top:8px;white-space:pre-wrap;word-break:break-all;">${CH_PUBLIC_KEY.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
         </details>`,
  );
}

/**
 * Initialize page
 */
function initializePage() {
  // Populate the key block in the HTML
  const keyBlock = document.getElementById("pgp-key-block");
  if (keyBlock) {
    keyBlock.textContent = CH_PUBLIC_KEY;
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
