"use client";

import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Locale, Dictionary, LOCALE_COOKIE, isValidLocale, DEFAULT_LOCALE } from "@/types/i18n";
import { en } from "@/dictionaries/en";
import { fr } from "@/dictionaries/fr";
import { setLocaleAction } from "@/actions/locale";

interface LanguageContextValue {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => Promise<void>;
  syncLocale: (locale: Locale) => void;
  isPending: boolean;
  t: <T extends keyof Dictionary>(section: T, key: keyof Dictionary[T]) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function LanguageProvider({ children, initialLocale = DEFAULT_LOCALE }: LanguageProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
      const cookieVal = match ? decodeURIComponent(match[1]) : null;
      if (isValidLocale(cookieVal) && cookieVal !== locale) {
        setLocaleState(cookieVal);
      }
    }
  }, [locale]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const dict = locale === "fr" ? fr : en;

  const setLocale = async (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocaleState(newLocale);

    startTransition(async () => {
      await setLocaleAction(newLocale);
      router.refresh();
    });
  };

  const syncLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const t = <T extends keyof Dictionary>(section: T, key: keyof Dictionary[T]): string => {
    const sectionObj = dict[section];
    if (sectionObj && key in sectionObj) {
      return String(sectionObj[key]);
    }
    const fallbackSection = en[section];
    if (fallbackSection && key in fallbackSection) {
      return String(fallbackSection[key]);
    }
    return String(key);
  };

  return (
    <LanguageContext.Provider value={{ locale, dict, setLocale, syncLocale, isPending, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

export function useLocale() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLocale must be used within a LanguageProvider");
  }
  return { locale: context.locale, setLocale: context.setLocale, isPending: context.isPending };
}
