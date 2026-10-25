import type { Profile } from "@/types/database";

export interface ProfileCompletionResult {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
}

/**
 * Calculates candidate profile completion percentage and missing fields.
 * Follows student-friendly criteria: work experience is optional,
 * so students and early career seekers can achieve 100% completion.
 */
export function calculateProfileCompletion(
  profile: Partial<Profile> | null | undefined,
  resumePdfUrl?: string | null
): ProfileCompletionResult {
  if (!profile) {
    return {
      percentage: 0,
      missingFields: ["NAME", "TITLE", "PHONE", "LOCATION", "SKILLS", "EDUCATION", "RESUME"],
      isComplete: false,
    };
  }

  const missing: string[] = [];
  let score = 0;

  // 1. Full Name (10 pts)
  if (profile.full_name && profile.full_name.trim().length > 0) {
    score += 10;
  } else {
    missing.push("NAME");
  }

  // 2. Professional Info: Title & Experience Level (15 pts)
  const hasTitle = Boolean(profile.current_title && profile.current_title.trim().length > 0);
  const hasLevel = Boolean(profile.experience_level && String(profile.experience_level).trim().length > 0);
  if (hasTitle && hasLevel) {
    score += 15;
  } else {
    missing.push("TITLE");
  }

  // 3. Skills: at least one skill (15 pts)
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    score += 15;
  } else {
    missing.push("SKILLS");
  }

  // 4. Phone (10 pts)
  if (profile.phone && profile.phone.trim().length > 0) {
    score += 10;
  } else {
    missing.push("PHONE");
  }

  // 5. Location (10 pts)
  if (profile.location && profile.location.trim().length > 0) {
    score += 10;
  } else {
    missing.push("LOCATION");
  }

  // 6. Education: Degree + Institution (20 pts)
  let hasEducation = false;
  if (Array.isArray(profile.education) && profile.education.length > 0) {
    hasEducation = profile.education.some((item) => {
      const deg = item?.degree || (item as unknown as { highestDegree?: string })?.highestDegree;
      const inst = item?.institution || (item as unknown as { institutionName?: string })?.institutionName;
      return Boolean(deg?.trim() && inst?.trim());
    });
  } else if (profile.education && typeof profile.education === "object") {
    const eduObj = profile.education as unknown as Record<string, string | undefined>;
    const deg = eduObj.degree || eduObj.highestDegree;
    const inst = eduObj.institution || eduObj.institutionName;
    hasEducation = Boolean(deg?.trim() && inst?.trim());
  }

  if (hasEducation) {
    score += 20;
  } else {
    missing.push("EDUCATION");
  }

  // 7. Resume PDF URL (20 pts)
  const activeResume = resumePdfUrl !== undefined ? resumePdfUrl : profile.resume_pdf_url;
  if (activeResume && activeResume.trim().length > 0) {
    score += 20;
  } else {
    missing.push("RESUME");
  }

  const isComplete = missing.length === 0 && score === 100;
  const percentage = isComplete ? 100 : Math.min(score, 99);

  return {
    percentage,
    missingFields: missing,
    isComplete,
  };
}
