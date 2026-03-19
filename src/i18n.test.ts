import { describe, expect, it } from "vitest";
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

function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("i18n translation files", () => {
  const locales = {
    ar,
    de,
    en,
    es,
    fr,
    hi,
    ja,
    ko,
    pt,
    ru,
    zh,
  } as const;

  const enKeys = collectKeys(en).sort();

  it.each(Object.entries(locales).filter(([code]) => code !== "en"))(
    "%s has the same keys as English",
    (code, locale) => {
      expect(collectKeys(locale).sort(), `${code} keys should match en`).toEqual(enKeys);
    },
  );

  it.each(Object.entries(locales))("no empty translation values in %s", (code, locale) => {
    const localeKeys = collectKeys(locale);
    for (const key of localeKeys) {
      const parts = key.split(".");
      let value: unknown = locale;
      for (const part of parts) {
        value = (value as Record<string, unknown>)[part];
      }
      expect(value, `${code} key "${key}" should not be empty`).toBeTruthy();
    }
  });
});
