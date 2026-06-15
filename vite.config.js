// vite.config.js
import { defineConfig, loadEnv } from "vite";
import viteCompression from "vite-plugin-compression";
import htmlMinifier from "vite-plugin-html-minifier";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

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
        algorithm: "gzip",
        ext: ".gz",
        threshold: 1024,
        deleteOriginFile: false,
      }),
      viteCompression({
        algorithm: "brotliCompress",
        ext: ".br",
        threshold: 1024,
        deleteOriginFile: false,
      }),
      {
        name: "vite-404-middleware",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // 放行 Vite 内部资源
            if (
              req.url.startsWith("/@") ||
              req.url.startsWith("/src") ||
              req.url.startsWith("/node_modules") ||
              req.url.includes(".js") ||
              req.url.includes(".css")
            ) {
              return next();
            }

            next();
          });
        },
      },
      {
        name: "inject-font-display-swap",
        enforce: "post",
        transform(code, id) {
          if (
            id.includes("fortawesome") &&
            (id.endsWith(".css") || id.endsWith(".scss"))
          ) {
            return {
              code: code.replace(
                /(@font-face\s*\{)([\s\S]*?)(\})/g,
                (match, open, body, close) => {
                  if (body.includes("font-display")) return match;
                  return `${open}\n  font-display: swap;${body}${close}`;
                }
              ),
              map: null,
            };
          }
        },
      },
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
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      outDir: path.resolve(__dirname, "dist"),
      target: "esnext",
      sourcemap: false,
      cssMinify: "lightningcss",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "src/index.html"),
          sponsor: path.resolve(__dirname, "src/sponsor.html"),
          verify: path.resolve(__dirname, "src/verify.html"),
        },
        output: {
          entryFileNames: `assets/${ASSET_PREFIX}-[name]-[hash].js`,
          chunkFileNames: `assets/${ASSET_PREFIX}-[name]-[hash].js`,
          assetFileNames: `assets/${ASSET_PREFIX}-[name]-[hash].[ext]`,
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("openpgp")) return "vendor-openpgp";
              if (id.includes("sweetalert2")) return "vendor-swal";
              if (id.includes("typed.js")) return "vendor-typed";
              if (id.includes("fortawesome")) return "vendor-fa";
              if (id.includes("instant.page")) return "vendor-instant";
              return "vendor-other";
            }
          },
        },
      },
    },

    esbuild:
      mode === "production"
        ? {
            drop: ["console", "debugger"],
            legalComments: "none",
          }
        : {},

    define: {
      __APP_MODE__: JSON.stringify(env.MODE),
      __API_BASE__: JSON.stringify(env.VITE_API_BASE || ""),
    },
  };
});
