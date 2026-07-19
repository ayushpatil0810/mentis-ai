/**
 * Provider-specific prompt adapters.
 * Returns targeted instructions to optimize performance for specific LLM providers.
 */
export function getProviderPrompt(providerName: string): string {
  const normalized = providerName.toLowerCase();
  
  if (normalized === "anthropic") {
    return "Format your output strictly using direct responses. If you must reason, keep it implicit. Do not wrap your response in conversational filler.";
  }
  
  if (normalized === "gemini") {
    return "Provide responses with clear structure, utilizing bullet points and tables only for data density.";
  }

  // Fallback for OpenAI/others: no extra instructions needed
  return "";
}
