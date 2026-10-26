/**
 * Database type definitions for InsForge PostgreSQL tables
 * Matches spec 0001-database-schema and architecture.md
 */

export type ExperienceLevel = "junior" | "mid" | "senior" | "lead";
export type RemotePreference = "remote" | "onsite" | "hybrid" | "any";
export type CoverLetterTone = "formal" | "casual" | "enthusiastic";
export type WorkAuthorization = "citizen" | "permanent_resident" | "visa_required";

export type WorkExperienceRole = {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  responsibilities?: string;
};

export type EducationItem = {
  degree: string;
  field: string;
  institution: string;
  graduationYear?: string;
};

export interface Profile {
  id: string; // References auth.users(id)
  full_name: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: ExperienceLevel | null;
  years_experience: number;
  skills: string[];
  industries: string[];
  work_experience: WorkExperienceRole[];
  education: EducationItem[];
  job_titles_seeking: string[];
  remote_preference: RemotePreference;
  preferred_locations: string[];
  salary_expectation: string | null;
  cover_letter_tone: CoverLetterTone;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: WorkAuthorization;
  resume_pdf_url: string | null;
  preferred_language?: string | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export type AgentRunStatus = "running" | "completed" | "failed";

export interface AgentRun {
  id: string;
  user_id: string;
  status: AgentRunStatus;
  job_title_searched: string;
  location_searched: string | null;
  jobs_found: number;
  started_at: string;
  completed_at: string | null;
}

export type JobSource = "search" | "url";
export type JobType = "fulltime" | "parttime" | "contract";
export type JobStatus = "saved" | "applied" | "interviewing" | "rejected";

export type CompanyResearchDossier = {
  companyOverview?: string;
  techStack?: string[];
  culture?: string[] | string;
  whyThisRole?: string;
  yourEdge?: string[];
  gapsToAddress?: string[];
  smartQuestions?: string[];
  interviewPrep?: string[];
  sources?: string[];
  extractedAt?: string;
  overview?: string;
  mission?: string;
  recentNews?: string[];
  interviewTips?: string[];
  glassdoorRating?: number;
  [key: string]: unknown;
};

export interface Job {
  id: string;
  run_id: string | null;
  user_id: string;
  source: JobSource;
  source_url: string;
  external_apply_url: string | null;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  job_type: JobType;
  about_role: string | null;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  about_company: string | null;
  match_score: number;
  match_reason: string | null;
  matched_skills: string[];
  missing_skills: string[];
  company_research: CompanyResearchDossier | null;
  found_at: string;
  created_at: string;
  updated_at: string;
}

export type LogLevel = "info" | "success" | "warning" | "error";

export interface AgentLog {
  id: string;
  run_id: string;
  user_id: string;
  message: string;
  level: LogLevel;
  job_id: string | null;
  created_at: string;
}
