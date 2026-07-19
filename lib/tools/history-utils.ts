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
