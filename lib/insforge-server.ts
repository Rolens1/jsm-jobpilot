import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

export const createInsforgeServer = async () => {
  await connection();
  const cookieStore = await cookies();
  return createServerClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    cookies: cookieStore,
  });
};
