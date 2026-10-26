import { cookies, headers } from "next/headers";
import {
  Locale,
  Dictionary,
  LOCALE_COOKIE,
  PROMPTED_COOKIE,
  DEFAULT_LOCALE,
  isValidLocale,
} from "@/types/i18n";
import { en } from "@/dictionaries/en";
import { fr } from "@/dictionaries/fr";

export { LOCALE_COOKIE, PROMPTED_COOKIE, DEFAULT_LOCALE, isValidLocale };

export function getDictionary(locale: Locale): Dictionary {
  return locale === "fr" ? fr : en;
}

export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    if (isValidLocale(cookieLocale)) {
      return cookieLocale;
    }

    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language")?.toLowerCase() || "";
    if (acceptLanguage.startsWith("fr") || acceptLanguage.includes(",fr")) {
      return "fr";
    }
  } catch (error) {
    console.debug("[i18n] Fallback to default locale:", error);
  }

  return DEFAULT_LOCALE;
}

export async function hasLanguagePrompted(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(PROMPTED_COOKIE)?.value === "1";
  } catch {
    return false;
  }
}
