/**
 * vite.config.js
 * Vite build configuration.
 */
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression2";
import removeConsole from "vite-plugin-remove-console";
import htmlMinifier from "vite-plugin-html-minifier";
import path from "path";

/**
 * Injects a <link rel="preload" as="image"> for the hero <picture>.
 * Runs after Vite rewrites srcset URLs to hashed paths so the preload
 * imagesrcset exactly matches the first (avif) source of the picture.
 */
function heroPreload() {
  return {
    name: "hero-preload",
    enforce: "post",
    transformIndexHtml(html) {
      // Attribute quotes may already be stripped by html-minifier, so the
      // quote characters in this pattern are optional.
      const match = html.match(
        /<source[^>]*type=["']?image\/avif["']?[^>]*srcset=["']([^"']*)["']/,
      );
      if (!match) return html;
      const srcset = match[1].replace(/\s+/g, " ").trim();
      const preload = `<link rel="preload" as="image" imagesrcset="${srcset}" imagesizes="100vw" fetchpriority="high" />`;
      return html.replace(/<\/title>/, `</title>${preload}`);
    },
  };
}

export default defineConfig(() => {
  const ASSET_PREFIX = `VampireC`;

  return {
    root: "src",
    publicDir: "../public",
    plugins: [
      htmlMinifier({
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeEmptyAttributes: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true,
          decodeEntities: true,
        },
        filter: /\.html$/,
      }),
      viteCompression({
        threshold: 1024,
        deleteOriginalAssets: false,
        algorithms: ["gzip", "brotliCompress", "zstd"],
      }),
      removeConsole({
        external: ["src/js/utils.js"],
      }),
      heroPreload(),
    ],

    server: {
      host: true,
      port: 0,
      open: true,
    },

    preview: {
      port: 0,
      open: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      target: "esnext",
      sourcemap: false,
      cssMinify: "lightningcss",
      emptyOutDir: true,
      // Keep hero/avatar images as hashed files: inlining them as data URIs
      // would bloat the HTML and break the preload imagesrcset matching.
      assetsInlineLimit: (filePath) =>
        /assets\/img\/(hero|Avatar|BG)/.test(filePath.replace(/\\/g, "/"))
          ? false
          : undefined,
      rolldownOptions: {
        input: {
          main: path.resolve(import.meta.dirname, "src/index.html"),
          sponsor: path.resolve(import.meta.dirname, "src/sponsor.html"),
          verify: path.resolve(import.meta.dirname, "src/verify.html"),
        },
        output: {
          entryFileNames: `assets/${ASSET_PREFIX}-[name]-[hash].js`,
          chunkFileNames: `assets/${ASSET_PREFIX}-[name]-[hash].js`,
          assetFileNames: `assets/${ASSET_PREFIX}-[name]-[hash].[ext]`,
          codeSplitting: {
            groups: [
              {
                name: "swal",
                test: /node_modules[\\/]sweetalert2/,
                priority: 20,
              },
              {
                name: "typed",
                test: /node_modules[\\/]typed\.js/,
                priority: 20,
              },
              {
                name: "fa",
                test: /node_modules[\\/]fortawesome/,
                priority: 20,
              },
              {
                name: "instant",
                test: /node_modules[\\/]instant\.page/,
                priority: 20,
              },
              {
                name: "other",
                test: /node_modules/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
  };
});
