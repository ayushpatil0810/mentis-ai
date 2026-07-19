import { identityPrompt } from "./identity";
import { behaviorPrompt } from "./behavior";
import { reasoningPrompt } from "./reasoning";
import { responseStylePrompt } from "./response-style";
import { safetyPrompt } from "./safety";
import { applicationPrompt } from "./application";

// Import tool-specific prompts
import { calculatorPrompt } from "./tools/calculator";
import { datetimePrompt } from "./tools/datetime";
import { webSearchPrompt } from "./tools/web-search";
import { fetchUrlPrompt } from "./tools/fetch-url";
import { conversationSearchPrompt } from "./tools/conversation-search";
import { messageSearchPrompt } from "./tools/message-search";

const toolPrompts: Record<string, string> = {
  calculator: calculatorPrompt,
  datetime: datetimePrompt,
  webSearch: webSearchPrompt,
  fetchUrl: fetchUrlPrompt,
  searchConversations: conversationSearchPrompt,
  searchMessages: messageSearchPrompt,
};

/**
 * Builds a dynamic and modular system prompt based on registered tools.
 * Avoids creating a single monolithic string, making it easy to maintain and extend.
 * 
 * @param registeredToolsNames List of names of the tools that are currently registered/active.
 * @returns Combined system prompt string.
 */
export function buildSystemPrompt(registeredToolsNames: string[]): string {
  const sections = [
    identityPrompt.trim(),
    behaviorPrompt.trim(),
    reasoningPrompt.trim(),
    responseStylePrompt.trim(),
    safetyPrompt.trim(),
    applicationPrompt.trim(),
  ];

  // Dynamically include guidelines for registered tools
  const activeToolGuidelines: string[] = [];
  
  for (const name of registeredToolsNames) {
    const promptSection = toolPrompts[name];
    if (promptSection) {
      activeToolGuidelines.push(promptSection.trim());
    }
  }

  if (activeToolGuidelines.length > 0) {
    const toolsPromptBlock = `
# Specific Tool Guidelines
You have access to the following active tools. You must use them in accordance with their guidelines:
${activeToolGuidelines.join("\n")}
`;
    sections.push(toolsPromptBlock.trim());
  }

  return sections.join("\n\n");
}
