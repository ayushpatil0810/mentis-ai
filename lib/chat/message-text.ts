type MessagePart = {
  type?: string;
  text?: string;
};

/** Visible text for a chat bubble. Reasoning parts are omitted. */
export function getMessageText(message: {
  content?: unknown;
  text?: unknown;
  parts?: MessagePart[] | null;
}): string {
  if (Array.isArray(message.parts)) {
    const text = message.parts
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text as string)
      .join("");
    if (text) return text;
  }

  if (typeof message.content === "string") return message.content;
  if (typeof message.text === "string") return message.text;
  return "";
}
