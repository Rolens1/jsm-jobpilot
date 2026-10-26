"use client";

import { useState } from "react";
import { Sparkles, AlertCircle, X, ShieldAlert } from "lucide-react";
import { ProfileAttentionBanner } from "@/components/profile/ProfileAttentionBanner";
import { ResumeSection } from "@/components/profile/ResumeSection";
import { ExtractedResumeReview } from "@/components/profile/ExtractedResumeReview";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { extractResumeProfile, type ExtractedProfileData } from "@/actions/resume";
import type { Profile } from "@/types/database";
import type { ProfileCompletionResult } from "@/lib/profile-utils";

type Props = {
  initialProfile: Profile | null;
  userEmail: string;
  initialCompletion: ProfileCompletionResult;
};

export function ProfileContainer({
  initialProfile,
  userEmail,
  initialCompletion,
}: Props) {
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [activeResumeUrl, setActiveResumeUrl] = useState<string | null>(
    initialProfile?.resume_pdf_url || null
  );
  const [completion, setCompletion] = useState<ProfileCompletionResult>(initialCompletion);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProfileData | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<"ai" | "heuristic">("heuristic");
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [validatedSections, setValidatedSections] = useState<Record<string, boolean>>({});
  const [isApplying, setIsApplying] = useState(false);
  const [extractionAlert, setExtractionAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleExtractResume = async (fileToExtract?: File | null) => {
    const file = fileToExtract !== undefined ? fileToExtract : selectedResumeFile;
    setIsExtracting(true);
    setExtractionAlert(null);

    const formData = new FormData();
    if (file) {
      formData.append("resume", file);
    }

    try {
      const result = await extractResumeProfile(formData);
      if (result.success && result.data) {
        setExtractedData(result.data);
        setExtractionMethod(result.extractionMethod || "heuristic");
        setShowReviewPanel(true);
        // Start with clean validation state so user can validate explicitly
        setValidatedSections({});
        setExtractionAlert({
          type: "success",
          message:
            "Resume details extracted successfully! Review the extracted cards below to validate individual fields, or click 'Auto-fill & Validate All' to apply everything.",
        });
      } else {
        setExtractionAlert({
          type: "error",
          message:
            result.error ||
            "Could not extract details from this resume. Please verify the document or fill out fields manually.",
        });
      }
    } catch (err) {
      console.error("[ProfileContainer] Extraction error:", err);
      setExtractionAlert({
        type: "error",
        message: "An unexpected error occurred while parsing your resume.",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleValidateSection = (sectionKey: string) => {
    setValidatedSections((prev) => {
      const updated = { ...prev, [sectionKey]: !prev[sectionKey] };
      return updated;
    });
  };

  const handleValidateAll = () => {
    setIsApplying(true);
    const allValidated = {
      personal: true,
      professional: true,
      skills: true,
      experience: true,
      education: true,
      preferences: true,
    };
    setValidatedSections(allValidated);

    setExtractionAlert({
      type: "success",
      message:
        "All extracted details have been validated and applied to your form! Review the fields and click 'Save Profile' below to persist changes.",
    });

    setTimeout(() => {
      setIsApplying(false);
    }, 600);
  };

  const handleSaveSuccess = (result: {
    isComplete?: boolean;
    percentage?: number;
    missingFields?: string[];
    resumeUrl?: string | null;
    warning?: string;
  }) => {
    if (result.percentage !== undefined) {
      setCompletion({
        percentage: result.percentage,
        missingFields: result.missingFields || [],
        isComplete: Boolean(result.isComplete),
      });
    }

    if (result.resumeUrl) {
      setActiveResumeUrl(result.resumeUrl);
      setSelectedResumeFile(null);
    } else if (selectedResumeFile && !result.warning) {
      setActiveResumeUrl(initialProfile?.resume_pdf_url || "resumes/resume.pdf");
      setSelectedResumeFile(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Attention Banner with live completion percentage */}
      <ProfileAttentionBanner
        percentage={completion.percentage}
        missingFields={completion.missingFields}
      />

      {/* 2. Resume Extraction Alert (if triggered) */}
      {extractionAlert && (() => {
        const isRateLimited = extractionAlert.message.toLowerCase().includes("rate limit");

        return (
          <div
            role="alert"
            className={`p-4 rounded-xl border flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm font-medium transition-all ${
              isRateLimited
                ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                : extractionAlert.type === "success"
                ? "bg-accent/10 border-accent/30 text-text-primary"
                : "bg-error/10 border-error/20 text-error"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              {isRateLimited ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              ) : extractionAlert.type === "success" ? (
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                {isRateLimited && (
                  <span className="inline-block self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Demo Quota Guard
                  </span>
                )}
                <span>{extractionAlert.message}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExtractionAlert(null)}
              className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-0.5 shrink-0"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* 3. Resume Upload and AI Extraction Section */}
      <ResumeSection
        selectedFile={selectedResumeFile}
        onFileSelect={(file) => {
          setSelectedResumeFile(file);
          setExtractionAlert(null);
        }}
        existingResumeUrl={activeResumeUrl}
        onExtractResume={handleExtractResume}
        isExtracting={isExtracting}
        onGenerateResume={() => {
          setActiveResumeUrl(`/api/resume?t=${Date.now()}`);
        }}
      />

      {/* 4. Explicit Extracted Resume Review Card (shows explicitly and cleanly with validate checks & auto-fill) */}
      {extractedData && showReviewPanel && (
        <ExtractedResumeReview
          data={extractedData}
          extractionMethod={extractionMethod}
          onValidateSection={handleValidateSection}
          onValidateAll={handleValidateAll}
          validatedSections={validatedSections}
          onDismiss={() => setShowReviewPanel(false)}
          isApplying={isApplying}
        />
      )}

      {/* 5. Structured Profile Form with save persistence and merge */}
      <ProfileForm
        initialData={initialProfile}
        initialEmail={userEmail}
        selectedResumeFile={selectedResumeFile}
        extractedData={extractedData}
        validatedSections={validatedSections}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
