/**
 * check-i18n-parity.mjs - Verify all language files have identical i18n key sets
 *
 * Usage: node scripts/check-i18n-parity.mjs
 */
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_DIR = join(__dirname, "..", "src", "config", "i18n");

function collectKeys(obj, prefix = "") {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const sub of collectKeys(v, path)) keys.add(sub);
    } else {
      keys.add(path);
    }
  }
  return keys;
}

async function main() {
  const files = readdirSync(I18N_DIR).filter(
    (f) => f.endsWith(".js") && f !== "index.js",
  );
  const keySets = {};

  for (const file of files) {
    const url = pathToFileURL(join(I18N_DIR, file)).href;
    const mod = await import(url);
    const lang = file.replace(/\.js$/, "");
    const exportName = `${lang}Translations`;
    const data = mod[exportName];
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      console.error(`✗ ${file}: expected named export "${exportName}" not found`);
      process.exitCode = 1;
      return;
    }
    keySets[file] = collectKeys(data);
  }

  const baseFile = "zh.js";
  if (!keySets[baseFile]) {
    console.error(`✗ Base language file ${baseFile} not found`);
    process.exitCode = 1;
    return;
  }
  const baseKeys = keySets[baseFile];

  let hasError = false;
  for (const [file, keys] of Object.entries(keySets)) {
    if (file === baseFile) continue;

    const missing = [...baseKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !baseKeys.has(k));
    if (missing.length || extra.length) {
      hasError = true;
      console.error(`\n✗ ${file} (base: ${baseFile}):`);
      if (missing.length)
        console.error(`  missing (${missing.length}): ${missing.join(", ")}`);
      if (extra.length)
        console.error(`  extra   (${extra.length}): ${extra.join(", ")}`);
    } else {
      console.log(`✓ ${file}: ${keys.size} keys, matches ${baseFile}`);
    }
  }

  if (hasError) {
    console.error("\n✗ i18n parity FAILED");
    process.exitCode = 1;
    return;
  }

  console.log(`\n✓ i18n parity OK (${baseKeys.size} keys each)`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`✗ Unable to check i18n parity: ${message}`);
  process.exitCode = 1;
});
