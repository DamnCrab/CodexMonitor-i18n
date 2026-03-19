import { vi } from "vitest";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
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

void i18n.use(initReactI18next).init({
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
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common"],
  interpolation: { escapeValue: false },
});

if (!("IS_REACT_ACT_ENVIRONMENT" in globalThis)) {
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    value: true,
    writable: true,
  });
} else {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
    true;
}

if (!("matchMedia" in globalThis)) {
  Object.defineProperty(globalThis, "matchMedia", {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }),
  });
}

if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "ResizeObserver", { value: ResizeObserverMock });
}

if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    value: IntersectionObserverMock,
  });
}

if (!("requestAnimationFrame" in globalThis)) {
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    value: (callback: FrameRequestCallback) =>
      setTimeout(() => callback(Date.now()), 0),
  });
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    value: (id: number) => clearTimeout(id),
  });
}

const hasLocalStorage = "localStorage" in globalThis;
const existingLocalStorage = hasLocalStorage
  ? (globalThis as { localStorage?: Storage }).localStorage
  : null;

if (!existingLocalStorage || typeof existingLocalStorage.clear !== "function") {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key) ?? null : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorage,
    writable: true,
    configurable: true,
  });
}
