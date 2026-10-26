import { getAiClient } from "@/lib/ai";
import { Profile } from "@/types/database";
import { UnifiedJob, ScoredJobMatch } from "./types";

interface BatchMatchItem {
  id: string;
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
}

/**
 * Deterministic fallback scoring if LLM calls fail or keys are unconfigured.
 * Matches profile skills, projects, and title against job description.
 */
function heuristicScoreJob(job: UnifiedJob, profile: Profile): ScoredJobMatch {
  const profileSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const candidateTitle = profile.current_title || "";
  const roleText = `${job.title} ${job.aboutRole}`.toLowerCase();
  const isHighSeniority = /senior|staff|lead|principal|director|head of/i.test(job.title);
  const isHighSalary = job.salary && /\$?(1[6-9]\d|2\d\d)k/i.test(job.salary);

  const matchedSkills: string[] = [];
  const potentialMissing: string[] = [];

  for (const skill of profileSkills) {
    if (roleText.includes(skill.toLowerCase())) {
      matchedSkills.push(skill);
    }
  }

  // Check for role-specific skills based on job content
  const isSoftwareRole = /developer|engineer|software|frontend|backend|fullstack|devops/i.test(`${job.title} ${candidateTitle}`);
  const domainSkills = isSoftwareRole
    ? ["react", "typescript", "node.js", "next.js", "python", "sql", "aws", "docker", "graphql", "system design"]
    : ["excel", "financial modeling", "budgeting", "forecasting", "variance analysis", "reporting", "sap", "power bi", "kpi tracking", "process optimization"];

  for (const skill of domainSkills) {
    if (roleText.includes(skill) && !profileSkills.some((s) => s.toLowerCase() === skill)) {
      potentialMissing.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  }

  // Calculate grounded score
  let score = 45;
  if (candidateTitle && roleText.includes(candidateTitle.toLowerCase())) {
    score += 15;
  }
  score += Math.min(matchedSkills.length * 6, 25);

  // Reality check: If candidate is junior or has under 2 years, cap senior/high salary roles
  const yearsExp = profile.years_experience || 0;
  const isJunior = profile.experience_level === "junior" || yearsExp < 2;

  if (isJunior && (isHighSeniority || isHighSalary)) {
    score = Math.min(score, 58);
    const reason = `Shows foundational skill alignment in ${matchedSkills.slice(0, 3).join(", ") || "core areas"}, but role scope and compensation reflect advanced strategic ownership and seniority.`;
    return {
      job,
      matchScore: score,
      matchReason: reason,
      matchedSkills,
      missingSkills: ["Senior Strategic Ownership", "Team Leadership", ...potentialMissing].slice(0, 3),
    };
  }

  score = Math.min(Math.max(score, 30), 92);
  const matchReason = matchedSkills.length > 0
    ? `Matches background in ${matchedSkills.slice(0, 3).join(", ")} with relevant demonstrated competency.`
    : `Aligns with ${candidateTitle || "candidate"} profile in ${job.location || "target market"}.`;

  return {
    job,
    matchScore: score,
    matchReason,
    matchedSkills,
    missingSkills: potentialMissing.slice(0, 3),
  };
}

/**
 * Evaluates an array of discovered jobs against the user profile using grounded recruiter intelligence.
 */
export async function batchScoreJobs(
  jobs: UnifiedJob[],
  profile: Profile
): Promise<ScoredJobMatch[]> {
  if (!jobs || jobs.length === 0) {
    return [];
  }

  const { client, model } = getAiClient();

  // Extract real experience, project evidence, and education
  const workHistory = Array.isArray(profile.work_experience)
    ? profile.work_experience.slice(0, 3).map((w) => ({
        role: w.title,
        company: w.company,
        duration: `${w.startDate} to ${w.current ? "Present" : w.endDate || ""}`,
        responsibilitiesAndProjects: w.responsibilities ? w.responsibilities.slice(0, 300) : "",
      }))
    : [];

  const candidateSummary = {
    name: profile.full_name || "Candidate",
    currentTitle: profile.current_title || "Developer",
    experienceLevel: profile.experience_level || "mid",
    yearsExperience: profile.years_experience || 0,
    skills: profile.skills || [],
    jobTitlesSeeking: profile.job_titles_seeking || [],
    industries: profile.industries || [],
    recentWorkAndProjects: workHistory,
    education: Array.isArray(profile.education)
      ? profile.education.map((e) => `${e.degree} in ${e.field} from ${e.institution}`)
      : [],
    portfolioUrl: profile.portfolio_url || null,
  };

  const jobsPayload = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    salary: j.salary,
    descriptionExcerpt: j.aboutRole.slice(0, 900),
  }));

  const systemPrompt = `You are a world-class technical talent director and principal hiring evaluator for JobPilot.
Your job is to produce grounded, realistic, and honest match evaluations between candidate profiles and job postings. Avoid fantasy scores where keyword overlap masks huge gaps in scope, seniority, or compensation expectations.

Evaluation Rules:
1. Grounded Reality Over Buzzwords:
   - A 90%+ score means the candidate has demonstrated proof of skills, experience level, and scope alignment to be interviewed immediately with high confidence.
   - Do NOT give 85%+ to a candidate for a Senior, Staff, Lead, Principal, or $180k+ compensation role unless their work experience, demonstrated projects, or leadership explicitly prove that level of architectural capability.
   - If a junior or mid-level candidate has good keyword alignment for a Senior or high-salary role but lacks the demonstrated scale and years, score it realistically as a stretch opportunity (52% to 66%) and clearly explain the scope gap in matchReason.

2. Value Demonstrated Projects and Practical Competence:
   - If a candidate has limited corporate tenure but their projects and responsibilities demonstrate production-grade competence in the exact stack, reward that proof fairly for entry and mid-level roles (72% to 84%).
   - Focus on what the candidate has actually built and delivered.

3. Recognize Transferable Skills Across Disciplines:
   - Recognize adjacent analytical and operational skills. For example: Financial Analyst skills (quantitative modeling, forecasting, variance analysis, reporting) transfer strongly toward Financial Leadership or Continuous Improvement (Amélioration Continue / Lean process management / KPI optimization).
   - Give substantial credit for transferable foundations when evaluating career shifts.

4. Outputs per Job:
   - matchScore: Integer 0 to 100 calibrated against real-world hiring standards.
   - matchReason: Honest, constructive 1-2 sentence assessment highlighting exact strengths and real-world gaps.
   - matchedSkills: Array of specific skills or transferable competencies the candidate demonstrably has.
   - missingSkills: Array of critical requirements, seniority levels, or tools the candidate lacks.

Return strictly valid JSON with this exact schema:
{
  "matches": [
    {
      "id": "job_id_string",
      "matchScore": 75,
      "matchReason": "Strong project proof in Next.js and React...",
      "matchedSkills": ["Next.js", "TypeScript", "Process Optimization"],
      "missingSkills": ["Cloud Architecture at Scale", "5+ Years Leadership"]
    }
  ]
}`;

  const userPrompt = `Candidate Profile:
${JSON.stringify(candidateSummary, null, 2)}

Job Postings to Evaluate:
${JSON.stringify(jobsPayload, null, 2)}`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.15,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty AI response received");
    }

    const parsed = JSON.parse(content);
    const matchesArray: BatchMatchItem[] = Array.isArray(parsed?.matches) ? parsed.matches : [];
    const matchMap = new Map<string, BatchMatchItem>();

    for (const item of matchesArray) {
      if (item && item.id) {
        matchMap.set(String(item.id), item);
      }
    }

    return jobs.map((job) => {
      const matchData = matchMap.get(job.id);
      if (matchData) {
        return {
          job,
          matchScore: typeof matchData.matchScore === "number" ? Math.min(Math.max(matchData.matchScore, 0), 100) : 65,
          matchReason: matchData.matchReason || `Evaluated against ${candidateSummary.currentTitle} profile.`,
          matchedSkills: Array.isArray(matchData.matchedSkills) ? matchData.matchedSkills : [],
          missingSkills: Array.isArray(matchData.missingSkills) ? matchData.missingSkills : [],
        };
      }
      return heuristicScoreJob(job, profile);
    });
  } catch (error) {
    console.warn("AI batch scoring error, applying grounded fallback:", error);
    return jobs.map((job) => heuristicScoreJob(job, profile));
  }
}
