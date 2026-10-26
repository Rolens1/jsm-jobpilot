"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Props = Record<string, never>;

export function Footer({}: Props = {}) {
  const { dict } = useTranslation();

  return (
    <footer className="w-full bg-surface border-t border-border mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt={dict.nav.appName}
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
            style={{ width: "auto" }}
          />
        </Link>

        <div className="flex items-center gap-8 text-sm text-text-secondary">
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">
            {dict.footer.dashboard}
          </Link>
          <Link href="#" className="hover:text-text-primary transition-colors">
            {dict.footer.privacyPolicy}
          </Link>
          <Link href="#" className="hover:text-text-primary transition-colors">
            {dict.footer.termsCondition}
          </Link>
        </div>
      </div>
    </footer>
  );
}
