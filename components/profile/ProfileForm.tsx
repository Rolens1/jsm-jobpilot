"use client";

import { useState, useEffect, useRef, useTransition, FormEvent, KeyboardEvent } from "react";
import {
  ChevronDown,
  Plus,
  X,
  Calendar,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { saveProfile } from "@/actions/profile";
import type { ExtractedProfileData } from "@/actions/resume";
import type { Profile } from "@/types/database";
import { useTranslation } from "@/components/providers/LanguageProvider";

type WorkExperience = {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string;
};

type EducationEntry = {
  id: string;
  degree: string;
  field: string;
  institution: string;
  graduationYear: string;
};

type Props = {
  initialEmail?: string;
  initialData?: Profile | null;
  selectedResumeFile?: File | null;
  extractedData?: ExtractedProfileData | null;
  validatedSections?: Record<string, boolean>;
  onSave?: (data: unknown) => void;
  onSaveSuccess?: (result: {
    isComplete?: boolean;
    percentage?: number;
    missingFields?: string[];
    resumeUrl?: string | null;
    warning?: string;
  }) => void;
};

export function ProfileForm({
  initialEmail = "faizan@jsmastery.pro",
  initialData,
  selectedResumeFile,
  extractedData,
  validatedSections,
  onSave,
  onSaveSuccess,
}: Props) {
  const { dict } = useTranslation();

  // Helper mappings for prefilled data
  const mapWorkAuthToLabel = (val?: string | null) => {
    if (!val) return "Citizen";
    const lower = val.toLowerCase();
    if (lower.includes("permanent")) return "Permanent Resident";
    if (lower.includes("visa")) return "Visa Required";
    return "Citizen";
  };

  const mapExpLevelToLabel = (val?: string | null) => {
    if (!val) return "Junior";
    const lower = val.toLowerCase();
    if (lower === "mid") return "Mid";
    if (lower === "senior") return "Senior";
    if (lower === "lead") return "Lead";
    return "Junior";
  };

  const mapRemotePrefToLabel = (val?: string | null) => {
    if (!val) return "Any";
    const lower = val.toLowerCase();
    if (lower === "remote") return "Remote";
    if (lower === "hybrid") return "Hybrid";
    if (lower === "onsite") return "Onsite";
    return "Any";
  };

  // Personal Info State
  const [fullName, setFullName] = useState(
    initialData?.full_name ?? "Faizan Ali"
  );
  const [email] = useState(initialEmail || initialData?.email || "faizan@jsmastery.pro");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(
    initialData?.linkedin_url ?? "https://linkedin.com/in/faizan"
  );
  const [portfolioUrl, setPortfolioUrl] = useState(
    initialData?.portfolio_url ?? "https://github.com/jsmastery"
  );
  const [workAuthorization, setWorkAuthorization] = useState(
    mapWorkAuthToLabel(initialData?.work_authorization)
  );

  // Professional Info State
  const [currentTitle, setCurrentTitle] = useState(
    initialData?.current_title ?? "Frontend Engineer"
  );
  const [experienceLevel, setExperienceLevel] = useState(
    mapExpLevelToLabel(initialData?.experience_level)
  );
  const [yearsExperience, setYearsExperience] = useState(
    initialData?.years_experience !== undefined
      ? String(initialData.years_experience)
      : "4"
  );

  // Skills
  const [skills, setSkills] = useState<string[]>(
    initialData?.skills?.length
      ? initialData.skills
      : ["React", "TypeScript", "Next.js", "Tailwind CSS"]
  );
  const [newSkill, setNewSkill] = useState("");

  // Industries
  const [industries, setIndustries] = useState<string[]>(
    initialData?.industries ?? []
  );
  const [newIndustry, setNewIndustry] = useState("");

  // Work Experience State
  const initialExperiences: WorkExperience[] = initialData?.work_experience?.length
    ? initialData.work_experience.map((exp, idx) => ({
        id: `exp-${idx}`,
        company: exp.company || "",
        title: exp.title || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        isCurrent: Boolean(exp.current),
        responsibilities: exp.responsibilities || "",
      }))
    : [
        {
          id: "exp-1",
          company: "Vercel",
          title: "Frontend Engineer",
          startDate: "January 2022",
          endDate: "",
          isCurrent: true,
          responsibilities:
            "Built Next.js features and optimized web vitals. Led a team of 3 developers.",
        },
      ];

  const [experiences, setExperiences] = useState<WorkExperience[]>(initialExperiences);

  // Education State (List of up to 3 educations)
  const initialEducations: EducationEntry[] = initialData?.education?.length
    ? initialData.education.map((edu, idx) => ({
        id: `edu-${idx}`,
        degree: edu.degree || "Bachelor's",
        field: edu.field || "",
        institution: edu.institution || "",
        graduationYear: edu.graduationYear || "",
      }))
    : [
        {
          id: "edu-default",
          degree: "Bachelor's",
          field: "Computer Science",
          institution: "",
          graduationYear: "",
        },
      ];

  const [educations, setEducations] = useState<EducationEntry[]>(initialEducations);

  const handleAddEducation = () => {
    if (educations.length >= 3) return;
    setEducations((prev) => [
      ...prev,
      {
        id: `edu-${Date.now()}`,
        degree: "Bachelor's",
        field: "",
        institution: "",
        graduationYear: "",
      },
    ]);
  };

  const handleRemoveEducation = (id: string) => {
    if (educations.length <= 1) return;
    setEducations((prev) => prev.filter((edu) => edu.id !== id));
  };

  const handleEducationChange = (
    id: string,
    field: keyof Omit<EducationEntry, "id">,
    value: string
  ) => {
    setEducations((prev) =>
      prev.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  // Job Preferences State
  const [jobTitlesSeeking, setJobTitlesSeeking] = useState(
    initialData?.job_titles_seeking?.length
      ? initialData.job_titles_seeking.join(", ")
      : "Frontend Engineer, React Developer"
  );
  const [remotePreference, setRemotePreference] = useState(
    mapRemotePrefToLabel(initialData?.remote_preference)
  );
  const [salaryExpectation, setSalaryExpectation] = useState(
    initialData?.salary_expectation ?? ""
  );
  const [preferredLocations, setPreferredLocations] = useState(
    initialData?.preferred_locations?.length
      ? initialData.preferred_locations.join(", ")
      : ""
  );

  // UI Feedback & Pending States
  const [isPending, startTransition] = useTransition();
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Snapshots of form fields captured prior to section validation so unchecking reverts changes
  type SectionSnapshots = {
    personal?: {
      fullName: string;
      phone: string;
      location: string;
      linkedinUrl: string;
      portfolioUrl: string;
      workAuthorization: string;
    };
    professional?: {
      currentTitle: string;
      experienceLevel: string;
      yearsExperience: string;
    };
    skills?: {
      skills: string[];
      industries: string[];
    };
    experience?: {
      experiences: WorkExperience[];
    };
    education?: {
      educations: EducationEntry[];
    };
    preferences?: {
      jobTitlesSeeking: string;
      remotePreference: string;
      salaryExpectation: string;
      preferredLocations: string;
    };
  };

  const snapshotsRef = useRef<SectionSnapshots>({});
  const prevValidatedRef = useRef<Record<string, boolean>>({});
  const prevExtractedDataRef = useRef<ExtractedProfileData | null | undefined>(null);

  const latestValuesRef = useRef({
    fullName,
    phone,
    location,
    linkedinUrl,
    portfolioUrl,
    workAuthorization,
    currentTitle,
    experienceLevel,
    yearsExperience,
    skills,
    industries,
    experiences,
    educations,
    jobTitlesSeeking,
    remotePreference,
    salaryExpectation,
    preferredLocations,
  });

  useEffect(() => {
    latestValuesRef.current = {
      fullName,
      phone,
      location,
      linkedinUrl,
      portfolioUrl,
      workAuthorization,
      currentTitle,
      experienceLevel,
      yearsExperience,
      skills,
      industries,
      experiences,
      educations,
      jobTitlesSeeking,
      remotePreference,
      salaryExpectation,
      preferredLocations,
    };
  });


  useEffect(() => {
    if (extractedData !== prevExtractedDataRef.current) {
      prevExtractedDataRef.current = extractedData;
      snapshotsRef.current = {};
      prevValidatedRef.current = {};
    }
  }, [extractedData]);

  // Synchronize validated sections with form state: apply on validate, revert on uncheck
  useEffect(() => {
    if (!extractedData || !validatedSections) return;

    const sections = [
      "personal",
      "professional",
      "skills",
      "experience",
      "education",
      "preferences",
    ] as const;

    sections.forEach((section) => {
      const wasValidated = Boolean(prevValidatedRef.current[section]);
      const isValidated = Boolean(validatedSections[section]);

      // 1. Validation checked: capture snapshot if not already stored, then apply extracted data
      if (!wasValidated && isValidated) {
        const cur = latestValuesRef.current;
        switch (section) {
          case "personal": {
            if (!snapshotsRef.current.personal) {
              snapshotsRef.current.personal = {
                fullName: cur.fullName,
                phone: cur.phone,
                location: cur.location,
                linkedinUrl: cur.linkedinUrl,
                portfolioUrl: cur.portfolioUrl,
                workAuthorization: cur.workAuthorization,
              };
            }
            if (extractedData.fullName?.trim()) {
              setFullName(extractedData.fullName.trim());
            }
            if (extractedData.phone?.trim()) {
              setPhone(extractedData.phone.trim());
            }
            if (extractedData.location?.trim()) {
              setLocation(extractedData.location.trim());
            }
            if (extractedData.linkedinUrl?.trim()) {
              setLinkedinUrl(extractedData.linkedinUrl.trim());
            }
            if (extractedData.portfolioUrl?.trim()) {
              setPortfolioUrl(extractedData.portfolioUrl.trim());
            }
            if (extractedData.workAuthorization) {
              setWorkAuthorization(mapWorkAuthToLabel(extractedData.workAuthorization));
            }
            break;
          }

          case "professional": {
            if (!snapshotsRef.current.professional) {
              snapshotsRef.current.professional = {
                currentTitle: cur.currentTitle,
                experienceLevel: cur.experienceLevel,
                yearsExperience: cur.yearsExperience,
              };
            }
            if (extractedData.currentTitle?.trim()) {
              setCurrentTitle(extractedData.currentTitle.trim());
            }
            if (extractedData.experienceLevel) {
              setExperienceLevel(mapExpLevelToLabel(extractedData.experienceLevel));
            }
            if (extractedData.yearsExperience !== undefined && extractedData.yearsExperience !== null) {
              setYearsExperience(String(extractedData.yearsExperience));
            }
            break;
          }

          case "skills": {
            if (!snapshotsRef.current.skills) {
              snapshotsRef.current.skills = {
                skills: [...cur.skills],
                industries: [...cur.industries],
              };
            }
            if (Array.isArray(extractedData.skills) && extractedData.skills.length > 0) {
              setSkills((prev) => Array.from(new Set([...prev, ...extractedData.skills!])));
            }
            if (Array.isArray(extractedData.industries) && extractedData.industries.length > 0) {
              setIndustries((prev) => Array.from(new Set([...prev, ...extractedData.industries!])));
            }
            break;
          }

          case "experience": {
            if (!snapshotsRef.current.experience) {
              snapshotsRef.current.experience = {
                experiences: cur.experiences.map((exp) => ({ ...exp })),
              };
            }
            if (Array.isArray(extractedData.workExperience) && extractedData.workExperience.length > 0) {
              setExperiences(
                extractedData.workExperience.slice(0, 3).map((exp, idx) => ({
                  id: `extracted-exp-${idx}-${Date.now()}`,
                  company: exp.company || "",
                  title: exp.title || "",
                  startDate: exp.startDate || "",
                  endDate: exp.endDate || "",
                  isCurrent: Boolean(exp.isCurrent),
                  responsibilities: exp.responsibilities || "",
                }))
              );
            }
            break;
          }

          case "education": {
            if (!snapshotsRef.current.education) {
              snapshotsRef.current.education = {
                educations: cur.educations.map((edu) => ({ ...edu })),
              };
            }
            if (Array.isArray(extractedData.education) && extractedData.education.length > 0) {
              setEducations((prev) => {
                const hasManualContent = prev.some(
                  (e) =>
                    e.institution.trim() !== "" ||
                    e.graduationYear.trim() !== "" ||
                    (e.field.trim() !== "" && e.field !== "Computer Science")
                );

                if (!hasManualContent && prev.length === 1) {
                  return extractedData.education!.slice(0, 3).map((edu, idx) => ({
                    id: `extracted-edu-${idx}-${Date.now()}`,
                    degree: edu.degree?.trim() || "Bachelor's",
                    field: edu.field?.trim() || "",
                    institution: edu.institution?.trim() || "",
                    graduationYear: edu.graduationYear?.trim() || "",
                  }));
                }

                const newEntries: EducationEntry[] = [];
                for (const extEdu of extractedData.education!) {
                  const extInst = extEdu.institution?.trim().toLowerCase() || "";
                  const extDeg = extEdu.degree?.trim().toLowerCase() || "";
                  const exists = prev.some(
                    (e) =>
                      e.institution.trim().toLowerCase() === extInst &&
                      e.degree.trim().toLowerCase() === extDeg
                  );
                  if (!exists && (extEdu.institution?.trim() || extEdu.degree?.trim())) {
                    newEntries.push({
                      id: `extracted-edu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                      degree: extEdu.degree?.trim() || "Bachelor's",
                      field: extEdu.field?.trim() || "",
                      institution: extEdu.institution?.trim() || "",
                      graduationYear: extEdu.graduationYear?.trim() || "",
                    });
                  }
                }

                return [...prev, ...newEntries].slice(0, 3);
              });
            }
            break;
          }

          case "preferences": {
            if (!snapshotsRef.current.preferences) {
              snapshotsRef.current.preferences = {
                jobTitlesSeeking: cur.jobTitlesSeeking,
                remotePreference: cur.remotePreference,
                salaryExpectation: cur.salaryExpectation,
                preferredLocations: cur.preferredLocations,
              };
            }
            if (Array.isArray(extractedData.jobTitlesSeeking) && extractedData.jobTitlesSeeking.length > 0) {
              setJobTitlesSeeking((prev) => {
                const existing = prev ? prev.split(",").map((s) => s.trim()).filter(Boolean) : [];
                const combined = Array.from(new Set([...existing, ...extractedData.jobTitlesSeeking!]));
                return combined.join(", ");
              });
            }
            if (extractedData.remotePreference) {
              setRemotePreference(mapRemotePrefToLabel(extractedData.remotePreference));
            }
            if (extractedData.salaryExpectation?.trim()) {
              setSalaryExpectation(extractedData.salaryExpectation.trim());
            }
            if (Array.isArray(extractedData.preferredLocations) && extractedData.preferredLocations.length > 0) {
              setPreferredLocations((prev) => {
                const existing = prev ? prev.split(",").map((s) => s.trim()).filter(Boolean) : [];
                const combined = Array.from(new Set([...existing, ...extractedData.preferredLocations!]));
                return combined.join(", ");
              });
            }
            break;
          }
        }
      }

      // 2. Validation unchecked / removed: revert changes back to snapshot
      else if (wasValidated && !isValidated) {
        switch (section) {
          case "personal": {
            const snap = snapshotsRef.current.personal;
            if (snap) {
              setFullName(snap.fullName);
              setPhone(snap.phone);
              setLocation(snap.location);
              setLinkedinUrl(snap.linkedinUrl);
              setPortfolioUrl(snap.portfolioUrl);
              setWorkAuthorization(snap.workAuthorization);
              delete snapshotsRef.current.personal;
            }
            break;
          }

          case "professional": {
            const snap = snapshotsRef.current.professional;
            if (snap) {
              setCurrentTitle(snap.currentTitle);
              setExperienceLevel(snap.experienceLevel);
              setYearsExperience(snap.yearsExperience);
              delete snapshotsRef.current.professional;
            }
            break;
          }

          case "skills": {
            const snap = snapshotsRef.current.skills;
            if (snap) {
              setSkills(snap.skills);
              setIndustries(snap.industries);
              delete snapshotsRef.current.skills;
            }
            break;
          }

          case "experience": {
            const snap = snapshotsRef.current.experience;
            if (snap) {
              setExperiences(snap.experiences);
              delete snapshotsRef.current.experience;
            }
            break;
          }

          case "education": {
            const snap = snapshotsRef.current.education;
            if (snap) {
              setEducations(snap.educations);
              delete snapshotsRef.current.education;
            }
            break;
          }

          case "preferences": {
            const snap = snapshotsRef.current.preferences;
            if (snap) {
              setJobTitlesSeeking(snap.jobTitlesSeeking);
              setRemotePreference(snap.remotePreference);
              setSalaryExpectation(snap.salaryExpectation);
              setPreferredLocations(snap.preferredLocations);
              delete snapshotsRef.current.preferences;
            }
            break;
          }
        }
      }
    });

    prevValidatedRef.current = { ...validatedSections };
  }, [extractedData, validatedSections]);

  // Skill Handlers
  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Industry Handlers
  const handleAddIndustry = () => {
    const trimmed = newIndustry.trim();
    if (trimmed && !industries.includes(trimmed)) {
      setIndustries([...industries, trimmed]);
      setNewIndustry("");
    }
  };

  const handleIndustryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIndustry();
    }
  };

  const handleRemoveIndustry = (indToRemove: string) => {
    setIndustries(industries.filter((i) => i !== indToRemove));
  };

  // Experience Handlers
  const handleAddRole = () => {
    if (experiences.length >= 3) return;
    const newId = `exp-${Date.now()}`;
    setExperiences([
      ...experiences,
      {
        id: newId,
        company: "",
        title: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        responsibilities: "",
      },
    ]);
  };

  const handleRemoveRole = (id: string) => {
    if (experiences.length <= 1) return;
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const handleExperienceChange = (
    id: string,
    field: keyof WorkExperience,
    value: string | boolean
  ) => {
    setExperiences(
      experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  // Core Save Logic
  const saveProfileData = () => {
    setErrorMessage(null);
    setWarningMessage(null);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("phone", phone);
    formData.append("location", location);
    formData.append("linkedinUrl", linkedinUrl);
    formData.append("portfolioUrl", portfolioUrl);
    formData.append("workAuthorization", workAuthorization);

    formData.append("currentTitle", currentTitle);
    formData.append("experienceLevel", experienceLevel);
    formData.append("yearsExperience", yearsExperience);

    formData.append("skills", JSON.stringify(skills));
    formData.append("industries", JSON.stringify(industries));

    formData.append(
      "workExperience",
      JSON.stringify(
        experiences.map((exp) => ({
          company: exp.company,
          title: exp.title,
          startDate: exp.startDate,
          endDate: exp.endDate,
          current: exp.isCurrent,
          responsibilities: exp.responsibilities,
        }))
      )
    );

    formData.append(
      "education",
      JSON.stringify(
        educations.map((edu) => ({
          degree: edu.degree,
          field: edu.field,
          institution: edu.institution,
          graduationYear: edu.graduationYear,
        }))
      )
    );

    formData.append("jobTitlesSeeking", jobTitlesSeeking);
    formData.append("remotePreference", remotePreference);
    formData.append("salaryExpectation", salaryExpectation);
    formData.append("preferredLocations", preferredLocations);

    if (selectedResumeFile) {
      formData.append("resume", selectedResumeFile);
    }

    startTransition(async () => {
      try {
        const result = await saveProfile(formData);

        if (!result.success) {
          setErrorMessage(
            result.error || "Failed to save profile. Please verify your entries."
          );
          return;
        }

        setIsSavedFeedback(true);
        setTimeout(() => {
          setIsSavedFeedback(false);
        }, 4000);
        if (result.warning) {
          setWarningMessage(result.warning);
        }

        onSaveSuccess?.({
          isComplete: result.isComplete,
          percentage: result.percentage,
          missingFields: result.missingFields,
          resumeUrl: result.resumeUrl,
          warning: result.warning,
        });

        onSave?.(result);
      } catch (err) {
        console.error("Save profile error:", err);
        setErrorMessage("An unexpected error occurred while saving your profile.");
      }
    });
  };

  // Form Submit Handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveProfileData();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm text-left"
    >
      <h2 className="text-lg font-bold text-text-primary tracking-tight">
        {dict.profile.profileInfoHeading}
      </h2>
      <p className="text-xs sm:text-sm text-text-secondary mt-1">
        {dict.profile.profileInfoSubtitle}
      </p>

      <hr className="border-border my-6" />

      {/* 1. PERSONAL INFO */}
      <section aria-labelledby="personal-info-heading">
        <h3
          id="personal-info-heading"
          className="text-base font-bold text-text-primary mb-4"
        >
          {dict.profile.personalTitle}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Full Name */}
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.fullName}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={dict.profile.fullNamePlaceholder}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
          </div>

          {/* Email (Read Only) */}
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.email}
            </label>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="w-full bg-surface-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-secondary cursor-not-allowed select-none"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.phone}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={dict.profile.phonePlaceholder}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.location}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={dict.profile.locationPlaceholder}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.linkedinUrl}
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/faizan"
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
          </div>

          {/* Portfolio / GitHub */}
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.portfolioUrl}
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/jsmastery"
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
          </div>

          {/* Work Authorization */}
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.workAuthorization}
            </label>
            <div className="relative">
              <select
                value={workAuthorization}
                onChange={(e) => setWorkAuthorization(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors cursor-pointer pr-10"
              >
                <option value="Citizen">{dict.profile.citizen}</option>
                <option value="Permanent Resident">{dict.profile.permanentResident}</option>
                <option value="Visa Required">{dict.profile.visaRequired}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-secondary absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <hr className="border-border my-6" />

      {/* 2. PROFESSIONAL INFO */}
      <section aria-labelledby="professional-info-heading">
        <h3
          id="professional-info-heading"
          className="text-base font-bold text-text-primary mb-4"
        >
          {dict.profile.professionalInfoHeading}
        </h3>

        {/* Current Job Title */}
        <div>
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            {dict.profile.currentJobTitle}
          </label>
          <input
            type="text"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder="Frontend Engineer"
            className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
          />
        </div>

        {/* Experience Level & Years */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4">
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.experienceLevel}
            </label>
            <div className="relative">
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors cursor-pointer pr-10"
              >
                <option value="Junior">{dict.profile.levelJunior}</option>
                <option value="Mid">{dict.profile.levelMid}</option>
                <option value="Senior">{dict.profile.levelSenior}</option>
                <option value="Lead">{dict.profile.levelLead}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-secondary absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.experienceYears}
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="4"
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Skills Tag Input */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            {dict.profile.skillsTitle}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder={dict.profile.addSkillPlaceholder}
              className="flex-1 bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-surface hover:bg-surface-secondary border border-border rounded-lg text-sm font-medium text-text-primary shadow-xs transition-colors cursor-pointer"
            >
              {dict.profile.addSkillButton}
            </button>
          </div>

          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary inline-flex items-center gap-1.5"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    title={`Remove ${skill}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Industries Worked In */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            {dict.profile.industriesWorkedIn}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              onKeyDown={handleIndustryKeyDown}
              placeholder={dict.profile.industriesWorkedInPlaceholder}
              className="flex-1 bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
            <button
              type="button"
              onClick={handleAddIndustry}
              className="px-4 py-2 bg-surface hover:bg-surface-secondary border border-border rounded-lg text-sm font-medium text-text-primary shadow-xs transition-colors cursor-pointer"
            >
              {dict.profile.addSkillButton}
            </button>
          </div>

          {industries.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {industries.map((ind) => (
                <span
                  key={ind}
                  className="bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary inline-flex items-center gap-1.5"
                >
                  {ind}
                  <button
                    type="button"
                    onClick={() => handleRemoveIndustry(ind)}
                    className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    title={`Remove ${ind}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <hr className="border-border my-6" />

      {/* 3. WORK EXPERIENCE */}
      <section aria-labelledby="work-experience-heading">
        <div className="flex items-center justify-between mb-4">
          <h3
            id="work-experience-heading"
            className="text-base font-bold text-text-primary"
          >
            {dict.profile.experienceTitle}
          </h3>
          {experiences.length < 3 && (
            <button
              type="button"
              onClick={handleAddRole}
              className="text-sm font-medium text-accent hover:text-accent-dark transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{dict.profile.addRoleButton}</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="border border-border rounded-xl p-4 sm:p-5 bg-surface space-y-4 relative"
            >
              {experiences.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRole(exp.id)}
                  className="absolute top-4 right-4 text-text-muted hover:text-error transition-colors p-1"
                  title={dict.profile.removeExperience}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Company & Job Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                    {dict.profile.companyName}
                  </label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) =>
                      handleExperienceChange(exp.id, "company", e.target.value)
                    }
                    placeholder="Vercel"
                    className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                    {dict.profile.jobTitle}
                  </label>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) =>
                      handleExperienceChange(exp.id, "title", e.target.value)
                    }
                    placeholder="Frontend Engineer"
                    className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Dates & Currently Working Checkbox */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                    {dict.profile.startDate}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) =>
                        handleExperienceChange(
                          exp.id,
                          "startDate",
                          e.target.value
                        )
                      }
                      placeholder="January 2022"
                      className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors pr-10"
                    />
                    <Calendar className="w-4 h-4 text-text-secondary absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                      {dict.profile.endDate}
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exp.isCurrent}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "isCurrent",
                            e.target.checked
                          )
                        }
                        className="rounded border-border text-accent focus:ring-accent w-3.5 h-3.5 cursor-pointer accent-accent"
                      />
                      <span>{dict.profile.currentlyWorking}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={exp.isCurrent ? "" : exp.endDate}
                    onChange={(e) =>
                      handleExperienceChange(exp.id, "endDate", e.target.value)
                    }
                    disabled={exp.isCurrent}
                    placeholder={dict.profile.present}
                    className={`w-full border border-border rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                      exp.isCurrent
                        ? "bg-surface-secondary text-text-muted cursor-not-allowed"
                        : "bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                    }`}
                  />
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                  {dict.profile.roleDescription}
                </label>
                <textarea
                  rows={3}
                  value={exp.responsibilities}
                  onChange={(e) =>
                    handleExperienceChange(
                      exp.id,
                      "responsibilities",
                      e.target.value
                    )
                  }
                  placeholder="Built Next.js features and optimized web vitals. Led a team of 3 developers."
                  className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors resize-y leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border my-6" />

      {/* 4. EDUCATION */}
      <section aria-labelledby="education-heading">
        <div className="flex items-center justify-between mb-4">
          <h3
            id="education-heading"
            className="text-base font-bold text-text-primary"
          >
            {dict.profile.educationTitle}
          </h3>
          {educations.length < 3 && (
            <button
              type="button"
              onClick={handleAddEducation}
              className="text-sm font-medium text-accent hover:text-accent-dark transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{dict.profile.addEducationButton}</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {educations.map((edu) => (
            <div
              key={edu.id}
              className="border border-border rounded-xl p-4 sm:p-5 bg-surface space-y-4 relative"
            >
              {educations.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(edu.id)}
                  className="absolute top-4 right-4 text-text-muted hover:text-error transition-colors p-1 cursor-pointer"
                  title={dict.profile.removeEducation}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Degree */}
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                    {dict.profile.degree}
                  </label>
                  <div className="relative">
                    <select
                      value={edu.degree}
                      onChange={(e) =>
                        handleEducationChange(edu.id, "degree", e.target.value)
                      }
                      className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors cursor-pointer pr-10"
                    >
                      <option value="High School">{dict.profile.degreeHighSchool}</option>
                      <option value="Associate">{dict.profile.degreeAssociate}</option>
                      <option value="Bachelor's">{dict.profile.degreeBachelor}</option>
                      <option value="Master's">{dict.profile.degreeMaster}</option>
                      <option value="Doctorate">{dict.profile.degreeDoctorate}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-secondary absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Field of Study */}
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                    {dict.profile.fieldOfStudy}
                  </label>
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) =>
                      handleEducationChange(edu.id, "field", e.target.value)
                    }
                    placeholder="Computer Science"
                    className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>

                {/* Institution Name */}
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                    {dict.profile.institution}
                  </label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) =>
                      handleEducationChange(
                        edu.id,
                        "institution",
                        e.target.value
                      )
                    }
                    placeholder="E.g. State University"
                    className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>

                {/* Graduation Year */}
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
                    {dict.profile.graduationYear}
                  </label>
                  <input
                    type="text"
                    value={edu.graduationYear}
                    onChange={(e) =>
                      handleEducationChange(
                        edu.id,
                        "graduationYear",
                        e.target.value
                      )
                    }
                    placeholder="YYYY"
                    className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border my-6" />

      {/* 5. JOB PREFERENCES */}
      <section aria-labelledby="job-preferences-heading">
        <h3
          id="job-preferences-heading"
          className="text-base font-bold text-text-primary mb-4"
        >
          {dict.profile.jobPreferencesHeading}
        </h3>

        {/* Job Titles Seeking */}
        <div>
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            {dict.profile.jobTitlesSeekingLabel}
          </label>
          <input
            type="text"
            value={jobTitlesSeeking}
            onChange={(e) => setJobTitlesSeeking(e.target.value)}
            placeholder={dict.profile.jobTitlesSeekingPlaceholder}
            className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
          />
        </div>

        {/* Remote Preference & Salary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4">
          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.remotePreferenceLabel}
            </label>
            <div className="relative">
              <select
                value={remotePreference}
                onChange={(e) => setRemotePreference(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors cursor-pointer pr-10"
              >
                <option value="Any">{dict.profile.remoteAny}</option>
                <option value="Remote">{dict.profile.remoteRemote}</option>
                <option value="Hybrid">{dict.profile.remoteHybrid}</option>
                <option value="Onsite">{dict.profile.remoteOnsite}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-secondary absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
              {dict.profile.salaryExpectationOptional}
            </label>
            <input
              type="text"
              value={salaryExpectation}
              onChange={(e) => setSalaryExpectation(e.target.value)}
              placeholder={dict.profile.salaryExpectationPlaceholder}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Preferred Locations */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">
            {dict.profile.preferredLocationsOptional}
          </label>
          <input
            type="text"
            value={preferredLocations}
            onChange={(e) => setPreferredLocations(e.target.value)}
            placeholder={dict.profile.preferredLocationsPlaceholder}
            className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
          />
        </div>
      </section>

      {/* Save Button & Feedback Alerts */}
      <div className="mt-8 space-y-3">
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-accent hover:bg-accent-dark text-accent-foreground font-semibold rounded-xl transition-all duration-200 shadow-sm text-base flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-accent-foreground" />
              <span>{dict.profile.savingButton}</span>
            </>
          ) : isSavedFeedback ? (
            <>
              <Check className="w-5 h-5 text-accent-foreground animate-in fade-in zoom-in-75" />
              <span>{dict.profile.profileSavedFeedback}</span>
            </>
          ) : (
            <span>{dict.profile.saveButton}</span>
          )}
        </button>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs sm:text-sm font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Warning Alert */}
        {warningMessage && (
          <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs sm:text-sm font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Success Feedback Notice */}
        {isSavedFeedback && !warningMessage && (
          <p className="text-center text-xs text-success font-medium animate-in fade-in">
            {dict.profile.profileSavedDatabase}
          </p>
        )}
      </div>
    </form>
  );
}
