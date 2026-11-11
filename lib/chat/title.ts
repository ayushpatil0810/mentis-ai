export const DEFAULT_CHAT_TITLE = "New Chat";

const MAX_TITLE_LENGTH = 80;

/**
 * Turn raw model output into a single-line chat title.
 * Wrapping quotes are removed. Apostrophes inside the title are kept.
 */
export function sanitizeTitle(raw: string): string {
  const firstLine =
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  let title = firstLine
    .replace(/^["'`“”]+|["'`“”]+$/g, "")
    .replace(/^#+\s*/, "")
    .replace(/^\*\*(.*)\*\*$/, "$1")
    .replace(/^(?:title\s*:\s*)/i, "")
    .replace(/^(?:\d+[.)\]]\s+|[-*]\s+)/, "")
    .replace(/\s+/g, " ")
    .trim();

  title = title.replace(/^["'`“”]+|["'`“”]+$/g, "").trim();

  if (title.length > MAX_TITLE_LENGTH) {
    const sliced = title.slice(0, MAX_TITLE_LENGTH);
    const lastSpace = sliced.lastIndexOf(" ");
    title = (lastSpace > 20 ? sliced.slice(0, lastSpace) : sliced).trim();
  }

  return title;
}

/** Drop titles that would leave the chat looking untitled or blank. */
export function usableChatTitle(title: string): string {
  if (!title) return "";
  if (title.toLowerCase() === DEFAULT_CHAT_TITLE.toLowerCase()) return "";
  if (!/[0-9a-z]/i.test(title)) return "";
  return title;
}

/** Short title taken from the user's own words when the model returns nothing usable. */
export function fallbackTitleFromMessage(userMessage: string): string {
  const normalized = userMessage.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const excerpt = normalized.split(" ").slice(0, 6).join(" ");
  return usableChatTitle(sanitizeTitle(excerpt));
}
