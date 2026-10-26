"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, X, Check } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { dismissLanguagePromptAction } from "@/actions/locale";
import { Locale } from "@/types/i18n";

interface Props {
  initialPrompted?: boolean;
}

export function LanguageOnboardingModal({ initialPrompted = false }: Props) {
  const router = useRouter();
  const { locale, syncLocale, dict } = useTranslation();
  const [isOpen, setIsOpen] = useState(!initialPrompted);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      syncLocale(selectedLocale);
      await dismissLanguagePromptAction(selectedLocale);
      router.refresh();
      setIsOpen(false);
    } catch (err) {
      console.error("[LanguageOnboardingModal] Failed to confirm language:", err);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await dismissLanguagePromptAction();
      setIsOpen(false);
    } catch (err) {
      console.error("[LanguageOnboardingModal] Failed to dismiss prompt:", err);
      setIsOpen(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
      onClick={handleDismiss}
    >
      <div
        className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={dict.common.close}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-muted border border-border flex items-center justify-center text-accent shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 id="language-modal-title" className="text-base font-semibold text-text-primary">
              {dict.onboarding.title}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              JobPilot Internationalization
            </p>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed mb-5">
          {dict.onboarding.description}
        </p>

        {/* Language Options */}
        <div className="space-y-3 mb-6">
          {/* English Option */}
          <button
            type="button"
            onClick={() => setSelectedLocale("en")}
            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              selectedLocale === "en"
                ? "bg-accent-muted/40 border-accent shadow-xs"
                : "bg-surface-secondary/70 border-border hover:bg-surface-secondary hover:border-border-hover"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-xs text-text-primary">
                EN
              </span>
              <div>
                <span className="text-sm font-semibold text-text-primary block">
                  {dict.onboarding.selectEnglish}
                </span>
                <span className="text-xs text-text-secondary block">
                  {dict.onboarding.englishSubtitle}
                </span>
              </div>
            </div>
            {selectedLocale === "en" && (
              <div className="w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </button>

          {/* Français Option */}
          <button
            type="button"
            onClick={() => setSelectedLocale("fr")}
            className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              selectedLocale === "fr"
                ? "bg-accent-muted/40 border-accent shadow-xs"
                : "bg-surface-secondary/70 border-border hover:bg-surface-secondary hover:border-border-hover"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-xs text-text-primary">
                FR
              </span>
              <div>
                <span className="text-sm font-semibold text-text-primary block">
                  {dict.onboarding.selectFrench}
                </span>
                <span className="text-xs text-text-secondary block">
                  {dict.onboarding.frenchSubtitle}
                </span>
              </div>
            </div>
            {selectedLocale === "fr" && (
              <div className="w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? dict.common.loading : dict.onboarding.confirm}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isSubmitting}
            className="w-full py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors text-center cursor-pointer"
          >
            {dict.onboarding.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
