export interface StatMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    label: string;
    direction: "up" | "down";
  };
  subtitle?: string;
}

export interface ActivityEvent {
  id: string;
  title: string;
  timestamp: string;
  type: "job_search" | "company_research";
  dotColor: "accent" | "info" | "success";
}

export interface DailyCountPoint {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  count: number;
}

export interface ScoreDistributionBucket {
  range: "50-60%" | "60-70%" | "70-80%" | "80-90%" | "90-100%";
  count: number;
}

export interface DashboardData {
  stats: StatMetric[];
  recentActivity: ActivityEvent[];
  companyResearchActivity: DailyCountPoint[];
  jobsFoundTimeline: DailyCountPoint[];
  matchScoreDistribution: ScoreDistributionBucket[];
}

export const DASHBOARD_MOCK_DATA: DashboardData = {
  stats: [
    {
      id: "total-jobs",
      label: "Total Jobs Found",
      value: "284",
      trend: {
        value: "+12%",
        label: "vs last week",
        direction: "up",
      },
    },
    {
      id: "avg-match-rate",
      label: "Avg. Match Rate",
      value: "82%",
      trend: {
        value: "+3%",
        label: "vs last week",
        direction: "up",
      },
    },
    {
      id: "companies-researched",
      label: "Companies Researched",
      value: "35",
      subtitle: "Total researched",
    },
    {
      id: "jobs-this-week",
      label: "Jobs This Week",
      value: "28",
      subtitle: "New this week",
    },
  ],
  recentActivity: [
    {
      id: "act-1",
      title: "Found 8 jobs for Frontend Engineer",
      timestamp: "10 mins ago",
      type: "job_search",
      dotColor: "accent",
    },
    {
      id: "act-2",
      title: "Researched Stripe",
      timestamp: "1 hour ago",
      type: "company_research",
      dotColor: "info",
    },
    {
      id: "act-3",
      title: "Found 12 jobs for React Developer",
      timestamp: "2 hours ago",
      type: "job_search",
      dotColor: "success",
    },
    {
      id: "act-4",
      title: "Researched Vercel",
      timestamp: "Yesterday",
      type: "company_research",
      dotColor: "accent",
    },
    {
      id: "act-5",
      title: "Found 10 jobs for Full Stack Engineer",
      timestamp: "Yesterday",
      type: "job_search",
      dotColor: "success",
    },
  ],
  companyResearchActivity: [
    { day: "Mon", count: 2 },
    { day: "Tue", count: 5 },
    { day: "Wed", count: 3 },
    { day: "Thu", count: 8 },
    { day: "Fri", count: 12 },
    { day: "Sat", count: 4 },
    { day: "Sun", count: 1 },
  ],
  jobsFoundTimeline: [
    { day: "Mon", count: 12 },
    { day: "Tue", count: 40 },
    { day: "Wed", count: 32 },
    { day: "Thu", count: 65 },
    { day: "Fri", count: 88 },
    { day: "Sat", count: 42 },
    { day: "Sun", count: 18 },
  ],
  matchScoreDistribution: [
    { range: "50-60%", count: 5 },
    { range: "60-70%", count: 15 },
    { range: "70-80%", count: 45 },
    { range: "80-90%", count: 85 },
    { range: "90-100%", count: 35 },
  ],
};
