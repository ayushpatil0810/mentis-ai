"use server";

import { upsertApiKey, getApiKeys, deleteApiKey, toggleApiKey, getDecryptedApiKey } from "@/lib/services/api-key";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export async function getApiKeysAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) throw new Error("Unauthorized");
  
  return getApiKeys(session.user.id);
}

export async function upsertApiKeyAction(provider: string, key: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) throw new Error("Unauthorized");
  
  const updated = await upsertApiKey(session.user.id, { provider, key });
  revalidatePath("/");
  return updated;
}

export async function deleteApiKeyAction(provider: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) throw new Error("Unauthorized");
  
  const deleted = await deleteApiKey(session.user.id, provider);
  revalidatePath("/");
  return deleted;
}

export async function toggleApiKeyAction(provider: string, isEnabled: boolean) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) throw new Error("Unauthorized");
  
  const updated = await toggleApiKey(session.user.id, provider, isEnabled);
  revalidatePath("/");
  return updated;
}

export async function testApiKeyAction(provider: string, rawKey: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) throw new Error("Unauthorized");
  
  try {
    let model;
    
    if (provider === "openai") {
      const openai = createOpenAI({ apiKey: rawKey });
      model = openai("gpt-3.5-turbo");
    } else if (provider === "anthropic") {
      const anthropic = createAnthropic({ apiKey: rawKey });
      model = anthropic("claude-3-haiku-20240307");
    } else if (provider === "gemini") {
      const google = createGoogleGenerativeAI({ apiKey: rawKey });
      model = google("models/gemini-1.5-flash");
    } else {
      throw new Error("Unsupported provider");
    }

    // Try a very simple completion
    const { text } = await generateText({
      model,
      prompt: "Reply with 'ok'",
    });
    
    return { success: true };
  } catch (error) {
    console.error(`Failed to test API key for ${provider}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
