import { describe, expect, it } from "vitest";
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
  it("English and Chinese have the same keys", () => {
    const enKeys = collectKeys(en).sort();
    const zhKeys = collectKeys(zh).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  it("no empty translation values in English", () => {
    const enKeys = collectKeys(en);
    for (const key of enKeys) {
      const parts = key.split(".");
      let value: unknown = en;
      for (const part of parts) {
        value = (value as Record<string, unknown>)[part];
      }
      expect(value, `en key "${key}" should not be empty`).toBeTruthy();
    }
  });

  it("no empty translation values in Chinese", () => {
    const zhKeys = collectKeys(zh);
    for (const key of zhKeys) {
      const parts = key.split(".");
      let value: unknown = zh;
      for (const part of parts) {
        value = (value as Record<string, unknown>)[part];
      }
      expect(value, `zh key "${key}" should not be empty`).toBeTruthy();
    }
  });
});
