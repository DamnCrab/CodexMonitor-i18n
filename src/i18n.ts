import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/locales/en/common.json";
import zh from "@/locales/zh/common.json";

export const SUPPORTED_LANGUAGES = [
  "ar",
  "de",
  "en",
  "es",
  "fr",
  "hi",
  "ja",
  "ko",
  "pt",
  "ru",
  "zh",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { common: en },
      de: { common: en },
      en: { common: en },
      es: { common: en },
      fr: { common: en },
      hi: { common: en },
      ja: { common: en },
      ko: { common: en },
      pt: { common: en },
      ru: { common: en },
      zh: { common: zh },
    },
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

/**
 * Apply a persisted language override from AppSettings.
 * Called once after settings are loaded; if the user has never picked a
 * language the detector's result (system locale) stays in effect.
 */
export function applyLanguageFromSettings(lang: string | null): void {
  if (!lang) {
    return;
  }
  const supported = SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
  if (supported && i18n.language !== lang) {
    void i18n.changeLanguage(lang);
  }
}

export default i18n;
