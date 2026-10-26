"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Locale } from "@/types/i18n";
import { LOCALE_COOKIE, PROMPTED_COOKIE, isValidLocale } from "@/lib/i18n";

export async function setLocaleAction(locale: Locale) {
  try {
    if (!isValidLocale(locale)) {
      return { success: false, error: "Invalid locale provided" };
    }

    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
    });

    revalidatePath("/", "layout");
    return { success: true, locale };
  } catch (error) {
    console.error("[actions/locale] setLocaleAction error:", error);
    return { success: false, error: "Failed to update language preference" };
  }
}

export async function dismissLanguagePromptAction(chosenLocale?: Locale) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(PROMPTED_COOKIE, "1", {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });

    if (chosenLocale && isValidLocale(chosenLocale)) {
      cookieStore.set(LOCALE_COOKIE, chosenLocale, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
      revalidatePath("/", "layout");
    }

    return { success: true };
  } catch (error) {
    console.error("[actions/locale] dismissLanguagePromptAction error:", error);
    return { success: false, error: "Failed to dismiss language prompt" };
  }
}
