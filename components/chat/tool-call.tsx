"use client";

import { Tool } from "@/components/ui/tool";
import {
  CalculatorCard,
  WebSearchCard,
  FetchUrlCard,
  ConversationsCard,
  MessagesCard,
  DateTimeCard,
} from "./tool-cards";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: "call" | "result";
  result?: any;
}

export function ToolCall({ toolInvocation }: { toolInvocation: ToolInvocation }) {
  const { toolName, args, state, result } = toolInvocation;

  // Title Generator executes silently and should not be rendered
  if (toolName === "titleGenerator" || toolName === "generateTitle") {
    return null;
  }

  // Resolve args and result dynamically to support both v4 (args/result) and v5+ (input/output) properties
  const resolvedArgs = args || (toolInvocation as any).input || {};
  const resolvedResult = result || (toolInvocation as any).output;

  // Determine execution state
  let toolState: "input-streaming" | "input-available" | "output-available" | "output-error" = "input-streaming";
  let displayResult: any = null;
  let errorMessage = "";

  if (state === "result") {
    if (resolvedResult && typeof resolvedResult === "object") {
      if (resolvedResult.status === "success") {
        toolState = "output-available";
        displayResult = resolvedResult.data;
      } else if (resolvedResult.status === "error") {
        toolState = "output-error";
        errorMessage = resolvedResult.error?.message || "An error occurred during tool execution.";
      } else {
        // Fallback for tools returning raw outputs
        toolState = "output-available";
        displayResult = resolvedResult;
      }
    } else {
      toolState = "output-available";
      displayResult = resolvedResult;
    }
  }

  const formatToolName = (name: string) => {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  // Render specific rich cards for tools
  const renderSpecificCard = () => {
    switch (toolName) {
      case "calculator":
        return <CalculatorCard args={resolvedArgs} result={displayResult} />;
      case "webSearch":
        return <WebSearchCard args={resolvedArgs} result={displayResult} />;
      case "fetchUrl":
        return <FetchUrlCard args={resolvedArgs} result={displayResult} />;
      case "searchConversations":
        return <ConversationsCard result={displayResult} />;
      case "searchMessages":
        return <MessagesCard result={displayResult} />;
      case "datetime":
        return <DateTimeCard result={displayResult} />;
      default:
        // Return null so the PromptKit Tool component renders the default JSON structure
        return null;
    }
  };

  const hasCustomCard = ["calculator", "webSearch", "fetchUrl", "searchConversations", "searchMessages", "datetime"].includes(toolName);

  return (
    <Tool
      className="w-full"
      toolPart={{
        type: formatToolName(toolName),
        state: toolState,
        input: resolvedArgs,
        output: displayResult,
        toolCallId: toolInvocation.toolCallId,
        errorText: errorMessage,
      }}
    >
      {hasCustomCard ? renderSpecificCard() : null}
    </Tool>
  );
}
export { type ToolInvocation };
