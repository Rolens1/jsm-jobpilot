"use client";

import Link from "next/link";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Props = Record<string, never>;

export function BottomCta({}: Props = {}) {
  const { dict } = useTranslation();

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-12">
      <div className="w-full bg-hero-gradient rounded-3xl border border-border py-16 sm:py-24 px-6 sm:px-12 text-center overflow-hidden">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary max-w-2xl mx-auto leading-tight">
          {dict.homepage.bottomCtaTitleLine1}
          <br className="hidden sm:inline" />
          {dict.homepage.bottomCtaTitleLine2}
        </h2>

        <p className="text-base text-text-secondary max-w-xl mx-auto mt-4 mb-8 leading-relaxed">
          {dict.homepage.bottomCtaSubtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="bg-text-darkest text-surface rounded-lg px-6 py-3 text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
          >
            <span>{dict.homepage.bottomCtaGetStarted}</span>
            <svg
              className="w-3 h-3 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6 4l14 8-14 8V4z" />
            </svg>
          </Link>

          <Link
            href="/find-jobs"
            className="bg-surface text-text-primary border border-border rounded-lg px-6 py-3 text-sm font-medium shadow-sm hover:bg-surface-secondary transition-colors"
          >
            {dict.homepage.bottomCtaFindMatch}
          </Link>
        </div>
      </div>
    </section>
  );
}
