import Link from "next/link";
import { AlertCircle, CheckCircle2, Search, ArrowRight } from "lucide-react";

type Props = {
  percentage?: number;
  missingFields?: string[];
};

export function ProfileAttentionBanner({
  percentage = 70,
  missingFields = ["PHONE", "LOCATION", "EDUCATION"],
}: Props) {
  const isComplete = percentage >= 100 || missingFields.length === 0;

  // SVG Circular progress ring calculations
  const size = 96;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <section
      aria-label="Profile Status"
      className="w-full bg-surface rounded-2xl border border-border p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      {/* Left Text & Chips */}
      <div className="flex-1">
        <div className="flex items-center gap-2 text-text-primary">
          {isComplete ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <h2 className="text-lg font-bold tracking-tight">
                Profile is complete!
              </h2>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-error shrink-0" />
              <h2 className="text-lg font-bold tracking-tight">
                Profile needs attention
              </h2>
            </>
          )}
        </div>

        <p className="text-xs sm:text-sm text-text-secondary mt-1.5 max-w-xl leading-relaxed">
          {isComplete
            ? "Great job! All required fields and your resume are saved. The JobPilot agent can now discover matching roles and tailor your documents."
            : "Complete the missing fields to improve your chance of getting tailored matches and generating quality resumes."}
        </p>

        {isComplete && (
          <div className="mt-4">
            <Link
              href="/find-jobs"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent-dark transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore matching jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {!isComplete && missingFields.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {missingFields.map((field) => (
              <span
                key={field}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase bg-error/10 text-error border border-error/20"
              >
                {field}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right Progress Ring */}
      <div className="flex items-center justify-center shrink-0 self-center sm:self-auto">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-border-light"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Active Progress Stroke */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={`${
                isComplete ? "stroke-success" : "stroke-error"
              } transition-all duration-500 ease-out`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-xl sm:text-2xl font-bold text-text-primary">
            {percentage}%
          </span>
        </div>
      </div>
    </section>
  );
}
