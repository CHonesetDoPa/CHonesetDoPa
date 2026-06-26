// vite.config.js
import { defineConfig, loadEnv } from "vite";
import viteCompression from "vite-plugin-compression2";
import htmlMinifier from "vite-plugin-html-minifier";
import path from "path";

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
        threshold: 1024,
        deleteOriginalAssets: false,
        algorithms: ["gzip", "brotliCompress", "zstd"],
      }),
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

    oxc: {
      drop: ["console", "debugger"],
    },

    build: {
      outDir: path.resolve(__dirname, "dist"),
      target: "esnext",
      sourcemap: false,
      cssMinify: "lightningcss",
      emptyOutDir: true,
      rolldownOptions: {
        input: {
          main: path.resolve(__dirname, "src/index.html"),
          sponsor: path.resolve(__dirname, "src/sponsor.html"),
          verify: path.resolve(__dirname, "src/verify.html"),
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

    define: {
      __APP_MODE__: JSON.stringify(env.MODE),
      __API_BASE__: JSON.stringify(env.VITE_API_BASE || ""),
    },
  };
});
