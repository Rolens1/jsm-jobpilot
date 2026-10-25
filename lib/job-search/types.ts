import { JobType } from "@/types/database";

export interface UnifiedJob {
  id: string;
  provider: "jsearch" | "jooble" | "adzuna";
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  jobType: JobType;
  aboutRole: string;
  sourceUrl: string;
  externalApplyUrl: string | null;
  employerLogo: string | null;
  postedAt?: string | null;
}

export interface ScoredJobMatch {
  job: UnifiedJob;
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface SearchOrchestratorOptions {
  userId: string;
  jobTitle: string;
  location: string;
  page?: number;
  forceRefresh?: boolean;
}

export interface SearchOrchestratorResult {
  runId: string;
  jobsFound: number;
  jobsSaved: number;
  fromCache: boolean;
  providerUsed: "database" | "jsearch" | "jooble" | "adzuna";
  jobs: any[]; // Matches database Job interface
}
