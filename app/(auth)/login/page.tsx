import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getLocale, getDictionary } from "@/lib/i18n";
import { LoginCard } from "@/components/auth/LoginCard";
import { LoginReturnLink } from "@/components/auth/LoginReturnLink";
import { Loader2 } from "lucide-react";

type Props = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

async function LoginContent({ searchParams }: Props) {
  const params = await searchParams;

  // If already logged in, redirect straight to dashboard (or requested next page)
  try {
    const insforge = await createInsforgeServer();
    const { data } = await insforge.auth.getCurrentUser();
    if (data?.user) {
      redirect(params.next || "/dashboard");
    }
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
  }

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const errorMessage =
    params.error === "auth_failed"
      ? dict.auth.errorAuthFailed
      : params.error === "cancelled"
      ? dict.auth.errorCancelled
      : params.error
      ? dict.auth.errorGeneric
      : undefined;

  return (
    <LoginCard
      defaultRedirect={params.next || "/dashboard"}
      initialError={errorMessage}
    />
  );
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background radial gradient mesh for premium subtle depth */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none opacity-60" />


      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Logo link */}
        <Link href="/" className="mb-8 flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image
            src="/logo.png"
            alt="JobPilot"
            width={140}
            height={36}
            className="h-9 w-auto object-contain"
            style={{ width: "auto" }}
            priority
          />
        </Link>

        {/* Login Card wrapped in Suspense for Next.js 16 Partial Prerendering */}
        <Suspense
          fallback={
            <div className="w-full max-w-[420px] bg-surface rounded-2xl border border-border p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          }
        >
          <LoginContent searchParams={searchParams} />
        </Suspense>

        {/* Clear bottom return link */}
        <LoginReturnLink />
      </div>
    </div>
  );
}

