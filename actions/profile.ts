"use server";

import { revalidatePath } from "next/cache";
import { createInsforgeServer } from "@/lib/insforge-server";
import { captureServerEvent } from "@/lib/posthog-server";
import { calculateProfileCompletion } from "@/lib/profile-utils";
import type {
  ExperienceLevel,
  RemotePreference,
  WorkAuthorization,
  CoverLetterTone,
  WorkExperienceRole,
  EducationItem,
  Profile,
} from "@/types/database";

export interface SaveProfileResult {
  success: boolean;
  isComplete?: boolean;
  percentage?: number;
  missingFields?: string[];
  resumeUrl?: string | null;
  warning?: string;
  error?: string;
}

function parseJsonArray<T>(val: unknown, fallback: T[]): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // If comma-separated string, split and trim
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as unknown as T[];
    }
  }
  return fallback;
}

function normalizeExperienceLevel(val: string | null): ExperienceLevel | null {
  if (!val) return null;
  const lower = val.toLowerCase().trim();
  if (lower === "junior") return "junior";
  if (lower === "mid") return "mid";
  if (lower === "senior") return "senior";
  if (lower === "lead") return "lead";
  return "junior";
}

function normalizeRemotePreference(val: string | null): RemotePreference {
  if (!val) return "any";
  const lower = val.toLowerCase().trim();
  if (lower === "remote") return "remote";
  if (lower === "onsite") return "onsite";
  if (lower === "hybrid") return "hybrid";
  return "any";
}

function normalizeWorkAuth(val: string | null): WorkAuthorization {
  if (!val) return "citizen";
  const lower = val.toLowerCase().trim();
  if (lower.includes("permanent") || lower === "permanent_resident") return "permanent_resident";
  if (lower.includes("visa") || lower === "visa_required") return "visa_required";
  return "citizen";
}

function normalizeCoverLetterTone(val: string | null): CoverLetterTone {
  if (!val) return "formal";
  const lower = val.toLowerCase().trim();
  if (lower === "casual") return "casual";
  if (lower === "enthusiastic") return "enthusiastic";
  return "formal";
}

/**
 * Server Action: Save Profile and Upload Resume.
 * Supports multipart FormData containing profile fields and optional resume PDF.
 */
export async function saveProfile(formData: FormData): Promise<SaveProfileResult> {
  try {
    const insforge = await createInsforgeServer();
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return { success: false, error: "Unauthorized. Please log in to save your profile." };
    }

    const user = authData.user;

    // 1. Check existing profile record to preserve existing resume and detect initial completion
    const { data: existingProfile } = await insforge.database
      .from("profiles")
      .select("id, resume_pdf_url, is_complete")
      .eq("id", user.id)
      .maybeSingle();

    // 2. Handle Resume PDF file upload if provided
    let uploadedResumeUrl: string | null = null;
    let uploadWarning: string | undefined = undefined;

    const resumeFile = formData.get("resume") as File | null;
    if (resumeFile && resumeFile.size > 0) {
      // Validate PDF format
      const isPdfType =
        resumeFile.type === "application/pdf" ||
        resumeFile.name.toLowerCase().endsWith(".pdf");

      if (!isPdfType) {
        return {
          success: false,
          error: "Only PDF documents are supported for resume uploads.",
        };
      }

      // Validate file size (5MB max)
      const maxSizeBytes = 5 * 1024 * 1024;
      if (resumeFile.size > maxSizeBytes) {
        return {
          success: false,
          error: "Resume file size exceeds the maximum 5MB limit.",
        };
      }

      try {
        const storagePath = `${user.id}/resume.pdf`;
        const { data: uploadData, error: uploadError } = await insforge.storage
          .from("resumes")
          .upload(storagePath, resumeFile);

        if (uploadError) {
          console.error("[actions/profile] Resume storage upload error:", uploadError);
          uploadWarning =
            "Your profile text was saved, but the resume upload failed. You can re-upload your resume at any time.";
        } else {
          uploadedResumeUrl = uploadData?.url || null;
          if (!uploadedResumeUrl) {
            const { data: urlData } = insforge.storage
              .from("resumes")
              .getPublicUrl(storagePath);
            uploadedResumeUrl =
              urlData?.publicUrl ||
              `/api/storage/buckets/resumes/objects/${encodeURIComponent(storagePath)}`;
          }
        }
      } catch (storageErr) {
        console.error("[actions/profile] Resume storage upload exception:", storageErr);
        uploadWarning =
          "Your profile text was saved, but the resume upload encountered an issue. You can retry uploading your resume file.";
      }
    }

    // Preserve existing resume_pdf_url if no new file was successfully uploaded
    const finalResumeUrl =
      uploadedResumeUrl || existingProfile?.resume_pdf_url || null;

    // 3. Extract and parse structured profile fields
    const fullName = (formData.get("fullName") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const location = (formData.get("location") as string)?.trim() || null;
    const linkedinUrl = (formData.get("linkedinUrl") as string)?.trim() || null;
    const portfolioUrl = (formData.get("portfolioUrl") as string)?.trim() || null;
    const workAuthRaw = formData.get("workAuthorization") as string | null;
    const workAuthorization = normalizeWorkAuth(workAuthRaw);

    const currentTitle = (formData.get("currentTitle") as string)?.trim() || null;
    const expLevelRaw = formData.get("experienceLevel") as string | null;
    const experienceLevel = normalizeExperienceLevel(expLevelRaw);
    const yearsExpRaw = formData.get("yearsExperience") as string | null;
    const yearsExperience = yearsExpRaw ? parseInt(yearsExpRaw, 10) || 0 : 0;

    const skills = parseJsonArray<string>(formData.get("skills"), []);
    const industries = parseJsonArray<string>(formData.get("industries"), []);
    const workExperience = parseJsonArray<WorkExperienceRole>(
      formData.get("workExperience"),
      []
    );

    // Education parsing: can be array or single object
    let education: EducationItem[] = [];
    const educationRaw = formData.get("education");
    if (typeof educationRaw === "string") {
      try {
        const parsed = JSON.parse(educationRaw);
        if (Array.isArray(parsed)) {
          education = parsed;
        } else if (parsed && typeof parsed === "object") {
          education = [
            {
              degree: parsed.highestDegree || parsed.degree || "",
              field: parsed.fieldOfStudy || parsed.field || "",
              institution: parsed.institutionName || parsed.institution || "",
              graduationYear: parsed.graduationYear || "",
            },
          ];
        }
      } catch {
        education = [];
      }
    }

    const jobTitlesSeeking = parseJsonArray<string>(
      formData.get("jobTitlesSeeking"),
      []
    );
    const remotePrefRaw = formData.get("remotePreference") as string | null;
    const remotePreference = normalizeRemotePreference(remotePrefRaw);
    const salaryExpectation =
      (formData.get("salaryExpectation") as string)?.trim() || null;
    const preferredLocations = parseJsonArray<string>(
      formData.get("preferredLocations"),
      []
    );
    const coverLetterToneRaw = formData.get("coverLetterTone") as string | null;
    const coverLetterTone = normalizeCoverLetterTone(coverLetterToneRaw);

    // 4. Calculate completion score and missing fields
    const candidateData: Partial<Profile> = {
      full_name: fullName,
      phone,
      location,
      current_title: currentTitle,
      experience_level: experienceLevel,
      years_experience: yearsExperience,
      skills,
      industries,
      work_experience: workExperience,
      education,
      job_titles_seeking: jobTitlesSeeking,
      remote_preference: remotePreference,
      preferred_locations: preferredLocations,
      salary_expectation: salaryExpectation,
      cover_letter_tone: coverLetterTone,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl,
      work_authorization: workAuthorization,
      resume_pdf_url: finalResumeUrl,
    };

    const completion = calculateProfileCompletion(candidateData, finalResumeUrl);

    // 5. Save to profiles database table
    const profileRow = {
      ...candidateData,
      email: user.email ?? "",
      resume_pdf_url: finalResumeUrl,
      is_complete: completion.isComplete,
      updated_at: new Date().toISOString(),
    };

    if (existingProfile) {
      const { error: updateError } = await insforge.database
        .from("profiles")
        .update(profileRow)
        .eq("id", user.id);

      if (updateError) {
        console.error("[actions/profile] Database update error:", updateError);
        return { success: false, error: "Failed to update profile record in database." };
      }
    } else {
      const { error: insertError } = await insforge.database
        .from("profiles")
        .insert([
          {
            id: user.id,
            ...profileRow,
          },
        ]);

      if (insertError) {
        console.error("[actions/profile] Database insert error:", insertError);
        return { success: false, error: "Failed to create profile record in database." };
      }
    }

    // 6. AC-4: When is_complete transitions from false to true for the first time, record PostHog event
    const wasAlreadyComplete = existingProfile?.is_complete === true;
    if (!wasAlreadyComplete && completion.isComplete) {
      try {
        await captureServerEvent(user.id, "profile_completed", {
          userId: user.id,
        });
      } catch (analyticsErr) {
        console.error("[actions/profile] Analytics event error:", analyticsErr);
      }
    }

    // 7. AC-7: Revalidate profile route cache
    revalidatePath("/profile");

    return {
      success: true,
      isComplete: completion.isComplete,
      percentage: completion.percentage,
      missingFields: completion.missingFields,
      resumeUrl: finalResumeUrl,
      warning: uploadWarning,
    };
  } catch (error) {
    console.error("[actions/profile] Unexpected saveProfile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred while saving profile.",
    };
  }
}
