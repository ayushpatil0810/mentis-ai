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

  const models: AIModel[] = [];

  // Try to get all keys
  const [openAiKey, anthropicKey, geminiKey] = await Promise.all([
    getDecryptedApiKey(user.id, "openai"),
    getDecryptedApiKey(user.id, "anthropic"),
    getDecryptedApiKey(user.id, "gemini"),
  ]);

  // If NO keys are configured, return empty list (no default model)
  if (!openAiKey && !anthropicKey && !geminiKey) {
    return [];
  }

  // 1. Fetch OpenAI Models
  if (openAiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${openAiKey}` },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          const chatModels = data.data.filter(
            (m: any) =>
              m.id.startsWith("gpt-") ||
              m.id.startsWith("o1-") ||
              m.id.startsWith("o3-") ||
              m.id.startsWith("chatgpt-"),
          );

          chatModels.sort((a: any, b: any) => b.created - a.created);

          for (const m of chatModels) {
            models.push({
              id: `openai/${m.id}`,
              name: m.id,
              providerId: "openai",
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch OpenAI models dynamically", e);
    }

    if (!models.some((m) => m.providerId === "openai")) {
      const fallbackOpenAi = [
        { id: "openai/gpt-4o", name: "GPT-4o" },
        { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
        { id: "openai/o1-mini", name: "o1-mini" },
        { id: "openai/o3-mini", name: "o3-mini" },
      ];
      for (const m of fallbackOpenAi) {
        models.push({ ...m, providerId: "openai" });
      }
    }
  }

  // 2. Fetch Anthropic Models
  if (anthropicKey) {
    const anthropicModels = [
      { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5" },
      { id: "anthropic/claude-opus-4.7", name: "Claude Opus 4.7" },
      { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6" },
      { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6" },
      { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5" },
      { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5" },
      { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet (Legacy)" },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Legacy)" },
      { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku (Legacy)" },
      { id: "anthropic/claude-3-opus", name: "Claude 3 Opus (Legacy)" },
      { id: "anthropic/claude-3-sonnet", name: "Claude 3 Sonnet (Legacy)" },
      { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku (Legacy)" },
    ];

    for (const m of anthropicModels) {
      models.push({
        ...m,
        providerId: "anthropic",
      });
    }
  }

  // 3. Fetch Gemini Models
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey)}`,
        { signal: AbortSignal.timeout(8000) }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.models)) {
          const chatModels = data.models.filter(
            (m: any) =>
              m.supportedGenerationMethods?.includes("generateContent") &&
              m.name.includes("gemini"),
          );

          for (const m of chatModels) {
            const id = m.name.replace("models/", "");
            models.push({
              id: `gemini/${id}`,
              name: m.displayName || id,
              providerId: "gemini",
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch Gemini models dynamically", e);
    }

    if (!models.some((m) => m.providerId === "gemini")) {
      const fallbackGemini = [
        { id: "gemini/gemini-2.0-flash", name: "Gemini 2.0 Flash" },
        { id: "gemini/gemini-1.5-pro", name: "Gemini 1.5 Pro" },
        { id: "gemini/gemini-1.5-flash", name: "Gemini 1.5 Flash" },
      ];
      for (const m of fallbackGemini) {
        models.push({ ...m, providerId: "gemini" });
      }
    }
  }

  return models;
}
