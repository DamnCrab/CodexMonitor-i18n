import { describe, expect, it } from "vitest";
import i18n, { SUPPORTED_LANGUAGES } from "@/i18n";
import en from "@/locales/en/common.json";
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
  const enKeys = collectKeys(en).sort();

  it("English and Chinese have the same keys", () => {
    expect(collectKeys(zh).sort()).toEqual(enKeys);
  });

  it.each([
    ["en", en],
    ["zh", zh],
  ] as const)("no empty translation values in %s", (code, locale) => {
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

  it.each([
    ["en", en],
    ["zh", zh],
  ] as const)("defines a label for every supported language in %s", (code, locale) => {
    const languageSection = locale.language as Record<string, string>;
    for (const languageCode of SUPPORTED_LANGUAGES) {
      expect(
        languageSection[languageCode],
        `${code} should define language.${languageCode}`,
      ).toBeTruthy();
    }
  });

  it.each(SUPPORTED_LANGUAGES)('registers a "common" bundle for %s', (code) => {
    expect(i18n.hasResourceBundle(code, "common")).toBe(true);
    expect(i18n.getResource(code, "common", "language.label")).toBeTruthy();
  });

  it.each(["ar", "de", "es", "fr", "hi", "ja", "ko", "pt", "ru"] as const)(
    "reuses the English bundle for %s",
    (code) => {
      expect(i18n.getResource(code, "common", "language.en")).toBe("English");
      expect(i18n.getResource(code, "common", "language.systemDefault")).toBe("Follow system");
    },
  );
});
