/**
 * i18n/index.js
 * Translation data registry, keyed by language code.
 */
import { zhTranslations } from "./zh.js";
import { enTranslations } from "./en.js";
import { vampireTranslations } from "./vampire.js";

export default {
  zh: zhTranslations,
  en: enTranslations,
  vampire: vampireTranslations,
};
