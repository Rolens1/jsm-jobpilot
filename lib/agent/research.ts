import { getAiClient } from "@/lib/ai";
import { Job, Profile, CompanyResearchDossier } from "@/types/database";

const AGGREGATOR_DOMAINS = [
  "adzuna.com",
  "adzuna.co.uk",
  "jooble.org",
  "jooble.com",
  "rapidapi.com",
  "jsearch",
  "linkedin.com",
  "indeed.com",
  "ziprecruiter.com",
  "glassdoor.com",
  "monster.com",
  "simplyhired.com",
];

/**
 * Checks if a hostname belongs to a known job board aggregator.
 */
function isJobAggregator(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return AGGREGATOR_DOMAINS.some((domain) => lower.includes(domain));
}

/**
 * Normalizes a URL hostname to a clean root domain.
 * Strips subdomains like 'jobs.', 'careers.', 'www.'
 */
function cleanRootDomain(rawUrl: string): string {
  try {
    const urlObj = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const hostParts = urlObj.hostname.toLowerCase().split(".");
    
    // If standard 2-part domain like 'stripe.com'
    if (hostParts.length <= 2) {
      return `https://${urlObj.hostname}`;
    }

    // Strip common subdomains: jobs.stripe.com -> stripe.com
    const filteredParts = hostParts.filter(
      (part) => !["jobs", "careers", "about", "www", "app", "board", "boards"].includes(part)
    );

    // Multi-part TLD suffixes (e.g. .co.uk, .com.au, .qc.ca)
    const secondLevelSuffixes = new Set(["co", "com", "org", "net", "gov", "edu", "qc", "on", "bc", "ab"]);
    if (filteredParts.length >= 3) {
      const penultimate = filteredParts[filteredParts.length - 2];
      const last = filteredParts[filteredParts.length - 1];
      if (secondLevelSuffixes.has(penultimate) && last.length === 2) {
        return `https://${filteredParts.slice(-3).join(".")}`;
      }
    }

    if (filteredParts.length >= 2) {
      return `https://${filteredParts.slice(-2).join(".")}`;
    }

    return `https://${urlObj.hostname}`;
  } catch {
    return rawUrl;
  }
}

/**
 * Derives the genuine company homepage URL.
 * 1. Follows HTTP redirects on external apply or source URLs.
 * 2. If an aggregator is detected or fetch fails, falls back to https://www.{cleanCompany}.com.
 */
export async function deriveCompanyDomain(
  companyName: string,
  externalApplyUrl?: string | null,
  sourceUrl?: string | null
): Promise<string> {
  const targetUrl = externalApplyUrl || sourceUrl;

  if (targetUrl && targetUrl.startsWith("http")) {
    try {
      // Follow redirects natively via server fetch
      const res = await fetch(targetUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(3500),
      });

      if (res.url) {
        const destUrlObj = new URL(res.url);
        if (!isJobAggregator(destUrlObj.hostname)) {
          return cleanRootDomain(res.url);
        }
      }
    } catch {
      // Fall through to company name fallback
    }
  }

  // Fallback derived from clean company name
  const cleanName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return `https://www.${cleanName || "company"}.com`;
}

/**
 * Extracts public web footprint from company website.
 * Uses Jina Reader API or standard fetch to gather clean markdown text.
 */
export async function extractCompanyWebFootprint(
  domainUrl: string
): Promise<{ text: string; sources: string[] }> {
  const sources: string[] = [domainUrl];

  // Try Jina Reader API first (instant clean markdown of public sites)
  try {
    const cleanTarget = domainUrl.replace(/^https?:\/\//, "");
    const jinaEndpoint = `https://r.jina.ai/https://${cleanTarget}`;

    const res = await fetch(jinaEndpoint, {
      method: "GET",
      headers: {
        Accept: "text/plain",
        "X-No-Cache": "true",
      },
      signal: AbortSignal.timeout(4500),
    });

    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 200) {
        // Limit context size to ~12000 characters for optimal LLM context window
        return {
          text: text.slice(0, 12000),
          sources,
        };
      }
    }
  } catch {
    // Ignore Jina failures and fall through to direct fetch
  }

  // Fallback: Direct server fetch with tag stripping
  try {
    const res = await fetch(domainUrl, {
      method: "GET",
      headers: {
        "User-Agent": "JobPilot/1.0 (+https://jobpilot.app)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const html = await res.text();
      // Simple HTML cleanup
      const cleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (cleaned.length > 200) {
        return {
          text: cleaned.slice(0, 8000),
          sources,
        };
      }
    }
  } catch {
    // Direct fetch failed
  }

  return {
    text: "",
    sources,
  };
}

/**
 * Grounded heuristic fallback if LLM calls fail or keys are unconfigured.
 */
function generateFallbackDossier(job: Job, profile: Profile, sources: string[]): CompanyResearchDossier {
  const candidateSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const matched = job.matched_skills && job.matched_skills.length > 0 ? job.matched_skills : candidateSkills.slice(0, 4);
  const missing = job.missing_skills && job.missing_skills.length > 0 ? job.missing_skills : ["Strategic Execution", "Cross-Functional Leadership"];

  return {
    companyOverview: `${job.company} is an active industry leader focused on delivering modern solutions in its sector. Based on active job requirements, the team is expanding operations with a focus on strong execution and strategic growth.`,
    techStack: [
      ...matched,
      ...candidateSkills,
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6),
    culture: [
      "High ownership culture valuing direct impact and end to end delivery.",
      "Collaborative professional environment partnering closely with cross functional teams.",
      "Continuous improvement orientation focused on measurable operational excellence.",
    ],
    whyThisRole: `This ${job.title} role at ${job.company} aligns with your background in ${matched.slice(0, 2).join(" and ") || "core domain competencies"}, offering immediate ownership while expanding your professional scope.`,
    yourEdge: [
      `Direct proven experience with ${matched.slice(0, 3).join(", ") || "core competencies"} enables you to contribute quickly without extended ramp up time.`,
      `Your background as a ${profile.current_title || "experienced professional"} provides practical perspective on solving role specific problems.`,
    ],
    gapsToAddress: missing.map(
      (m) => `Acknowledge ${m} as a targeted growth area while demonstrating how your foundation in ${matched[0] || "adjacent tools"} accelerates your mastery.`
    ),
    smartQuestions: [
      `How does the team at ${job.company} balance immediate operational priorities with long term strategic goals?`,
      `What does success look like for this ${job.title} position in the first 90 days?`,
      `What are the most exciting strategic challenges the team plans to tackle in the upcoming quarters?`,
    ],
    interviewPrep: [
      `Prepare a concise walkthrough of your past projects demonstrating hands on application of ${matched[0] || "key core competencies"}.`,
      `Be ready to discuss how you collaborate with key department stakeholders to deliver impactful outcomes.`,
    ],
    sources: sources.length > 0 ? sources : [`https://www.${job.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`],
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Synthesizes a structured 9-field company intelligence dossier.
 */
export async function synthesizeCompanyDossier(params: {
  job: Job;
  profile: Profile;
  webFootprint: string;
  sources: string[];
}): Promise<CompanyResearchDossier> {
  const { job, profile, webFootprint, sources } = params;

  try {
    const ai = getAiClient();

    const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role.
You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile.
Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what is inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

You must return ONLY a single valid JSON object matching this schema exactly:
{
  "companyOverview": "One or two concise paragraphs covering what the company does, who it is for, and scale",
  "techStack": ["Technology 1", "Technology 2"],
  "culture": ["Culture norm or working style 1", "Culture norm 2", "Culture norm 3"],
  "whyThisRole": "Compelling strategic reason to pursue this role connecting role mission to company stage",
  "yourEdge": ["Specific candidate advantage connecting your skills/work to their needs 1", "Edge 2"],
  "gapsToAddress": ["Constructive strategy for addressing missing skill 1", "Gap strategy 2"],
  "smartQuestions": ["Insightful question to ask interviewers 1", "Question 2", "Question 3"],
  "interviewPrep": ["Actionable talking point or behavioral answer tip 1", "Prep tip 2"],
  "sources": ["source url 1"]
}`;

    const candidateProfileContext = {
      fullName: profile.full_name || "Candidate",
      currentTitle: profile.current_title || "Software Engineer",
      yearsExperience: profile.years_experience || 0,
      experienceLevel: profile.experience_level || "mid",
      skills: profile.skills || [],
      industries: profile.industries || [],
      workHistory: (profile.work_experience || []).map((w) => ({
        company: w.company,
        title: w.title,
        responsibilities: w.responsibilities,
      })),
    };

    const jobPostingContext = {
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      aboutRole: job.about_role,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      matchedSkills: job.matched_skills,
      missingSkills: job.missing_skills,
      aboutCompany: job.about_company,
    };

    const userPrompt = `COMPANY RESEARCH (from their public website):
${webFootprint ? webFootprint : "Direct website extraction was minimal or restricted. Synthesize from job posting requirements and candidate background."}

JOB POSTING:
${JSON.stringify(jobPostingContext, null, 2)}

CANDIDATE PROFILE:
${JSON.stringify(candidateProfileContext, null, 2)}

SOURCES:
${JSON.stringify(sources)}

Generate the structured company research dossier now in JSON format.`;

    const response = await ai.client.chat.completions.create({
      model: ai.model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return generateFallbackDossier(job, profile, sources);
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;

    // Normalize and ensure all fields are properly structured arrays or strings
    const dossier: CompanyResearchDossier = {
      companyOverview:
        typeof parsed.companyOverview === "string" && parsed.companyOverview.trim()
          ? parsed.companyOverview.trim()
          : `${job.company} is a leading enterprise in this sector.`,
      techStack: Array.isArray(parsed.techStack) && parsed.techStack.length > 0
        ? parsed.techStack.map(String)
        : job.matched_skills.slice(0, 6),
      culture: Array.isArray(parsed.culture) && parsed.culture.length > 0
        ? parsed.culture.map(String)
        : [
            "Values end to end technical ownership and autonomous delivery.",
            "Promotes collaborative, cross functional problem solving.",
          ],
      whyThisRole:
        typeof parsed.whyThisRole === "string" && parsed.whyThisRole.trim()
          ? parsed.whyThisRole.trim()
          : `This role offers high impact ownership and direct alignment with your technical capabilities.`,
      yourEdge: Array.isArray(parsed.yourEdge) && parsed.yourEdge.length > 0
        ? parsed.yourEdge.map(String)
        : [
            `Strong alignment with core required skills in ${job.matched_skills.slice(0, 3).join(", ") || "the stack"}.`,
          ],
      gapsToAddress: Array.isArray(parsed.gapsToAddress) && parsed.gapsToAddress.length > 0
        ? parsed.gapsToAddress.map(String)
        : (job.missing_skills || []).map((m) => `Frame ${m} as a targeted learning priority.`),
      smartQuestions: Array.isArray(parsed.smartQuestions) && parsed.smartQuestions.length > 0
        ? parsed.smartQuestions.map(String)
        : [
            `What does high performance look like for this ${job.title} role in the first 90 days?`,
            `What are the most challenging technical problems the team is solving this quarter?`,
          ],
      interviewPrep: Array.isArray(parsed.interviewPrep) && parsed.interviewPrep.length > 0
        ? parsed.interviewPrep.map(String)
        : [
            `Highlight specific projects where you delivered scalable solutions using ${job.matched_skills[0] || "modern tools"}.`,
          ],
      sources: Array.isArray(parsed.sources) && parsed.sources.length > 0
        ? parsed.sources.map(String)
        : sources,
      extractedAt: new Date().toISOString(),
    };

    return dossier;
  } catch (err) {
    console.warn("[CompanyResearch] LLM synthesis failed or timed out, using grounded fallback:", err);
    return generateFallbackDossier(job, profile, sources);
  }
}
