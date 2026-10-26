import { z } from "zod";

/**
 * Client-exposed environment variable schema.
 * All client variables must be prefixed with NEXT_PUBLIC_.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL (e.g. http://localhost:3000 or https://your-domain.vercel.app)")
    .default("http://localhost:3000"),

  NEXT_PUBLIC_INSFORGE_URL: z
    .string({ message: "NEXT_PUBLIC_INSFORGE_URL is required." })
    .url("NEXT_PUBLIC_INSFORGE_URL must be a valid InsForge project URL (e.g. https://your-project.region.insforge.app)"),

  NEXT_PUBLIC_INSFORGE_ANON_KEY: z
    .string({ message: "NEXT_PUBLIC_INSFORGE_ANON_KEY is required." })
    .min(1, "NEXT_PUBLIC_INSFORGE_ANON_KEY cannot be empty."),

  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z
    .string()
    .url("NEXT_PUBLIC_POSTHOG_HOST must be a valid URL")
    .default("https://us.i.posthog.com"),
});

/**
 * Server-only environment variable schema.
 * These keys are never bundled into client-side code.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // InsForge admin
  INSFORGE_API_KEY: z.string().optional(),

  // AI Gateways (individual keys optional; fallback cascade handles missing providers)
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // AI Model overrides
  GROQ_MODEL: z.string().default("qwen/qwen3.8-27b"),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  CEREBRAS_MODEL: z.string().default("llama-3.3-70b"),
  MISTRAL_MODEL: z.string().default("mistral-small-latest"),
  OPENROUTER_MODEL: z.string().default("meta-llama/llama-3.3-70b-instruct:free"),

  // Job Search aggregators
  RAPIDAPI_KEY: z.string().optional(),
  RAPIDAPI_HOST: z.string().default("jsearch.p.rapidapi.com"),
  JOOBLE_API_KEY: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),

  // Browserbase optional research agent
  BROWSERBASE_API_KEY: z.string().optional(),
  BROWSERBASE_PROJECT_ID: z.string().optional(),

  // Scheduled Maintenance Crons
  CRON_SECRET: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export interface ValidatedEnv {
  client: ClientEnv;
  server: ServerEnv;
}

let cachedEnv: ValidatedEnv | null = null;

/**
 * Validates both client and server environment variables.
 * Fails fast on missing critical infrastructure keys (InsForge).
 * Warns gracefully on missing optional third-party AI or job aggregator keys.
 */
export function validateEnv(): ValidatedEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  // Evaluate client variables
  const clientParsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_INSFORGE_URL: process.env.NEXT_PUBLIC_INSFORGE_URL,
    NEXT_PUBLIC_INSFORGE_ANON_KEY: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    NEXT_PUBLIC_POSTHOG_KEY:
      process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  if (!clientParsed.success) {
    const fieldErrors = clientParsed.error.flatten().fieldErrors;
    console.error("\n❌ [JobPilot Environment Validation Failed - Client Keys]");
    console.error(JSON.stringify(fieldErrors, null, 2));
    throw new Error(
      "Missing or invalid client environment variables. Check .env.local or your Vercel Project Settings."
    );
  }

  // Evaluate server variables
  const serverParsed = serverEnvSchema.safeParse(process.env);

  if (!serverParsed.success) {
    const fieldErrors = serverParsed.error.flatten().fieldErrors;
    console.error("\n❌ [JobPilot Environment Validation Failed - Server Keys]");
    console.error(JSON.stringify(fieldErrors, null, 2));
    throw new Error(
      "Missing or invalid server environment variables. Check .env.local or your Vercel Project Settings."
    );
  }

  // Graceful degradation checks & informative warnings for optional services
  const hasAiKey = Boolean(
    serverParsed.data.GROQ_API_KEY ||
      serverParsed.data.GEMINI_API_KEY ||
      serverParsed.data.GOOGLE_API_KEY ||
      serverParsed.data.CEREBRAS_API_KEY ||
      serverParsed.data.MISTRAL_API_KEY ||
      serverParsed.data.OPENROUTER_API_KEY ||
      serverParsed.data.OPENAI_API_KEY
  );

  if (!hasAiKey) {
    console.warn(
      "⚠️ [JobPilot Environment Notice]: No AI provider API keys configured. LLM extraction and scoring will run in fallback or mock mode."
    );
  }

  const hasJobKey = Boolean(
    serverParsed.data.RAPIDAPI_KEY ||
      serverParsed.data.JOOBLE_API_KEY ||
      (serverParsed.data.ADZUNA_APP_ID && serverParsed.data.ADZUNA_APP_KEY)
  );

  if (!hasJobKey) {
    console.warn(
      "⚠️ [JobPilot Environment Notice]: No job aggregator API keys configured (RapidAPI, Jooble, Adzuna). Live job search will return empty results."
    );
  }

  cachedEnv = {
    client: clientParsed.data,
    server: serverParsed.data,
  };

  return cachedEnv;
}
