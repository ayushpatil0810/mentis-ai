import { logger } from "@/lib/utils/logger";

/**
 * Approximate token count from string length (approx. 4 characters per token).
 */
function estimateTokens(text: string): number {
  return Math.round(text.length / 4);
}

/**
 * Measures and logs the token sizes of system prompt, tools, and message history
 * during development to identify prompt bloat.
 */
export function analyzePromptTokens(params: {
  systemPrompt: string;
  tools: Record<string, any>;
  messages: any[];
}) {
  if (process.env.NODE_ENV !== "development") return;

  try {
    const systemTokens = estimateTokens(params.systemPrompt);
    const toolJson = JSON.stringify(params.tools);
    const toolTokens = estimateTokens(toolJson);
    
    let messageTokens = 0;
    for (const msg of params.messages) {
      if (typeof msg.content === "string") {
        messageTokens += estimateTokens(msg.content);
      } else if (msg.content && typeof msg.content === "object") {
        messageTokens += estimateTokens(JSON.stringify(msg.content));
      }
      if (msg.parts && Array.isArray(msg.parts)) {
        messageTokens += estimateTokens(JSON.stringify(msg.parts));
      }
    }

    const totalEstimated = systemTokens + toolTokens + messageTokens;

    logger.info("Adaptive Prompt Analysis", {
      systemPromptTokens: systemTokens,
      toolDefinitionTokens: toolTokens,
      conversationTokens: messageTokens,
      totalInputTokens: totalEstimated,
    });
  } catch (error: any) {
    logger.warn("Failed to complete prompt analysis: " + error.message);
  }
}
