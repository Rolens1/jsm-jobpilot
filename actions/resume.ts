"use server";

import "pdf-parse/worker";
import { getData } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import React from "react";
import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getAiClient, tailorResumeContent } from "@/lib/ai";
import { getLocale } from "@/lib/i18n";
import type {
  ExperienceLevel,
  RemotePreference,
  WorkAuthorization,
} from "@/types/database";

// Pre-initialize PDFParse worker data to prevent SSR/Turbopack chunk resolution errors
try {
  PDFParse.setWorker(getData());
} catch (workerInitErr) {
  console.warn("[actions/resume] Initial PDFParse worker configuration warning:", workerInitErr);
}

export interface ExtractedWorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string;
}

export interface ExtractedEducation {
  degree: string;
  field: string;
  institution: string;
  graduationYear: string;
}

export interface ExtractedProfileData {
  fullName?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentTitle?: string;
  experienceLevel?: ExperienceLevel;
  yearsExperience?: number;
  skills?: string[];
  industries?: string[];
  workExperience?: ExtractedWorkExperience[];
  education?: ExtractedEducation[];
  jobTitlesSeeking?: string[];
  remotePreference?: RemotePreference;
  salaryExpectation?: string;
  preferredLocations?: string[];
  workAuthorization?: WorkAuthorization;
}

export interface ExtractResumeResult {
  success: boolean;
  data?: ExtractedProfileData;
  error?: string;
  rawTextPreview?: string;
  extractionMethod?: "ai" | "heuristic";
}

/**
 * Server Action: Extract structured candidate profile from an uploaded resume PDF
 * or from an already-saved resume in InsForge Storage.
 * Uses pdf-parse to extract text, attempts AI model extraction via OpenRouter/OpenAI,
 * and seamlessly falls back to a deterministic heuristic engine if no API key is present.
 */
export async function extractResumeProfile(formData?: FormData): Promise<ExtractResumeResult> {
  try {
    // 1. Verify user authentication
    const insforge = await createInsforgeServer();
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return {
        success: false,
        error: "Unauthorized. Please log in to extract your resume details.",
      };
    }

    const userId = authData.user.id;

    // 2. Obtain PDF Buffer (from uploaded file or stored resume in InsForge storage)
    let buffer: Buffer | null = null;
    const file = formData?.get("resume") as File | null;

    if (file && file.size > 0) {
      const isPdfType =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdfType) {
        return {
          success: false,
          error: "Only PDF documents are supported for resume extraction.",
        };
      }

      const maxSizeBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return {
          success: false,
          error: "Resume file size exceeds the 5MB limit.",
        };
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Check if user has an existing saved resume in profiles table
      const { data: profile } = await insforge.database
        .from("profiles")
        .select("resume_pdf_url")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.resume_pdf_url) {
        try {
          const downloadRes = await fetch(profile.resume_pdf_url, {
            headers: {
              Authorization: `Bearer ${process.env.INSFORGE_API_KEY || ""}`,
            },
          });
          if (downloadRes.ok) {
            const arrayBuffer = await downloadRes.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          }
        } catch (fetchErr) {
          console.warn("[actions/resume] Could not download existing resume from storage:", fetchErr);
        }
      }
    }

    if (!buffer || buffer.length === 0) {
      return {
        success: false,
        error: "Please select a valid PDF resume file or upload one to your profile first.",
      };
    }

    // 3. Extract text from PDF buffer
    let rawText = "";
    try {
      try {
        PDFParse.setWorker(getData());
      } catch (workerErr) {
        console.warn("[actions/resume] Could not configure worker:", workerErr);
      }
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      await parser.destroy();
      rawText = textResult?.text?.trim() || "";
    } catch (parseError) {
      console.error("[actions/resume] PDF text extraction error:", parseError);
      return {
        success: false,
        error: "Could not read the PDF document. Please verify the file is not password protected.",
      };
    }

    // 4. Validate extracted text length
    if (rawText.length < 50) {
      return {
        success: false,
        error: "Could not extract text from this PDF. Please try a different file or enter your details manually.",
      };
    }

    // 5. Invoke AI Model if any supported provider API key is present
    const hasApiKey = Boolean(
      process.env.GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.CEREBRAS_API_KEY ||
      process.env.MISTRAL_API_KEY ||
      process.env.OPENAI_API_KEY
    );
    if (hasApiKey) {
      try {
        const { client, model, provider } = getAiClient();
        console.log(`[actions/resume] Calling LLM model ${model} via ${provider}`);
        const systemPrompt = `You are an expert AI resume parser with advanced multilingual intelligence.
Extract structured candidate profile information from the supplied resume text.
The input resume may be in English, French, or bilingual. Seamlessly understand French resume section headings (e.g., 'Expérience professionnelle', 'Expériences', 'Formation', 'Éducation', 'Compétences', 'Langues', 'Coordonnées', 'Profil', 'Projets') and French date formats (e.g., 'Janvier 2021 à Présent', 'En cours', '2020 - Aujourd\\'hui') and map them accurately to the standard English JSON schema fields.
Return ONLY valid JSON matching this exact structure:
{
  "fullName": string,
  "phone": string,
  "location": string,
  "linkedinUrl": string,
  "portfolioUrl": string,
  "currentTitle": string,
  "experienceLevel": "junior" | "mid" | "senior" | "lead",
  "yearsExperience": number,
  "skills": string[],
  "industries": string[],
  "workExperience": [
    {
      "company": string,
      "title": string,
      "startDate": string,
      "endDate": string,
      "isCurrent": boolean,
      "responsibilities": string
    }
  ],
  "education": [
    {
      "degree": string,
      "field": string,
      "institution": string,
      "graduationYear": string
    }
  ],
  "jobTitlesSeeking": string[],
  "remotePreference": "remote" | "hybrid" | "onsite" | "any",
  "workAuthorization": "citizen" | "permanent_resident" | "visa_required"
}

Rules:
- Infer experienceLevel based on years of experience and titles ("junior", "mid", "senior", or "lead").
- If a value is unknown or absent in the resume, omit it or set to null/empty array.
- Return ONLY the JSON object. Do not wrap in markdown or backticks.`;

        const completion = await client.chat.completions.create({
          model,
          temperature: 0.3,
          max_tokens: 1500,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Resume text:\n\n${rawText.slice(0, 10000)}`,
            },
          ],
        });

        const responseContent = completion.choices[0]?.message?.content || "";
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawParsed = JSON.parse(jsonStr) as Record<string, any>;

        // Normalize fields for TypeScript / Database strict types
        let yearsExp: number | undefined = undefined;
        if (typeof rawParsed.yearsExperience === "number") {
          yearsExp = rawParsed.yearsExperience;
        } else if (typeof rawParsed.yearsExperience === "string") {
          const matchNum = rawParsed.yearsExperience.match(/\d+/);
          yearsExp = matchNum ? parseInt(matchNum[0], 10) : undefined;
        }

        let expLevel: ExperienceLevel | undefined = undefined;
        const rawLevel = String(rawParsed.experienceLevel || "").toLowerCase();
        if (rawLevel.includes("lead") || rawLevel.includes("principal")) expLevel = "lead";
        else if (rawLevel.includes("senior")) expLevel = "senior";
        else if (rawLevel.includes("mid")) expLevel = "mid";
        else if (rawLevel.includes("junior") || rawLevel.includes("entry")) expLevel = "junior";

        let remotePref: RemotePreference | undefined = undefined;
        const rawRemote = String(rawParsed.remotePreference || "").toLowerCase();
        if (rawRemote.includes("remote")) remotePref = "remote";
        else if (rawRemote.includes("hybrid")) remotePref = "hybrid";
        else if (rawRemote.includes("onsite")) remotePref = "onsite";
        else if (rawRemote.includes("any")) remotePref = "any";

        let workAuth: WorkAuthorization | undefined = undefined;
        const rawAuth = String(rawParsed.workAuthorization || "").toLowerCase();
        if (rawAuth.includes("citizen")) workAuth = "citizen";
        else if (rawAuth.includes("permanent") || rawAuth.includes("pr") || rawAuth.includes("green")) workAuth = "permanent_resident";
        else if (rawAuth.includes("visa")) workAuth = "visa_required";

        const parsed: ExtractedProfileData = {
          fullName: rawParsed.fullName || undefined,
          phone: rawParsed.phone || undefined,
          location: rawParsed.location || undefined,
          linkedinUrl: rawParsed.linkedinUrl || undefined,
          portfolioUrl: rawParsed.portfolioUrl || undefined,
          currentTitle: rawParsed.currentTitle || undefined,
          experienceLevel: expLevel,
          yearsExperience: yearsExp,
          skills: Array.isArray(rawParsed.skills) ? rawParsed.skills : [],
          industries: Array.isArray(rawParsed.industries) ? rawParsed.industries : [],
          workExperience: Array.isArray(rawParsed.workExperience) ? rawParsed.workExperience : [],
          education: Array.isArray(rawParsed.education) ? rawParsed.education : [],
          jobTitlesSeeking: Array.isArray(rawParsed.jobTitlesSeeking) ? rawParsed.jobTitlesSeeking : [],
          remotePreference: remotePref,
          salaryExpectation: rawParsed.salaryExpectation || undefined,
          preferredLocations: Array.isArray(rawParsed.preferredLocations) ? rawParsed.preferredLocations : undefined,
          workAuthorization: workAuth,
        };

        // Backfill LinkedIn or Portfolio with regex if missing in AI response
        if (!parsed.linkedinUrl) {
          const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i) ||
                                rawText.match(/Linkedin\s*:\s*([^\s|]+(?:\s+[^\s|]+)?)/i);
          if (linkedinMatch) {
            const rawVal = linkedinMatch[1]?.trim() || linkedinMatch[0]?.trim();
            parsed.linkedinUrl = rawVal.startsWith("http") ? rawVal : `https://linkedin.com/in/${rawVal.replace(/\s+/g, "-")}`;
          }
        }

        if (!parsed.portfolioUrl) {
          const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i) ||
                              rawText.match(/Github\s*:\s*([a-zA-Z0-9_-]+)/i);
          if (githubMatch) {
            const rawVal = githubMatch[1]?.trim() || githubMatch[0]?.trim();
            parsed.portfolioUrl = rawVal.startsWith("http") ? rawVal : `https://github.com/${rawVal}`;
          }
        }

        return {
          success: true,
          data: parsed,
          extractionMethod: "ai",
          rawTextPreview: rawText.slice(0, 200),
        };
      } catch (aiError) {
        console.warn("[actions/resume] AI completion failed, activating heuristic fallback:", aiError);
      }
    }

    // 6. Seamless Heuristic Extraction Fallback
    const { extractProfileWithHeuristics } = await import("@/lib/resume-heuristics");
    const heuristicData = extractProfileWithHeuristics(rawText);

    return {
      success: true,
      data: heuristicData,
      extractionMethod: "heuristic",
      rawTextPreview: rawText.slice(0, 200),
    };
  } catch (error) {
    console.error("[actions/resume] Unexpected extraction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during extraction.",
    };
  }
}

/**
 * Generates an executive single-page PDF resume from the candidate's current profile data.
 * Applies AI domain tailoring matching target job titles, compiles vector PDF via @react-pdf/renderer,
 * uploads to private InsForge storage, and updates the profile's resume_pdf_url.
 */
export async function generateResumePdf(): Promise<{
  success: boolean;
  resumeUrl?: string;
  error?: string;
}> {
  try {
    const insforge = await createInsforgeServer();
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return {
        success: false,
        error: "Unauthorized. Please log in to generate your resume.",
      };
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email;

    // 1. Fetch current profile from database
    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Could not retrieve your profile. Please save your profile first.",
      };
    }

    // 2. Validate core profile information (AC-2)
    if (!profile.full_name || !profile.full_name.trim()) {
      return {
        success: false,
        error: "Your Full Name is required before generating a resume. Please enter your name in the Personal Information section.",
      };
    }

    // 3. AI enhancement & tailoring to target job title in candidate's language (with instant fallback)
    const currentLocale = await getLocale();
    const candidateLocale = (profile.preferred_language === "fr" || currentLocale === "fr" ? "fr" : "en") as "en" | "fr";
    const tailoredData = await tailorResumeContent(profile, userEmail, candidateLocale);

    // 4. Render PDF buffer using @react-pdf/renderer (AC-6)
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { ClassicMonochromeTemplate } = await import("@/lib/pdf/ClassicMonochromeTemplate");

    type DocumentElement = Parameters<typeof renderToBuffer>[0];
    const element = React.createElement(ClassicMonochromeTemplate, {
      data: tailoredData,
      locale: candidateLocale,
    }) as unknown as DocumentElement;

    const pdfBuffer = await renderToBuffer(element);

    // 5. Upload PDF to InsForge Storage in private resumes bucket (AC-7)
    const storagePath = `${userId}/resume.pdf`;
    const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
    const { data: uploadData, error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(storagePath, pdfBlob);

    if (uploadError) {
      console.error("[actions/resume] Storage upload error:", uploadError);
      return {
        success: false,
        error: "Failed to upload generated resume to storage.",
      };
    }

    let uploadedResumeUrl = uploadData?.url || null;
    if (!uploadedResumeUrl) {
      const { data: urlData } = insforge.storage
        .from("resumes")
        .getPublicUrl(storagePath);
      uploadedResumeUrl =
        urlData?.publicUrl ||
        `/api/storage/buckets/resumes/objects/${encodeURIComponent(storagePath)}`;
    }

    // 6. Update profiles table with resume_pdf_url (AC-7)
    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({
        resume_pdf_url: uploadedResumeUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[actions/resume] Failed to update profile with resume URL:", updateError);
      return {
        success: false,
        error: "Failed to link generated resume to your profile.",
      };
    }

    revalidatePath("/profile");

    return {
      success: true,
      resumeUrl: `/api/resume?t=${Date.now()}`,
    };
  } catch (error) {
    console.error("[actions/resume] Unexpected PDF generation error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while generating your resume PDF.",
    };
  }
}

