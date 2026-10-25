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
 * Matches profile skills and title against job description.
 */
function heuristicScoreJob(job: UnifiedJob, profile: Profile): ScoredJobMatch {
  const profileSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const candidateTitle = profile.current_title || "";
  const roleText = `${job.title} ${job.aboutRole}`.toLowerCase();

  const matchedSkills: string[] = [];
  const potentialMissing: string[] = [];

  for (const skill of profileSkills) {
    if (roleText.includes(skill.toLowerCase())) {
      matchedSkills.push(skill);
    }
  }

  // Common tech skills to check for missing skills
  const commonTech = ["react", "typescript", "node.js", "next.js", "python", "sql", "aws", "docker", "graphql", "tailwind"];
  for (const tech of commonTech) {
    if (roleText.includes(tech) && !profileSkills.some(s => s.toLowerCase() === tech)) {
      potentialMissing.push(tech.charAt(0).toUpperCase() + tech.slice(1));
    }
  }

  // Calculate score base
  let score = 50;
  if (candidateTitle && roleText.includes(candidateTitle.toLowerCase())) {
    score += 20;
  }
  score += Math.min(matchedSkills.length * 8, 30);
  score = Math.min(Math.max(score, 35), 95);

  const matchReason = matchedSkills.length > 0
    ? `Matches candidate background in ${matchedSkills.slice(0, 3).join(", ")}.`
    : `Related role in ${job.location || "target area"} aligning with general developer experience.`;

  return {
    job,
    matchScore: score,
    matchReason,
    matchedSkills,
    missingSkills: potentialMissing.slice(0, 3),
  };
}

/**
 * Evaluates an array of discovered jobs against the user's profile in a single batch prompt.
 */
export async function batchScoreJobs(
  jobs: UnifiedJob[],
  profile: Profile
): Promise<ScoredJobMatch[]> {
  if (!jobs || jobs.length === 0) {
    return [];
  }

  const { client, model } = getAiClient();

  const candidateSummary = {
    name: profile.full_name || "Candidate",
    title: profile.current_title || "Software Developer",
    yearsExperience: profile.years_experience || 3,
    skills: profile.skills || [],
    jobTitlesSeeking: profile.job_titles_seeking || [],
    industries: profile.industries || [],
  };

  const jobsPayload = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    descriptionExcerpt: j.aboutRole.slice(0, 800), // Excerpt to fit comfortably within prompt tokens
  }));

  const systemPrompt = `You are an expert technical talent recruiter and career coach for JobPilot.
Analyze the candidate profile against each job vacancy in the provided list.
For each job, evaluate:
1. matchScore: Integer from 0 to 100 reflecting how well the candidate meets role requirements.
2. matchReason: Concise 1-2 sentence explanation of why this role matches or where the gap lies.
3. matchedSkills: Array of skills the candidate possesses that are relevant to this job.
4. missingSkills: Array of required or preferred skills mentioned in the job that the candidate lacks.

Return strictly valid JSON with this exact schema:
{
  "matches": [
    {
      "id": "job_id_string",
      "matchScore": 85,
      "matchReason": "Strong match...",
      "matchedSkills": ["React", "TypeScript"],
      "missingSkills": ["Docker"]
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
      temperature: 0.2,
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
          matchScore: typeof matchData.matchScore === "number" ? Math.min(Math.max(matchData.matchScore, 0), 100) : 70,
          matchReason: matchData.matchReason || `Matches ${candidateSummary.title} requirements.`,
          matchedSkills: Array.isArray(matchData.matchedSkills) ? matchData.matchedSkills : [],
          missingSkills: Array.isArray(matchData.missingSkills) ? matchData.missingSkills : [],
        };
      }
      return heuristicScoreJob(job, profile);
    });
  } catch (error) {
    console.warn("AI batch scoring error, applying deterministic fallback:", error);
    return jobs.map((job) => heuristicScoreJob(job, profile));
  }
}
