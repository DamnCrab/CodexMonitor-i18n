import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ar from "@/locales/ar/common.json";
import de from "@/locales/de/common.json";
import en from "@/locales/en/common.json";
import es from "@/locales/es/common.json";
import fr from "@/locales/fr/common.json";
import hi from "@/locales/hi/common.json";
import ja from "@/locales/ja/common.json";
import ko from "@/locales/ko/common.json";
import pt from "@/locales/pt/common.json";
import ru from "@/locales/ru/common.json";
import zh from "@/locales/zh/common.json";

export const SUPPORTED_LANGUAGES = [
  { code: "ar", label: "العربية" },
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "hi", label: "हिन्दी" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { common: ar },
      de: { common: de },
      en: { common: en },
      es: { common: es },
      fr: { common: fr },
      hi: { common: hi },
      ja: { common: ja },
      ko: { common: ko },
      pt: { common: pt },
      ru: { common: ru },
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
  const supported = SUPPORTED_LANGUAGES.some((l) => l.code === lang);
  if (supported && i18n.language !== lang) {
    void i18n.changeLanguage(lang);
  }
}

export default i18n;
