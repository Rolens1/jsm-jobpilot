import { NextRequest, NextResponse } from "next/server";
import { updateSession, getAccessTokenCookieName } from "@insforge/sdk/ssr/middleware";

const protectedPrefixes = ["/dashboard", "/profile", "/find-jobs"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const response = NextResponse.next();

  // Automatic language detection on initial visit
  if (!request.cookies.has("NEXT_LOCALE")) {
    const acceptLanguage = request.headers.get("accept-language")?.toLowerCase() || "";
    const detected = acceptLanguage.startsWith("fr") || acceptLanguage.includes(",fr") ? "fr" : "en";
    response.cookies.set("NEXT_LOCALE", detected, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  let accessToken: string | null = null;

  try {
    const sessionResult = await updateSession({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
      requestCookies: request.cookies,
      responseCookies: response.cookies,
    });
    accessToken = sessionResult.accessToken;
  } catch (err) {
    // If updateSession encounters an error, fallback to checking cookie directly
    console.debug("[middleware] updateSession fallback:", err);
  }

  if (!accessToken) {
    const cookieName = getAccessTokenCookieName();
    accessToken = request.cookies.get(cookieName)?.value || null;
  }

  // Redirect unauthenticated requests away from protected routes
  if (isProtected && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated requests away from /login
  if (pathname === "/login" && accessToken) {
    const nextParam = request.nextUrl.searchParams.get("next") || "/dashboard";
    return NextResponse.redirect(new URL(nextParam, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
