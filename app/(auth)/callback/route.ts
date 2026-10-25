import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("insforge_code");
  const nextParam = searchParams.get("next") || "/dashboard";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    console.error("[callback route] OAuth error:", errorParam, errorDescription);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorParam);
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get("insforge_code_verifier")?.value;

  if (!code || !verifier) {
    console.warn("[callback route] Missing code or code_verifier:", {
      hasCode: !!code,
      hasVerifier: !!verifier,
    });
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }

  const destinationUrl = new URL(nextParam, request.url);
  const response = NextResponse.redirect(destinationUrl);

  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { error } = await auth.exchangeOAuthCode(code, verifier);

  if (error) {
    console.error("[callback route] exchangeOAuthCode failed:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }

  // Clean up temporary code verifier cookie
  response.cookies.delete("insforge_code_verifier");
  return response;
}
