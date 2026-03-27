import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { localeMessages } from "@/locales";

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
export const I18NEXT_LANGUAGE_STORAGE_KEY = "i18nextLng";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { common: localeMessages.ar },
      de: { common: localeMessages.de },
      en: { common: localeMessages.en },
      es: { common: localeMessages.es },
      fr: { common: localeMessages.fr },
      hi: { common: localeMessages.hi },
      ja: { common: localeMessages.ja },
      ko: { common: localeMessages.ko },
      pt: { common: localeMessages.pt },
      ru: { common: localeMessages.ru },
      zh: { common: localeMessages.zh },
    },
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: I18NEXT_LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

export async function resetLanguageToSystemDefault(): Promise<void> {
  try {
    globalThis.localStorage?.removeItem(I18NEXT_LANGUAGE_STORAGE_KEY);
  } catch {
    // Ignore storage access failures and still fall back to detector logic.
  }

  await i18n.changeLanguage();
}

/**
 * Apply a persisted language override from AppSettings.
 * Called once after settings are loaded; if the user has never picked a
 * language the detector's result (system locale) stays in effect.
 */
export function applyLanguageFromSettings(lang: string | null): void {
  if (!lang) {
    void resetLanguageToSystemDefault();
    return;
  }
  const supported = SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
  if (supported && i18n.language !== lang) {
    void i18n.changeLanguage(lang);
  }
}

export default i18n;
