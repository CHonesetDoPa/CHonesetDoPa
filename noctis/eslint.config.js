/**
 * eslint.config.js
 * ESLint flat config with Prettier integration.
 */
import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  // Ignore build output and dependencies
  {
    ignores: ["dist/**", "node_modules/**", "public/**"],
  },

  // Base recommended rules
  js.configs.recommended,

  // Project source files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Run Prettier as an ESLint rule
      "prettier/prettier": "warn",

      // General best practices
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-console": "off",
      "prefer-const": "warn",
      "no-var": "warn",
      eqeqeq: ["warn", "smart"],
    },
  },

  // Vite config runs in Node
  {
    files: ["vite.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Build/utility scripts run in Node
  {
    files: ["scripts/**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },

  // Disable ESLint rules that conflict with Prettier (must be last)
  prettier,
];
