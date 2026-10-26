"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";

export function LoginReturnLink() {
  const { dict } = useTranslation();

  return (
    <div className="mt-6 text-center">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{dict.auth.backToHome}</span>
      </Link>
    </div>
  );
}
