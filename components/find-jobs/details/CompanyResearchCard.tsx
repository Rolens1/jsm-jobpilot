import React from "react";
import { Job } from "@/types/database";
import { Building2, Sparkles, Layers, Users2, MessageSquare, Compass } from "lucide-react";

interface CompanyResearchCardProps {
  job: Job;
}

export function CompanyResearchCard({ job }: CompanyResearchCardProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm relative overflow-hidden">
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
                Company Intelligence Dossier
              </h2>
              <span className="bg-accent/15 border border-accent/30 text-accent text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Feature 13 Preview
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Autonomous background research synthesized from {job.company}&apos;s public website and engineering footprint
            </p>
          </div>
        </div>

        <button
          disabled
          aria-label="Research Company"
          className="bg-accent/15 hover:bg-accent/20 border border-accent/30 text-accent font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-not-allowed transition-all shrink-0 self-start sm:self-center shadow-2xs opacity-90"
        >
          <Sparkles className="w-4 h-4 text-accent" />
          <span>Research Company</span>
        </button>
      </div>

      {/* 4 Preview Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Pillar 1 */}
        <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border/80 flex flex-col justify-between gap-3">
          <div className="flex items-center gap-2 text-text-primary">
            <Compass className="w-4 h-4 text-accent shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold">Company Mission</h3>
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
            <h3 className="text-xs sm:text-sm font-bold">Tech Stack</h3>
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
            <h3 className="text-xs sm:text-sm font-bold">Team & Culture</h3>
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
            <h3 className="text-xs sm:text-sm font-bold">Interview Prep</h3>
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
