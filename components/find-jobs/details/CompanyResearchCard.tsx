"use client";

import React, { useState } from "react";
import { Job, CompanyResearchDossier } from "@/types/database";
import {
  Building2,
  Sparkles,
  Layers,
  Users2,
  MessageSquare,
  Compass,
  Loader2,
  RefreshCw,
  Target,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface CompanyResearchCardProps {
  job: Job;
}

export function CompanyResearchCard({ job }: CompanyResearchCardProps) {
  const { dict } = useTranslation();
  const [dossier, setDossier] = useState<CompanyResearchDossier | null>(
    job.company_research || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("Initializing research agent...");
  const [error, setError] = useState<string | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleResearchCompany = async () => {
    setIsLoading(true);
    setError(null);
    setConfirmRefresh(false);
    setLoadingStep("Deriving company website and public footprint...");

    // Simulated step indicators while background agent runs
    const timer1 = setTimeout(() => {
      if (isMountedRef.current) {
        setLoadingStep("Extracting company product, tech stack, and mission...");
      }
    }, 1200);

    const timer2 = setTimeout(() => {
      if (isMountedRef.current) {
        setLoadingStep("Synthesizing candidate specific interview briefing...");
      }
    }, 2800);

    try {
      const response = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to research company.");
      }

      if (isMountedRef.current) {
        setDossier(data.dossier);
      }
    } catch (err) {
      console.error("[CompanyResearchCard] Research error:", err);
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to research company. Please try again."
        );
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleRefreshClick = () => {
    if (!confirmRefresh) {
      setConfirmRefresh(true);
      setTimeout(() => {
        if (isMountedRef.current) {
          setConfirmRefresh(false);
        }
      }, 4000);
      return;
    }
    handleResearchCompany();
  };

  // 1. Loading State View
  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-8 sm:p-10 shadow-sm relative overflow-hidden text-left animate-in fade-in duration-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

        <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
          <div className="w-16 h-16 rounded-2xl bg-accent-muted border border-border flex items-center justify-center text-accent mb-6 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>

          <span className="bg-accent/15 border border-accent/30 text-accent text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            Company Intelligence Agent
          </span>

          <h3 className="text-xl font-bold text-text-primary tracking-tight">
            Investigating {job.company}
          </h3>

          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            {loadingStep}
          </p>

          <div className="w-full max-w-xs mt-6 bg-surface-secondary rounded-full h-1.5 overflow-hidden border border-border/60">
            <div className="h-full bg-accent rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Completed Dossier View
  if (dossier) {
    const overviewText = dossier.companyOverview || dossier.overview || "";
    const techStackList = Array.isArray(dossier.techStack) ? dossier.techStack : [];
    const cultureList = Array.isArray(dossier.culture)
      ? dossier.culture
      : typeof dossier.culture === "string"
      ? [dossier.culture]
      : [];
    const edgeList = Array.isArray(dossier.yourEdge) ? dossier.yourEdge : [];
    const gapsList = Array.isArray(dossier.gapsToAddress) ? dossier.gapsToAddress : [];
    const questionsList = Array.isArray(dossier.smartQuestions) ? dossier.smartQuestions : [];
    const prepList = Array.isArray(dossier.interviewPrep)
      ? dossier.interviewPrep
      : Array.isArray(dossier.interviewTips)
      ? dossier.interviewTips
      : [];
    const sourcesList = Array.isArray(dossier.sources) ? dossier.sources : [];

    return (
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm relative overflow-hidden text-left space-y-8 animate-in fade-in duration-300">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

        {/* Dossier Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent-muted border border-border flex items-center justify-center text-accent shrink-0 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                  {dict.jobDetails.researchTitle}
                </h2>
                <span className="bg-success-lightest border border-success/30 text-success-dark text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Verified Analysis
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                {dict.jobDetails.researchSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshClick}
            aria-label="Refresh Research"
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer self-start sm:self-center shrink-0 active:scale-[0.99] ${
              confirmRefresh
                ? "bg-accent/15 border-accent text-accent font-semibold"
                : "border-border bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text-primary"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${confirmRefresh ? "text-accent animate-spin" : "text-accent"}`} />
            <span>{confirmRefresh ? dict.jobDetails.refreshResearchConfirm : dict.jobDetails.refreshResearch}</span>
          </button>
        </div>

        {/* Section 1: Company Overview & Strategic Role Mission */}
        <div className="space-y-4 relative z-10">
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-accent" />
              <span>{dict.jobDetails.overviewLabel}</span>
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">
              {overviewText || `${job.company} operates as an established market player in this sector.`}
            </p>
          </div>

          {dossier.whyThisRole && (
            <div className="p-4 sm:p-5 rounded-xl bg-surface-secondary/70 border border-border flex items-start gap-3.5">
              <Target className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  {dict.jobDetails.whyThisRoleLabel}
                </h4>
                <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
                  {dossier.whyThisRole}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Your Unique Edge vs Constructive Gap Strategy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
          {/* Your Edge */}
          <div className="p-5 rounded-xl bg-success-lightest border border-success/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-success-dark shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-success-dark uppercase tracking-wider">
                  {dict.jobDetails.yourEdgeLabel}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {edgeList.map((edge, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-text-primary flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                    <span>{edge}</span>
                  </li>
                ))}
              </ul>
            </div>
            <span className="text-[11px] text-success-dark font-medium mt-4 block">
              Grounded candidate strengths
            </span>
          </div>

          {/* Constructive Gap Strategy */}
          <div className="p-5 rounded-xl bg-warning-lightest border border-warning/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-warning-dark shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-warning-dark uppercase tracking-wider">
                  {dict.jobDetails.gapsLabel}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {gapsList.map((gap, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-text-primary flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
            <span className="text-[11px] text-warning-dark font-medium mt-4 block">
              Proactive interview framing
            </span>
          </div>
        </div>

        {/* Section 3: Tech Stack & Team Culture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 relative z-10">
          {/* Tech Stack */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" />
              <span>{dict.jobDetails.techStackLabel}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {techStackList.map((tech, idx) => (
                <span
                  key={idx}
                  className="bg-surface-secondary border border-border text-text-primary text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>{tech}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Team Culture */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-accent" />
              <span>{dict.jobDetails.cultureLabel}</span>
            </h3>
            <ul className="space-y-2">
              {cultureList.map((item, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-text-secondary flex items-start gap-2 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-border-strong mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 4: Interview Prep & Smart Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 relative z-10">
          {/* Interview Prep Talking Points */}
          <div className="p-5 rounded-xl bg-surface-secondary/50 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-accent shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wider">
                  {dict.jobDetails.interviewPrepLabel}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {prepList.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-text-secondary flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Smart Questions to Ask */}
          <div className="p-5 rounded-xl bg-surface-secondary/50 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-accent shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wider">
                  {dict.jobDetails.smartQuestionsLabel}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {questionsList.map((question, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-text-secondary flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>&ldquo;{question}&rdquo;</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 5: Sources Consulted Footer */}
        {sourcesList.length > 0 && (
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span>{dict.jobDetails.sourcesLabel}:</span>
              {sourcesList.map((source, idx) => (
                <a
                  key={idx}
                  href={source.startsWith("http") ? source : `https://${source}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-text-secondary hover:text-accent underline underline-offset-2 transition-colors"
                >
                  <span>{source.replace(/^https?:\/\/(www\.)?/, "")}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
            {dossier.extractedAt && (
              <span>Researched on {new Date(dossier.extractedAt).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. Initial Empty State View (Ready to research)
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm relative overflow-hidden text-left">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-muted border border-border flex items-center justify-center text-accent shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                {dict.jobDetails.researchTitle}
              </h2>
              <span className="bg-accent/15 border border-accent/30 text-accent text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Autonomous Agent
              </span>
              <span className="bg-surface-secondary border border-border text-text-muted text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                Quota: 3 / 10 min
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              {dict.jobDetails.researchSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={handleResearchCompany}
          aria-label="Research Company"
          className="bg-accent hover:bg-accent-dark text-accent-foreground font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer transition-all shrink-0 self-start sm:self-center shadow-sm active:scale-[0.99]"
        >
          <Sparkles className="w-4 h-4" />
          <span>{dict.jobDetails.researchButton}</span>
        </button>
      </div>

      {/* Error or Rate Limit Banner */}
      {error && (() => {
        const isRateLimited = error.toLowerCase().includes("rate limit");
        return (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-start sm:items-center justify-between gap-3 relative z-10 animate-in fade-in duration-200 ${
              isRateLimited
                ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium"
                : "bg-error/10 border-error/20 text-error text-xs sm:text-sm font-medium"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              {isRateLimited ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                {isRateLimited && (
                  <span className="inline-block self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Demo Quota Guard
                  </span>
                )}
                <span>{error}</span>
              </div>
            </div>
            {!isRateLimited && (
              <button
                onClick={handleResearchCompany}
                className="underline hover:opacity-80 cursor-pointer font-semibold shrink-0"
              >
                {dict.common.retry}
              </button>
            )}
          </div>
        );
      })()}

      {/* 4 Preview Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Pillar 1 */}
        <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border/80 flex flex-col justify-between gap-3">
          <div className="flex items-center gap-2 text-text-primary">
            <Compass className="w-4 h-4 text-accent shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold">{dict.jobDetails.companyMissionCulture}</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Market positioning, core business model, key customer segments, and strategic roadmap.
          </p>
          <span className="text-[11px] text-text-muted font-medium mt-auto">
            Automated domain extraction
          </span>
        </div>

        {/* Pillar 2 */}
        <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border/80 flex flex-col justify-between gap-3">
          <div className="flex items-center gap-2 text-text-primary">
            <Layers className="w-4 h-4 text-accent shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold">{dict.jobDetails.techStackEngineering}</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Infrastructure, frontend frameworks, APIs, and cloud services detected in active production.
          </p>
          <span className="text-[11px] text-text-muted font-medium mt-auto">
            Engineering stack scan
          </span>
        </div>

        {/* Pillar 3 */}
        <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border/80 flex flex-col justify-between gap-3">
          <div className="flex items-center gap-2 text-text-primary">
            <Users2 className="w-4 h-4 text-accent shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold">{dict.jobDetails.leadershipKeyPeople}</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Work cadence, remote culture, engineering autonomy, and team leadership values.
          </p>
          <span className="text-[11px] text-text-muted font-medium mt-auto">
            Cultural footprint analysis
          </span>
        </div>

        {/* Pillar 4 */}
        <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border/80 flex flex-col justify-between gap-3">
          <div className="flex items-center gap-2 text-text-primary">
            <MessageSquare className="w-4 h-4 text-accent shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold">{dict.jobDetails.interviewPrepQuestions}</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Tailored questions to ask interviewers and strategic role answers highlighting your matched skills.
          </p>
          <span className="text-[11px] text-text-muted font-medium mt-auto">
            AI interview briefing
          </span>
        </div>
      </div>
    </div>
  );
}
