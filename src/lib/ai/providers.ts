import { generateObject, generateText, type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import type { LLMProvider } from "@/types";

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
  google: "gemini-1.5-flash",
  groq: "llama-3.3-70b-versatile",
};

const VISION_MODELS: Partial<Record<LLMProvider, string>> = {
  openai: "gpt-4o-mini",
  google: "gemini-1.5-flash",
  anthropic: "claude-3-5-haiku-latest",
};

async function getApiKey(envVar: string): Promise<string | undefined> {
  const fromEnv = process.env[envVar];
  if (fromEnv) return fromEnv;
  const dbSetting = await prisma.setting.findUnique({
    where: { key: `llm_key_${envVar.toLowerCase()}` },
  });
  if (dbSetting?.isEncrypted) return decryptSecret(dbSetting.value);
  return dbSetting?.value;
}

export interface AiProviderConfig {
  provider: LLMProvider;
  model: string;
  vision: boolean;
}

export async function resolveProvider(vision = false): Promise<AiProviderConfig> {
  const dbSetting = await prisma.setting.findUnique({
    where: { key: "llm_provider" },
  });
  const configured =
    dbSetting?.value ??
    process.env.DEFAULT_LLM_PROVIDER ??
    ("openai" as LLMProvider);
  const provider = (configured as LLMProvider) || "openai";

  const modelFromDb = await prisma.setting.findUnique({
    where: { key: "llm_model" },
  });
  const explicitModel = modelFromDb?.value;
  const visionModel = vision ? VISION_MODELS[provider] : undefined;

  return {
    provider,
    model:
      (vision ? visionModel : undefined) ??
      explicitModel ??
      DEFAULT_MODELS[provider] ??
      DEFAULT_MODELS.openai,
    vision,
  };
}

export function getModelKey(provider: LLMProvider): string {
  switch (provider) {
    case "openai":
      return "OPENAI_API_KEY";
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "google":
      return "GEMINI_API_KEY";
    case "groq":
      return "GROQ_API_KEY";
  }
}

export async function getModel(vision = false): Promise<LanguageModel> {
  const { provider, model } = await resolveProvider(vision);
  const apiKey = await getApiKey(getModelKey(provider));

  if (!apiKey) {
    throw new Error(
      `No API key configured for "${provider}". Add it in Settings or .env (${getModelKey(provider)}).`
    );
  }

  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(model);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(model);
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(model);
    }
    case "groq": {
      const groq = createGroq({ apiKey });
      return groq(model);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function runObjectGeneration<T>({
  prompt,
  system,
  schema,
  vision,
}: {
  prompt: string;
  system: string;
  schema: object;
  vision?: boolean;
}): Promise<T> {
  const model = await getModel(vision);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await generateObject<any>({
    model,
    schema: schema as never,
    prompt,
    system,
    temperature: 0.2,
  });
  return result.object as T;
}

export async function runText({ prompt, system }: { prompt: string; system: string }) {
  const model = await getModel();
  const result = await generateText({
    model,
    prompt,
    system,
    temperature: 0.7,
  });
  return result.text;
}