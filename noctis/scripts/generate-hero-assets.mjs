/**
 * gen-hero-assets.mjs
 * Regenerates hero/avatar AVIF + WebP srcset variants from source images (requires ffmpeg with libaom-av1).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "src/assets/img");
const out = path.join(src, "hero");
mkdirSync(out, { recursive: true });

const AVIF_CRF = "34";

/**
 * Run one ffmpeg encode.
 * @param {string[]} args - ffmpeg arguments
 */
function ffmpeg(args) {
  execFileSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", ...args], {
    stdio: "inherit",
  });
}

/**
 * Encode AVIF + WebP variants for one width tier.
 * @param {string} input - source image path
 * @param {string} name - output base name (BG-<w>)
 * @param {number|null} width - target width, null keeps source width
 * @param {number} webpQuality - WebP quality for the fallback tier
 */
function encodeTier(input, name, width, webpQuality) {
  const scaleArgs = width ? ["-vf", `scale=${width}:-2`] : [];
  const avif = path.join(out, `${name}.avif`);
  const webp = path.join(out, `${name}.webp`);
  ffmpeg([
    "-i",
    input,
    ...scaleArgs,
    "-c:v",
    "libaom-av1",
    "-crf",
    AVIF_CRF,
    "-b:v",
    "0",
    "-strict",
    "experimental",
    "-pix_fmt",
    "yuv420p",
    "-y",
    avif,
  ]);
  ffmpeg([
    "-i",
    input,
    ...scaleArgs,
    "-c:v",
    "libwebp",
    "-quality",
    String(webpQuality),
    "-y",
    webp,
  ]);
  console.log(`✓ ${name}.avif / ${name}.webp`);
}

const bg = path.join(src, "BG.webp");
encodeTier(bg, "BG-2000", null, 60);
encodeTier(bg, "BG-1280", 1280, 72);
encodeTier(bg, "BG-988", 988, 72);

const avatar = path.join(src, "V4-Lite.png");
encodeTier(avatar, "Avatar-512", 512, 82);
encodeTier(avatar, "Avatar-256", 256, 82);
encodeTier(avatar, "Avatar-128", 128, 82);
