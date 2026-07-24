import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getDecryptedApiKey } from "../services/api-key";
import { AuthError } from "../utils/errors";

export async function getProvider(userId: string, providerName: string) {
  if (!userId) throw new AuthError();
  
  const userKey = await getDecryptedApiKey(userId, providerName);
  
  if (!userKey) {
    const formattedProvider = providerName.charAt(0).toUpperCase() + providerName.slice(1);
    throw new Error(`API key for ${formattedProvider} is not configured. Please add your API key in Settings.`);
  }

  switch (providerName.toLowerCase()) {
    case "openai":
      return createOpenAI({ apiKey: userKey });
      
    case "anthropic":
      return createAnthropic({ apiKey: userKey });
      
    case "gemini":
      return createGoogleGenerativeAI({ apiKey: userKey });
      
    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
}
