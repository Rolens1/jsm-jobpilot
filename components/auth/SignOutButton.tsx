"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { identifyUser, resetUser } from "@/lib/posthog-client";
import { insforge } from "@/lib/insforge-client";
import { clearSessionCookies } from "@/actions/auth";
import { LogOut, Loader2 } from "lucide-react";

type SignOutButtonProps = {
  className?: string;
};

type PostHogUserIdentityProps = {
  userId: string;
  email?: string;
};

export function PostHogUserIdentity({ userId, email }: PostHogUserIdentityProps) {
  useEffect(() => {
    if (!userId) return;
    identifyUser(userId, email ? { email } : undefined);
  }, [email, userId]);

  return null;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await insforge.auth.signOut();
      resetUser();
      await clearSessionCookies();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("[SignOutButton] failed to sign out:", err);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={
        className ||
        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-text-secondary hover:text-text-primary border border-border bg-surface hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-50"
      }
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span>Sign out</span>
    </button>
  );
}
