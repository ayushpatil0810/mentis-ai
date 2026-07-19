import { identityPrompt } from "./identity";
import { behaviorPrompt } from "./behavior";
import { toolPhilosophyPrompt } from "./tool-philosophy";
import { safetyPrompt } from "./safety";
import { applicationPrompt } from "./application";
import { getProviderPrompt } from "./providers";

// Cache the combined base prompt to avoid redundant runtime string allocations
const CACHED_BASE_PROMPT = [
  identityPrompt,
  behaviorPrompt,
  toolPhilosophyPrompt,
  safetyPrompt,
  applicationPrompt,
].join("\n\n");

/**
 * Dynamically assembles the system prompt.
 * Inherits a cached base prompt and appends provider-specific adapter hints.
 * 
 * @param options Configuration options including target AI provider name.
 * @returns Combined optimized system prompt string.
 */
export function buildSystemPrompt(options?: {
  provider?: string;
  registeredToolsNames?: string[]; // Kept for backwards compatibility
}): string {
  const sections = [CACHED_BASE_PROMPT];

  if (options?.provider) {
    const providerPrompt = getProviderPrompt(options.provider);
    if (providerPrompt) {
      sections.push(providerPrompt);
    }
  }

  return sections.join("\n\n");
}
