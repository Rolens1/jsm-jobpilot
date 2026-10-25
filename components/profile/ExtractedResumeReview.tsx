"use client";

import {
  Sparkles,
  CheckCircle2,
  Check,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Compass,
  X,
  FileCheck2,
  Loader2,
} from "lucide-react";
import type { ExtractedProfileData } from "@/actions/resume";

type Props = {
  data: ExtractedProfileData;
  extractionMethod?: "ai" | "heuristic";
  onValidateSection: (sectionKey: string) => void;
  onValidateAll: () => void;
  validatedSections: Record<string, boolean>;
  onDismiss?: () => void;
  isApplying?: boolean;
};

export function ExtractedResumeReview({
  data,
  extractionMethod = "heuristic",
  onValidateSection,
  onValidateAll,
  validatedSections,
  onDismiss,
  isApplying = false,
}: Props) {
  const isPersonalValidated = Boolean(validatedSections.personal);
  const isProfessionalValidated = Boolean(validatedSections.professional);
  const isSkillsValidated = Boolean(validatedSections.skills);
  const isExperienceValidated = Boolean(validatedSections.experience);
  const isEducationValidated = Boolean(validatedSections.education);
  const isPreferencesValidated = Boolean(validatedSections.preferences);

  const totalSections = 6;
  const validatedCount = [
    isPersonalValidated,
    isProfessionalValidated,
    isSkillsValidated,
    isExperienceValidated,
    isEducationValidated,
    isPreferencesValidated,
  ].filter(Boolean).length;

  return (
    <div className="w-full bg-surface rounded-2xl border-2 border-accent/40 bg-accent-muted/10 p-6 sm:p-7 shadow-sm transition-all text-left animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {extractionMethod === "ai"
                  ? "AI Resume Extraction"
                  : "Smart Resume Parser Engine"}
              </span>
            </span>
            <span className="text-xs font-medium text-text-secondary">
              {validatedCount}/{totalSections} sections validated
            </span>
          </div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            Extracted Resume Information
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Press the check button on any card to validate and apply that section, or click Auto-fill & Validate to apply all details immediately.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onValidateAll}
            disabled={isApplying}
            className="bg-accent hover:bg-accent-dark disabled:opacity-60 text-accent-foreground font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Applying & Validating...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4 shrink-0" />
                <span>Auto-fill & Validate All</span>
              </>
            )}
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
              title="Close review panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Structured Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* 1. Personal Information */}
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Personal Information
                </span>
              </div>
              <button
                type="button"
                onClick={() => onValidateSection("personal")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isPersonalValidated
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-surface hover:bg-surface-secondary text-text-secondary border border-border"
                }`}
              >
                {isPersonalValidated ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>Validated</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Validate</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Full Name:</span>
                <span className="font-semibold text-text-primary">{data.fullName || "—"}</span>
              </div>
              {data.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Phone:</span>
                  <span className="text-text-primary">{data.phone}</span>
                </div>
              )}
              {data.location && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Location:</span>
                  <span className="text-text-primary">{data.location}</span>
                </div>
              )}
              {data.linkedinUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">LinkedIn:</span>
                  <span className="text-accent truncate max-w-[180px]">{data.linkedinUrl}</span>
                </div>
              )}
              {data.portfolioUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Portfolio:</span>
                  <span className="text-accent truncate max-w-[180px]">{data.portfolioUrl}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Professional Profile */}
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Professional Profile
                </span>
              </div>
              <button
                type="button"
                onClick={() => onValidateSection("professional")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isProfessionalValidated
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-surface hover:bg-surface-secondary text-text-secondary border border-border"
                }`}
              >
                {isProfessionalValidated ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>Validated</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Validate</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Current Title:</span>
                <span className="font-semibold text-text-primary">{data.currentTitle || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Experience Level:</span>
                <span className="capitalize font-medium text-text-primary">{data.experienceLevel || "Mid"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Years Experience:</span>
                <span className="font-medium text-text-primary">{data.yearsExperience ?? 3} years</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Skills */}
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Detected Skills ({data.skills?.length || 0})
                </span>
              </div>
              <button
                type="button"
                onClick={() => onValidateSection("skills")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSkillsValidated
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-surface hover:bg-surface-secondary text-text-secondary border border-border"
                }`}
              >
                {isSkillsValidated ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>Validated</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Validate</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
              {data.skills && data.skills.length > 0 ? (
                data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-surface-secondary border border-border text-[11px] font-medium text-text-primary"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-muted italic">No skills extracted</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Education */}
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Education ({data.education?.length || 0})
                </span>
              </div>
              <button
                type="button"
                onClick={() => onValidateSection("education")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isEducationValidated
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-surface hover:bg-surface-secondary text-text-secondary border border-border"
                }`}
              >
                {isEducationValidated ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>Validated</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Validate</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              {data.education && data.education.length > 0 ? (
                data.education.map((edu, idx) => (
                  <div key={idx} className="pb-1.5 border-b border-border/40 last:border-0 last:pb-0">
                    <p className="font-semibold text-text-primary">
                      {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                    </p>
                    <p className="text-text-secondary text-[11px]">
                      {edu.institution} {edu.graduationYear ? `(${edu.graduationYear})` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <span className="text-xs text-text-muted italic">No education records found</span>
              )}
            </div>
          </div>
        </div>

        {/* 5. Work Experience / Projects */}
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between gap-3 shadow-2xs md:col-span-2">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Work Experience / Projects ({data.workExperience?.length || 0})
                </span>
              </div>
              <button
                type="button"
                onClick={() => onValidateSection("experience")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isExperienceValidated
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-surface hover:bg-surface-secondary text-text-secondary border border-border"
                }`}
              >
                {isExperienceValidated ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>Validated</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Validate</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.workExperience && data.workExperience.length > 0 ? (
                data.workExperience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-surface-secondary border border-border text-xs flex flex-col justify-between"
                  >
                    <div>
                      <p className="font-bold text-text-primary">{exp.title}</p>
                      <p className="font-medium text-accent">{exp.company}</p>
                      <p className="text-text-muted text-[11px] mt-0.5">
                        {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate || "Completed"}
                      </p>
                      {exp.responsibilities && (
                        <p className="text-text-secondary text-[11px] mt-2 line-clamp-3 leading-relaxed">
                          {exp.responsibilities}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-xs text-text-muted italic">No experience entries found</span>
              )}
            </div>
          </div>
        </div>

        {/* 6. Job Preferences & Authorization */}
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between gap-3 shadow-2xs md:col-span-2">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Target Roles & Preferences
                </span>
              </div>
              <button
                type="button"
                onClick={() => onValidateSection("preferences")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isPreferencesValidated
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-surface hover:bg-surface-secondary text-text-secondary border border-border"
                }`}
              >
                {isPreferencesValidated ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>Validated</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Validate</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">Roles Seeking:</span>
                <span className="font-semibold text-text-primary">
                  {data.jobTitlesSeeking?.join(", ") || data.currentTitle || "Full-Stack Developer"}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Work Place Preference:</span>
                <span className="capitalize font-medium text-text-primary">
                  {data.remotePreference || "Hybrid"}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Work Authorization:</span>
                <span className="capitalize font-medium text-text-primary">
                  {data.workAuthorization === "permanent_resident"
                    ? "Permanent Resident"
                    : data.workAuthorization === "visa_required"
                    ? "Visa Required"
                    : "Citizen"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
