"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en, type Dictionary } from "./en";
import { el } from "./el";

export type Locale = "en" | "el";
const dictionaries: Record<Locale, Dictionary> = { en, el };
const STORAGE_KEY = "chloris.locale";

interface I18nValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nValue>({ locale: "en", t: en, setLocale: () => {} });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Start with "en" on server and first client render to avoid hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let next: Locale = typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("el") ? "el" : "en";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "el" || saved === "en") next = saved;
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo(() => ({ locale, t: dictionaries[locale], setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
