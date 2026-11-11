"use server";

import { requireAuth } from "@/lib/auth/auth-utils";
import { getDecryptedApiKey } from "@/lib/services/api-key";

export interface AIModel {
  id: string;
  name: string;
  providerId: string;
}

export async function getAvailableModelsAction(): Promise<AIModel[]> {
  const { user } = await requireAuth();

  const [openAiKey, anthropicKey, geminiKey] = await Promise.all([
    getDecryptedApiKey(user.id, "openai"),
    getDecryptedApiKey(user.id, "anthropic"),
    getDecryptedApiKey(user.id, "gemini"),
  ]);

  if (!openAiKey && !anthropicKey && !geminiKey) {
    return [];
  }

  const [openAiModels, geminiModels] = await Promise.all([
    openAiKey ? loadOpenAiModels(openAiKey) : Promise.resolve([]),
    geminiKey ? loadGeminiModels(geminiKey) : Promise.resolve([]),
  ]);

  return [
    ...openAiModels,
    ...(anthropicKey ? ANTHROPIC_MODELS : []),
    ...geminiModels,
  ];
}

const ANTHROPIC_MODELS: AIModel[] = [
  { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5", providerId: "anthropic" },
  { id: "anthropic/claude-opus-4.7", name: "Claude Opus 4.7", providerId: "anthropic" },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", providerId: "anthropic" },
  { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", providerId: "anthropic" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", providerId: "anthropic" },
  { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5", providerId: "anthropic" },
  { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet (Legacy)", providerId: "anthropic" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Legacy)", providerId: "anthropic" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku (Legacy)", providerId: "anthropic" },
  { id: "anthropic/claude-3-opus", name: "Claude 3 Opus (Legacy)", providerId: "anthropic" },
  { id: "anthropic/claude-3-sonnet", name: "Claude 3 Sonnet (Legacy)", providerId: "anthropic" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku (Legacy)", providerId: "anthropic" },
];

async function loadOpenAiModels(apiKey: string): Promise<AIModel[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const chatModels = data.data.filter(
          (m: { id?: string; created?: number }) =>
            !!m.id &&
            (m.id.startsWith("gpt-") ||
              m.id.startsWith("o1-") ||
              m.id.startsWith("o3-") ||
              m.id.startsWith("chatgpt-")),
        );

        chatModels.sort((a: { created?: number }, b: { created?: number }) => (b.created || 0) - (a.created || 0));

        if (chatModels.length > 0) {
          return chatModels.map((m: { id: string }) => ({
            id: `openai/${m.id}`,
            name: m.id,
            providerId: "openai",
          }));
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch OpenAI models dynamically", e);
  }

  return [
    { id: "openai/gpt-4o", name: "GPT-4o", providerId: "openai" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", providerId: "openai" },
    { id: "openai/o1-mini", name: "o1-mini", providerId: "openai" },
    { id: "openai/o3-mini", name: "o3-mini", providerId: "openai" },
  ];
}

async function loadGeminiModels(apiKey: string): Promise<AIModel[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(3000) },
    );

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.models)) {
        const chatModels = data.models.filter(
          (m: { supportedGenerationMethods?: string[]; name?: string }) =>
            m.supportedGenerationMethods?.includes("generateContent") &&
            m.name?.includes("gemini"),
        );

        if (chatModels.length > 0) {
          return chatModels.map((m: { name: string; displayName?: string }) => {
            const id = m.name.replace("models/", "");
            return {
              id: `gemini/${id}`,
              name: m.displayName || id,
              providerId: "gemini",
            };
          });
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch Gemini models dynamically", e);
  }

  return [
    { id: "gemini/gemini-2.0-flash", name: "Gemini 2.0 Flash", providerId: "gemini" },
    { id: "gemini/gemini-1.5-pro", name: "Gemini 1.5 Pro", providerId: "gemini" },
    { id: "gemini/gemini-1.5-flash", name: "Gemini 1.5 Flash", providerId: "gemini" },
  ];
}
