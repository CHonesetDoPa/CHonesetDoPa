/**
 * Runs the complete production build pipeline.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const skipAssets = process.argv.includes("--skip-assets");

function run(command, args) {
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
  });
}

if (skipAssets) {
  console.log("Skipping hero/avatar asset generation.");
} else {
  run(process.execPath, ["scripts/generate-hero-assets.mjs"]);
}
run(process.execPath, ["scripts/check-i18n-parity.mjs"]);
run("pnpm", ["exec", "vite", "build"]);
