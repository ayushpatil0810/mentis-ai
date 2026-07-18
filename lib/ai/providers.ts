import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { env } from "../env";
import { getDecryptedApiKey } from "../services/api-key";
import { UnauthorizedError } from "../utils/errors";

export async function getProvider(userId: string, providerName: string) {
  if (!userId) throw new UnauthorizedError();
  
  // Try to get user's API key first
  const userKey = await getDecryptedApiKey(userId, providerName);
  
  switch (providerName.toLowerCase()) {
    case "openai":
      const openAiKey = userKey || env.OPENAI_API_KEY;
      if (!openAiKey) throw new Error("OpenAI API key not configured");
      return createOpenAI({ apiKey: openAiKey });
      
    case "anthropic":
      const anthropicKey = userKey || env.ANTHROPIC_API_KEY;
      if (!anthropicKey) throw new Error("Anthropic API key not configured");
      return createAnthropic({ apiKey: anthropicKey });
      
    case "gemini":
      const geminiKey = userKey || env.GEMINI_API_KEY;
      if (!geminiKey) throw new Error("Gemini API key not configured");
      return createGoogleGenerativeAI({ apiKey: geminiKey });
      
    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
}
