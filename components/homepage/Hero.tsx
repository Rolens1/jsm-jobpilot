"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Props = Record<string, never>;

export function Hero({}: Props = {}) {
  const { dict } = useTranslation();

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 pt-6">
      <div className="w-full bg-hero-gradient rounded-3xl border border-border pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-8 text-center overflow-hidden">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary max-w-4xl mx-auto leading-[1.15]">
          {dict.homepage.heroTitleLine1}
          <br />
          {dict.homepage.heroTitleLine2}
        </h1>

        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mt-5 leading-relaxed">
          {dict.homepage.heroSubtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
          <Link
            href="/login"
            className="bg-text-darkest text-surface rounded-lg px-6 py-3 text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
          >
            <span>{dict.homepage.heroGetStarted}</span>
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
            {dict.homepage.heroFindMatch}
          </Link>
        </div>

        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto w-full">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/80 bg-surface">
            <Image
              src="/images/dashboard-demo.png"
              alt="JobPilot Dashboard Preview"
              width={1920}
              height={1080}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
