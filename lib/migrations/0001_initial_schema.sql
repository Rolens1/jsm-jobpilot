-- Migration: 0001_initial_schema.sql
-- Description: Core database schema for JobPilot (profiles, agent_runs, jobs, agent_logs, RLS)
-- Target: InsForge PostgreSQL

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text NOT NULL,
  phone text,
  location text,
  current_title text,
  experience_level text CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead')),
  years_experience integer DEFAULT 0,
  skills text[] DEFAULT '{}',
  industries text[] DEFAULT '{}',
  work_experience jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '[]'::jsonb,
  job_titles_seeking text[] DEFAULT '{}',
  remote_preference text DEFAULT 'any' CHECK (remote_preference IN ('remote', 'onsite', 'hybrid', 'any')),
  preferred_locations text[] DEFAULT '{}',
  salary_expectation text,
  cover_letter_tone text DEFAULT 'enthusiastic' CHECK (cover_letter_tone IN ('formal', 'casual', 'enthusiastic')),
  linkedin_url text,
  portfolio_url text,
  work_authorization text DEFAULT 'citizen' CHECK (work_authorization IN ('citizen', 'permanent_resident', 'visa_required')),
  resume_pdf_url text,
  is_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Trigger for profiles updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-provision profile on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.profile->>'full_name', NEW.profile->>'name', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Agent Runs Table
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  job_title_searched text NOT NULL,
  location_searched text,
  jobs_found integer DEFAULT 0,
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON public.agent_runs(started_at DESC);

-- 3. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('search', 'url')),
  source_url text NOT NULL,
  external_apply_url text,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  salary text,
  job_type text DEFAULT 'fulltime' CHECK (job_type IN ('fulltime', 'parttime', 'contract')),
  about_role text,
  responsibilities text[] DEFAULT '{}',
  requirements text[] DEFAULT '{}',
  nice_to_have text[] DEFAULT '{}',
  benefits text[] DEFAULT '{}',
  about_company text,
  match_score integer DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  match_reason text,
  matched_skills text[] DEFAULT '{}',
  missing_skills text[] DEFAULT '{}',
  company_research jsonb,
  found_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT jobs_user_source_url_unique UNIQUE (user_id, source_url)
);

DROP TRIGGER IF EXISTS set_jobs_updated_at ON public.jobs;
CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_run_id ON public.jobs(run_id);
CREATE INDEX IF NOT EXISTS idx_jobs_match_score ON public.jobs(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_found_at ON public.jobs(found_at DESC);

-- 4. Agent Logs Table
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  level text DEFAULT 'info' CHECK (level IN ('info', 'success', 'warning', 'error')),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_run_id ON public.agent_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON public.agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON public.agent_logs(created_at ASC);

-- 5. Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Own user only
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Agent Runs: Own user only
DROP POLICY IF EXISTS "agent_runs_select_policy" ON public.agent_runs;
CREATE POLICY "agent_runs_select_policy" ON public.agent_runs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "agent_runs_insert_policy" ON public.agent_runs;
CREATE POLICY "agent_runs_insert_policy" ON public.agent_runs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "agent_runs_update_policy" ON public.agent_runs;
CREATE POLICY "agent_runs_update_policy" ON public.agent_runs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "agent_runs_delete_policy" ON public.agent_runs;
CREATE POLICY "agent_runs_delete_policy" ON public.agent_runs FOR DELETE USING (auth.uid() = user_id);

-- Jobs: Authenticated can view all; mutate own only
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
CREATE POLICY "jobs_select_policy" ON public.jobs FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "jobs_insert_policy" ON public.jobs;
CREATE POLICY "jobs_insert_policy" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "jobs_update_policy" ON public.jobs;
CREATE POLICY "jobs_update_policy" ON public.jobs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "jobs_delete_policy" ON public.jobs;
CREATE POLICY "jobs_delete_policy" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- Agent Logs: Own user only
DROP POLICY IF EXISTS "agent_logs_select_policy" ON public.agent_logs;
CREATE POLICY "agent_logs_select_policy" ON public.agent_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "agent_logs_insert_policy" ON public.agent_logs;
CREATE POLICY "agent_logs_insert_policy" ON public.agent_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "agent_logs_update_policy" ON public.agent_logs;
CREATE POLICY "agent_logs_update_policy" ON public.agent_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "agent_logs_delete_policy" ON public.agent_logs;
CREATE POLICY "agent_logs_delete_policy" ON public.agent_logs FOR DELETE USING (auth.uid() = user_id);
