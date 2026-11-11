/**
 * Models that think before answering. Their provider default is a long pause,
 * so chat asks for less of it. Gemini 2.5 Pro rejects a zero thinking budget,
 * so that model is left on its provider default.
 */
export function chatReasoningLevel(
  provider: string,
  model: string,
): "low" | "none" | undefined {
  if (provider === "openai" && /^(?:o\d|gpt-5)/.test(model)) return "low";
  if (provider === "gemini" && /gemini-2\.5/.test(model) && !model.includes("pro")) return "none";
  if (provider === "gemini" && /gemini-3/.test(model)) return "none";
  return undefined;
}
