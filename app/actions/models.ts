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

  // If NO keys are configured, return the default model
  if (!openAiKey && !anthropicKey && !geminiKey) {
    return [
      {
        id: "default/gpt-4o-mini",
        name: "Mentis Default (GPT-4o Mini)",
        providerId: "default",
      },
    ];
  }

  // 1. Fetch OpenAI Models
  if (openAiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${openAiKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out non-chat models roughly (OpenAI lists a lot of whisper, tts, embedding models)
        const chatModels = data.data.filter((m: any) => 
          m.id.startsWith("gpt-") || m.id.startsWith("o1-") || m.id.startsWith("o3-") || m.id.startsWith("chatgpt-")
        );
        
        chatModels.sort((a: any, b: any) => b.created - a.created); // newest first
        
        for (const m of chatModels) {
          models.push({
            id: `openai/${m.id}`,
            name: m.id, // e.g. "gpt-4o"
            providerId: "openai",
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch OpenAI models", e);
    }
  }

  // 2. Fetch Anthropic Models
  if (anthropicKey) {
    // Fallback static list in case API doesn't support models endpoint yet or fails
    const anthropicModels = [
      { id: "anthropic/claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet" },
      { id: "anthropic/claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Latest)" },
      { id: "anthropic/claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
      { id: "anthropic/claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
      { id: "anthropic/claude-3-opus-20240229", name: "Claude 3 Opus" },
      { id: "anthropic/claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
      { id: "anthropic/claude-3-haiku-20240307", name: "Claude 3 Haiku" },
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out generateContent supported models
        const chatModels = data.models.filter((m: any) => 
          m.supportedGenerationMethods?.includes("generateContent") && 
          (m.name.includes("gemini"))
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
    } catch (e) {
      console.error("Failed to fetch Gemini models", e);
    }
  }

  return models;
}
