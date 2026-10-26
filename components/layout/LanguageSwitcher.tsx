"use client";

import { useLocale } from "@/components/providers/LanguageProvider";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, isPending } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center p-0.5 rounded-lg bg-surface-secondary border border-border ${className}`}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        disabled={isPending}
        aria-label="Switch to English"
        aria-pressed={locale === "en"}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
          locale === "en"
            ? "bg-accent text-accent-foreground shadow-2xs"
            : "text-text-secondary hover:text-text-primary hover:bg-surface"
        } ${isPending ? "opacity-70 cursor-wait" : ""}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("fr")}
        disabled={isPending}
        aria-label="Passer en Français"
        aria-pressed={locale === "fr"}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
          locale === "fr"
            ? "bg-accent text-accent-foreground shadow-2xs"
            : "text-text-secondary hover:text-text-primary hover:bg-surface"
        } ${isPending ? "opacity-70 cursor-wait" : ""}`}
      >
        FR
      </button>
    </div>
  );
}
