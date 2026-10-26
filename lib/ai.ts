import OpenAI from "openai";

export interface AiClientConfig {
  client: OpenAI;
  model: string;
  provider: "groq" | "gemini" | "openrouter" | "cerebras" | "mistral" | "openai";
}

/**
 * Returns an OpenAI client configured for the active free or proprietary LLM provider.
 * Priority:
 * 1. Groq (free tier: 30 RPM, 14,400 RPD, ultra-fast Llama 3.3 70B)
 * 2. Gemini (Google AI Studio free tier: 15 RPM, 1,500 RPD, gemini-2.0-flash / gemini-1.5-flash)
 * 3. Cerebras (free tier: 30 RPM, 14,400 RPD, Llama 3.3 70B)
 * 4. Mistral (free tier: 1B tokens/month, Mistral Small/Large)
 * 5. OpenRouter (free tier: zero-cost community models)
 * 6. OpenAI (GPT-4o fallback)
 */
export function getAiClient(): AiClientConfig {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (groqKey) {
    return {
      client: new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: groqKey,
      }),
      model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      provider: "groq",
    };
  }

  if (geminiKey) {
    return {
      client: new OpenAI({
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey: geminiKey,
      }),
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      provider: "gemini",
    };
  }

  if (cerebrasKey) {
    return {
      client: new OpenAI({
        baseURL: "https://api.cerebras.ai/v1",
        apiKey: cerebrasKey,
      }),
      model: process.env.CEREBRAS_MODEL || "llama-3.3-70b",
      provider: "cerebras",
    };
  }

  if (mistralKey) {
    return {
      client: new OpenAI({
        baseURL: "https://api.mistral.ai/v1",
        apiKey: mistralKey,
      }),
      model: process.env.MISTRAL_MODEL || "mistral-small-latest",
      provider: "mistral",
    };
  }

  if (openrouterKey) {
    return {
      client: new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openrouterKey,
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "JobPilot",
        },
      }),
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      provider: "openrouter",
    };
  }

  if (openaiKey) {
    return {
      client: new OpenAI({
        apiKey: openaiKey,
      }),
      model: "gpt-4o",
      provider: "openai",
    };
  }

  // Fallback defaults to Groq endpoint format
  return {
    client: new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: "",
    }),
    model: "llama-3.3-70b-versatile",
    provider: "groq",
  };
}

export interface RawProfileInput {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  current_title?: string | null;
  job_titles_seeking?: string[] | string | null;
  skills?: string[] | null;
  experience?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  education?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Deterministic fallback that converts raw profile data into the ResumePdfData shape
 * without making external AI calls.
 */
export function getRawFallbackResumeData(
  profile: RawProfileInput,
  userEmail?: string | null
): import("@/lib/pdf/ClassicMonochromeTemplate").ResumePdfData {
  // Parse experiences
  let experiences: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    bullets?: string[];
  }> = [];

  if (Array.isArray(profile.experience)) {
    experiences = profile.experience;
  } else if (typeof profile.experience === "string") {
    try {
      experiences = JSON.parse(profile.experience);
    } catch {
      experiences = [];
    }
  }

  const formattedExperiences = (experiences || []).map((exp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let bullets: string[] = [];
    if (Array.isArray(exp.bullets) && exp.bullets.length > 0) {
      bullets = exp.bullets;
    } else if (typeof exp.responsibilities === "string" && exp.responsibilities.trim()) {
      bullets = exp.responsibilities
        .split(/\r?\n|•/)
        .map((b: string) => b.trim().replace(/^[-*•]\s*/, ""))
        .filter((b: string) => b.length > 5);
      if (bullets.length === 0 && exp.responsibilities.trim()) {
        bullets = [exp.responsibilities.trim()];
      }
    }

    return {
      title: exp.title || "Role",
      company: exp.company || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      isCurrent: Boolean(exp.isCurrent),
      bullets: bullets.slice(0, 3),
    };
  });

  // Parse education
  let educations: Array<{
    degree: string;
    field?: string;
    institution: string;
    graduationYear?: string;
  }> = [];

  if (Array.isArray(profile.education)) {
    educations = profile.education;
  } else if (typeof profile.education === "string") {
    try {
      educations = JSON.parse(profile.education);
    } catch {
      educations = [];
    }
  }

  const formattedEducations = (educations || []).map((edu: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    degree: edu.degree || "Degree",
    field: edu.field || undefined,
    institution: edu.institution || "",
    graduationYear: edu.graduationYear || undefined,
  }));

  const rawSkills = Array.isArray(profile.skills) ? profile.skills : [];

  return {
    fullName: profile.full_name?.trim() || "Candidate",
    email: profile.email || userEmail || undefined,
    phone: profile.phone?.trim() || undefined,
    location: profile.location?.trim() || undefined,
    linkedinUrl: profile.linkedin_url?.trim() || undefined,
    portfolioUrl: profile.portfolio_url?.trim() || undefined,
    currentTitle: profile.current_title?.trim() || undefined,
    summary: undefined,
    skills: rawSkills.slice(0, 10),
    experience: formattedExperiences.slice(0, 3),
    education: formattedEducations.slice(0, 3),
  };
}

/**
 * Enhances and tailors profile content into an executive-ready resume structure using
 * the multi-provider LLM gateway. Emphasizes skills and experience achievements
 * matching the target job title.
 * Automatically falls back to raw profile data if AI times out or errors.
 */
export async function tailorResumeContent(
  profile: RawProfileInput,
  userEmail?: string | null,
  locale: "en" | "fr" = "en"
): Promise<import("@/lib/pdf/ClassicMonochromeTemplate").ResumePdfData> {
  const fallbackData = getRawFallbackResumeData(profile, userEmail);
  const isFr = locale === "fr";

  // Derive target job domain
  let targetTitle = profile.current_title?.trim() || "";
  if (Array.isArray(profile.job_titles_seeking) && profile.job_titles_seeking.length > 0) {
    targetTitle = profile.job_titles_seeking[0];
  } else if (typeof profile.job_titles_seeking === "string" && profile.job_titles_seeking.trim()) {
    targetTitle = profile.job_titles_seeking.split(",")[0].trim();
  }

  const { client, model } = getAiClient();
  if (!client.apiKey) {
    return fallbackData;
  }

  const languageInstruction = isFr
    ? `CRITICAL BILINGUAL INSTRUCTION: The candidate's target language is French ('fr').
You MUST generate the executive "summary" and all "experience" bullet points entirely in fluent, professional, idiomatic French.
Use strong French active verbs (e.g. Conçu, Développé, Optimisé, Piloté, Déployé, Automatisé).
Keep skills and tools names accurate (e.g. Next.js, TypeScript, PostgreSQL).`
    : `The candidate's target language is English ('en'). Use strong past-tense action verbs (e.g., Engineered, Architected, Spearheaded, Accelerated, Automated, Optimized).`;

  try {
    const aiPromise = client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite executive resume writer and ATS optimization expert.
Your job is to tailor the candidate's profile into a cohesive, single-page resume layout focused on their target career direction.

Target Job Direction: "${targetTitle || (isFr ? "Professionnel Expérimenté" : "Senior Professional")}"
Language: ${isFr ? "Français (French)" : "English"}

${languageInstruction}

Instructions:
1. "summary": Write a punchy 2-3 sentence executive summary highlighting their expertise, key technical strengths, and proven value relevant to the target role in ${isFr ? "French" : "English"}.
2. "skills": Prioritize the candidate's provided skills, selecting the 8-10 most relevant to "${targetTitle}". Do not invent unmentioned technical domains.
3. "experience": For each work experience entry, polish the responsibilities into 2-3 concise, high-impact bullet points in ${isFr ? "French" : "English"}. Strictly preserve all factual dates, metrics, companies, and roles.

Return ONLY valid JSON matching this exact structure:
{
  "summary": "...",
  "skills": ["..."],
  "experience": [
    {
      "company": "...",
      "title": "...",
      "bullets": ["...", "..."]
    }
  ]
}`,
        },
        {
          role: "user",
          content: JSON.stringify({
            fullName: profile.full_name,
            currentTitle: profile.current_title,
            targetJob: targetTitle,
            language: isFr ? "fr" : "en",
            rawSkills: profile.skills || [],
            experiences: fallbackData.experience,
          }),
        },
      ],
    });

    // 8-second timeout guard to ensure zero user stall
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI tailoring timed out after 8s")), 8000)
    );

    const completion = await Promise.race([aiPromise, timeoutPromise]);
    const responseText = completion.choices?.[0]?.message?.content || "";
    if (!responseText.trim()) {
      return fallbackData;
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    // Merge AI polished content with reliable base data
    const polishedSummary = typeof parsed.summary === "string" ? parsed.summary.trim() : undefined;
    const prioritizedSkills = Array.isArray(parsed.skills) && parsed.skills.length > 0
      ? parsed.skills.slice(0, 10)
      : fallbackData.skills;

    const polishedExperience = fallbackData.experience?.map((rawExp, idx) => {
      const aiExp = Array.isArray(parsed.experience) ? parsed.experience[idx] : undefined;
      const bullets = Array.isArray(aiExp?.bullets) && aiExp.bullets.length > 0
        ? aiExp.bullets.slice(0, 3)
        : rawExp.bullets;

      return {
        ...rawExp,
        bullets,
      };
    });

    return {
      ...fallbackData,
      summary: polishedSummary,
      skills: prioritizedSkills,
      experience: polishedExperience,
    };
  } catch (error) {
    console.warn("[lib/ai] AI resume tailoring failed or timed out, using fallback:", error);
    return fallbackData;
  }
}


