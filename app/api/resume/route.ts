import { NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function GET() {
  const insforge = await createInsforgeServer();

  try {
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = authData.user.id;

    // Fetch user profile to get resume URL
    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("resume_pdf_url")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile?.resume_pdf_url) {
      return new NextResponse("No resume found for this profile", { status: 404 });
    }

    let fetchUrl = profile.resume_pdf_url;
    if (!fetchUrl.startsWith("http")) {
      const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || "";
      fetchUrl = `${baseUrl.replace(/\/$/, "")}/${fetchUrl.replace(/^\//, "")}`;
    }

    const apiKey = process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || "";
    const storageRes = await fetch(fetchUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!storageRes.ok) {
      console.error("[api/resume] Storage response error:", storageRes.status, await storageRes.text());
      return new NextResponse("Failed to fetch resume file from storage", { status: storageRes.status });
    }

    const pdfBuffer = await storageRes.arrayBuffer();

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("[api/resume] Error serving resume PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
