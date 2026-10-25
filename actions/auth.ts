"use server";

import { cookies, headers } from "next/headers";
import { createAuthActions } from "@insforge/sdk/ssr";
import { setAuthCookies, clearAuthCookies } from "@insforge/sdk/ssr/middleware";

export async function initiateOAuth(
  provider: "google" | "github",
  nextDestination = "/dashboard"
) {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();

    const host =
      headerStore.get("x-forwarded-host") ||
      headerStore.get("host") ||
      "localhost:3000";
    const protocol =
      headerStore.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");
    const origin = `${protocol}://${host}`;

    const callbackUrl = new URL("/callback", origin);
    callbackUrl.searchParams.set("next", nextDestination);

    const auth = createAuthActions({ cookies: cookieStore });
    const { data, error } = await auth.signInWithOAuth(provider, {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true,
      additionalParams: provider === "google" ? { prompt: "select_account" } : undefined,
    });

    if (error || !data?.url || !data?.codeVerifier) {
      console.error("[actions/auth] initiateOAuth failed:", error);
      return {
        success: false,
        error: error?.message || "Failed to initialize OAuth authentication",
      };
    }

    // Store PKCE code verifier in an httpOnly cookie
    cookieStore.set("insforge_code_verifier", data.codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    return {
      success: true,
      url: data.url,
    };
  } catch (err) {
    console.error("[actions/auth] initiateOAuth exception:", err);
    return {
      success: false,
      error: "An unexpected error occurred starting authentication.",
    };
  }
}

export async function setSessionCookies(tokens: {
  accessToken: string;
  refreshToken?: string | null;
}) {
  try {
    const cookieStore = await cookies();
    setAuthCookies(cookieStore, tokens);
    return { success: true };
  } catch (error) {
    console.error("[actions/auth] setSessionCookies error:", error);
    return { success: false, error: "Failed to persist session cookies" };
  }
}

export async function clearSessionCookies() {
  try {
    const cookieStore = await cookies();
    clearAuthCookies(cookieStore);
    cookieStore.delete("insforge_code_verifier");
    return { success: true };
  } catch (error) {
    console.error("[actions/auth] clearSessionCookies error:", error);
    return { success: false, error: "Failed to clear session cookies" };
  }
}
