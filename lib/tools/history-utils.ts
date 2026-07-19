/**
 * Maps database messages to Vercel AI SDK compatible UI messages,
 * reconstructing toolInvocations from tool-call and tool-result message parts.
 */
export function mapDbMessagesToUiMessages(dbMessages: any[]): any[] {
  const uiMessages: any[] = [];
  
  for (let i = 0; i < dbMessages.length; i++) {
    const msg = dbMessages[i];
    
    // Skip raw tool messages because they are merged into the assistant message that spawned them
    if (msg.role === "tool") {
      continue;
    }
    
    const uiMsg: any = {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    };
    
    // If it is an assistant message and contains parts
    if (msg.role === "assistant" && msg.parts && Array.isArray(msg.parts)) {
      const toolCalls = msg.parts.filter((p: any) => p.type === "tool-call");
      
      if (toolCalls.length > 0) {
        uiMsg.toolInvocations = toolCalls.map((call: any) => {
          let result: any = undefined;
          let state: "call" | "result" = "call";
          
          // Look ahead in subsequent db messages to find the matching tool result
          for (let j = i + 1; j < dbMessages.length; j++) {
            const nextMsg = dbMessages[j];
            if (nextMsg.role === "tool" && nextMsg.parts && Array.isArray(nextMsg.parts)) {
              const matchingResult = nextMsg.parts.find(
                (p: any) => p.toolCallId === call.toolCallId
              );
              if (matchingResult) {
                result = matchingResult.result;
                state = "result";
                break;
              }
            }
          }
          
          return {
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            args: call.args || call.input,
            input: call.args || call.input,
            state,
            result: result || call.output,
            output: result || call.output,
          };
        });
      }
      
      // Reconstruct simple string content for text block if present in parts
      const textPart = msg.parts.find((p: any) => p.type === "text");
      if (textPart) {
        uiMsg.content = textPart.text;
      }
    }
    
    uiMessages.push(uiMsg);
  }
  
  return uiMessages;
}

/**
 * Safely slices database messages to keep the last `maxMessages`
 * while ensuring that we do not break apart tool call/result pairs.
 */
export function trimDbMessages(messages: any[], maxMessages: number = 20): any[] {
  if (messages.length <= maxMessages) return messages;

  let cutIndex = messages.length - maxMessages;

  // 1. If the message at cutIndex is a tool result, expand the window backwards
  // to include the preceding assistant tool-call.
  while (cutIndex > 0 && messages[cutIndex].role === "tool") {
    cutIndex--;
  }

  // 2. If the message just before the cut (cutIndex - 1) is an assistant message
  // containing tool calls, we must include it so we don't end up with dangling tool results.
  while (
    cutIndex > 0 &&
    messages[cutIndex - 1].role === "assistant" &&
    messages[cutIndex - 1].parts &&
    Array.isArray(messages[cutIndex - 1].parts) &&
    messages[cutIndex - 1].parts.some((p: any) => p.type === "tool-call")
  ) {
    cutIndex--;
  }

  return messages.slice(cutIndex);
}

/**
 * Context compression strategy.
 * Keeps recent messages verbatim and compresses older messages to minimize tokens.
 */
export function compressMessageHistory(messages: any[], keepVerbatim: number = 10): any[] {
  if (messages.length <= keepVerbatim) return messages;

  return messages.map((msg, index) => {
    // Keep recent messages verbatim
    if (index >= messages.length - keepVerbatim) {
      return msg;
    }

    // Clone message to avoid modifying active reference
    const compressed = { ...msg };

    if (msg.role === "tool") {
      // Compress massive tool output payload
      compressed.content = "[Tool output compressed for context optimization]";
      if (compressed.parts && Array.isArray(compressed.parts)) {
        compressed.parts = compressed.parts.map((p: any) => ({
          ...p,
          result: { status: "success", summary: "Data trimmed" },
        }));
      }
    } else if (msg.role === "assistant") {
      // Truncate long assistant text response
      if (typeof compressed.content === "string" && compressed.content.length > 200) {
        compressed.content = compressed.content.substring(0, 200) + "... [Response compressed]";
      }
      if (compressed.parts && Array.isArray(compressed.parts)) {
        compressed.parts = compressed.parts.map((p: any) => {
          if (p.type === "text" && p.text && p.text.length > 200) {
            return { ...p, text: p.text.substring(0, 200) + "... [Response compressed]" };
          }
          return p;
        });
      }
    } else if (msg.role === "user") {
      // Truncate long user text inputs
      if (typeof compressed.content === "string" && compressed.content.length > 300) {
        compressed.content = compressed.content.substring(0, 300) + "... [User prompt compressed]";
      }
      if (compressed.parts && Array.isArray(compressed.parts)) {
        compressed.parts = compressed.parts.map((p: any) => {
          if (p.type === "text" && p.text && p.text.length > 300) {
            return { ...p, text: p.text.substring(0, 300) + "... [User prompt compressed]" };
          }
          return p;
        });
      }
    }

    return compressed;
  });
}
