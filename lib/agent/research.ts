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
/**
 * Grounded heuristic fallback if LLM calls fail or keys are unconfigured.
 */
function generateFallbackDossier(
  job: Job,
  profile: Profile,
  sources: string[],
  isFr = false
): CompanyResearchDossier {
  const candidateSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const matched = job.matched_skills && job.matched_skills.length > 0 ? job.matched_skills : candidateSkills.slice(0, 4);
  const missing = job.missing_skills && job.missing_skills.length > 0 ? job.missing_skills : ["Strategic Execution", "Cross-Functional Leadership"];

  if (isFr) {
    return {
      companyOverview: `${job.company} est une entreprise active et reconnue dans son secteur. D'après les exigences du poste, l'équipe développe ses opérations avec un accent fort sur l'excellence d'exécution et la croissance stratégique.`,
      techStack: [
        ...matched,
        ...candidateSkills,
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6),
      culture: [
        "Culture de responsabilisation valorisant l'impact direct et la réalisation de bout en bout.",
        "Environnement collaboratif travaillant en étroite synergie avec des équipes pluridisciplinaires.",
        "Orientation vers l'amélioration continue axée sur des résultats opérationnels mesurables.",
      ],
      whyThisRole: `Ce poste de ${job.title} chez ${job.company} correspond à votre profil en ${matched.slice(0, 2).join(" et ") || "compétences clés"}, offrant une responsabilité immédiate tout en élargissant votre champ professionnel.`,
      yourEdge: [
        `Votre expérience pratique avec ${matched.slice(0, 3).join(", ") || "vos compétences maîtresses"} vous permet d'être opérationnel rapidement sans période d'adaptation prolongée.`,
        `Votre parcours en tant que ${profile.current_title || "professionnel expérimenté"} apporte une perspective concrète pour résoudre les défis spécifiques du poste.`,
      ],
      gapsToAddress: missing.map(
        (m) => `Présentez ${m} comme un axe d'apprentissage ciblé en montrant comment votre maîtrise de ${matched[0] || "technologies connexes"} accélère votre montée en compétence.`
      ),
      smartQuestions: [
        `Comment l'équipe chez ${job.company} équilibre-t-elle les priorités opérationnelles immédiates et les objectifs stratégiques à long terme ?`,
        `Quels sont les indicateurs clés de succès pour ce poste de ${job.title} au cours des 90 premiers jours ?`,
        `Quels défis stratégiques majeurs l'équipe prévoit-elle de relever au cours des prochains trimestres ?`,
      ],
      interviewPrep: [
        `Préparez une présentation concise de vos réalisations passées démontrant l'application concrète de ${matched[0] || "vos compétences clés"}.`,
        `Soyez prêt à illustrer comment vous collaborez avec les parties prenantes pour produire des résultats mesurables.`,
      ],
      sources: sources.length > 0 ? sources : [`https://www.${job.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`],
      extractedAt: new Date().toISOString(),
    };
  }

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
  locale?: "en" | "fr";
}): Promise<CompanyResearchDossier> {
  const { job, profile, webFootprint, sources, locale } = params;
  const activeLocale = locale || (profile.preferred_language === "fr" ? "fr" : "en");
  const isFr = activeLocale === "fr";

  try {
    const ai = getAiClient();

    const languageInstruction = isFr
      ? `LANGUAGE REQUIREMENT (CRITICAL):
- The candidate's chosen language is French ('fr').
- You MUST generate all narrative sections ('companyOverview', 'culture', 'whyThisRole', 'yourEdge', 'gapsToAddress', 'smartQuestions', 'interviewPrep') entirely in fluent, elegant, and professional French.
- Tech stack items should remain exact industry names (e.g. Next.js, Python, PostgreSQL, AWS).`
      : `LANGUAGE REQUIREMENT:
- The candidate's chosen language is English ('en'). Generate all narrative sections in clear, concise English.`;

    const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role.
You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile.
Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what is inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

${languageInstruction}

You must return ONLY a single valid JSON object matching this schema exactly:
{
  "companyOverview": "${isFr ? "Un ou deux paragraphes concis expliquant les activités de l'entreprise..." : "One or two concise paragraphs covering what the company does, who it is for, and scale"}",
  "techStack": ["Technology 1", "Technology 2"],
  "culture": ["${isFr ? "Norme culturelle 1" : "Culture norm or working style 1"}", "${isFr ? "Norme 2" : "Culture norm 2"}"],
  "whyThisRole": "${isFr ? "Raison stratégique convaincante de cibler ce poste..." : "Compelling strategic reason to pursue this role connecting role mission to company stage"}",
  "yourEdge": ["${isFr ? "Avantage spécifique du candidat reliant ses compétences aux besoins de l'entreprise" : "Specific candidate advantage connecting your skills/work to their needs 1"}"],
  "gapsToAddress": ["${isFr ? "Stratégie constructive pour aborder une compétence manquante" : "Constructive strategy for addressing missing skill 1"}"],
  "smartQuestions": ["${isFr ? "Question pertinente à poser aux recruteurs" : "Insightful question to ask interviewers 1"}"],
  "interviewPrep": ["${isFr ? "Point de discussion ou conseil pour l'entretien" : "Actionable talking point or behavioral answer tip 1"}"],
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

    const userPrompt = `Target Candidate Language: ${isFr ? "fr (French)" : "en (English)"}

COMPANY RESEARCH (from their public website):
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
      return generateFallbackDossier(job, profile, sources, isFr);
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;

    // Normalize and ensure all fields are properly structured arrays or strings
    const dossier: CompanyResearchDossier = {
      companyOverview:
        typeof parsed.companyOverview === "string" && parsed.companyOverview.trim()
          ? parsed.companyOverview.trim()
          : (isFr
              ? `${job.company} est un acteur de premier plan dans son secteur d'activité.`
              : `${job.company} is a leading enterprise in this sector.`),
      techStack: Array.isArray(parsed.techStack) && parsed.techStack.length > 0
        ? parsed.techStack.map(String)
        : job.matched_skills.slice(0, 6),
      culture: Array.isArray(parsed.culture) && parsed.culture.length > 0
        ? parsed.culture.map(String)
        : (isFr
            ? [
                "Valorise la responsabilité technique de bout en bout et l'autonomie.",
                "Favorise la résolution collaborative et transversale des problèmes.",
              ]
            : [
                "Values end to end technical ownership and autonomous delivery.",
                "Promotes collaborative, cross functional problem solving.",
              ]),
      whyThisRole:
        typeof parsed.whyThisRole === "string" && parsed.whyThisRole.trim()
          ? parsed.whyThisRole.trim()
          : (isFr
              ? `Ce poste offre un impact direct et un alignement étroit avec vos compétences techniques.`
              : `This role offers high impact ownership and direct alignment with your technical capabilities.`),
      yourEdge: Array.isArray(parsed.yourEdge) && parsed.yourEdge.length > 0
        ? parsed.yourEdge.map(String)
        : [
            isFr
              ? `Fort alignement avec les compétences clés en ${job.matched_skills.slice(0, 3).join(", ") || "le domaine requis"}.`
              : `Strong alignment with core required skills in ${job.matched_skills.slice(0, 3).join(", ") || "the stack"}.`,
          ],
      gapsToAddress: Array.isArray(parsed.gapsToAddress) && parsed.gapsToAddress.length > 0
        ? parsed.gapsToAddress.map(String)
        : (job.missing_skills || []).map((m) =>
            isFr ? `Positionnez ${m} comme une priorité d'apprentissage ciblée.` : `Frame ${m} as a targeted learning priority.`
          ),
      smartQuestions: Array.isArray(parsed.smartQuestions) && parsed.smartQuestions.length > 0
        ? parsed.smartQuestions.map(String)
        : (isFr
            ? [
                `Quels sont les objectifs prioritaires pour ce poste de ${job.title} lors des 90 premiers jours ?`,
                `Quels sont les défis techniques majeurs que l'équipe relève ce trimestre ?`,
              ]
            : [
                `What does high performance look like for this ${job.title} role in the first 90 days?`,
                `What are the most challenging technical problems the team is solving this quarter?`,
              ]),
      interviewPrep: Array.isArray(parsed.interviewPrep) && parsed.interviewPrep.length > 0
        ? parsed.interviewPrep.map(String)
        : [
            isFr
              ? `Mettez en valeur les projets récents où vous avez conçu des solutions évolutives avec ${job.matched_skills[0] || "des technologies modernes"}.`
              : `Highlight specific projects where you delivered scalable solutions using ${job.matched_skills[0] || "modern tools"}.`,
          ],
      sources: Array.isArray(parsed.sources) && parsed.sources.length > 0
        ? parsed.sources.map(String)
        : sources,
      extractedAt: new Date().toISOString(),
    };

    return dossier;
  } catch (err) {
    console.warn("[CompanyResearch] LLM synthesis failed or timed out, using grounded fallback:", err);
    return generateFallbackDossier(job, profile, sources, isFr);
  }
}
