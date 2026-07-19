"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
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
  const [isOpen, setIsOpen] = useState(false);
  const { toolName, args, state, result } = toolInvocation;

  // Resolve args and result dynamically to support both v4 (args/result) and v5+ (input/output) properties
  const resolvedArgs = args || (toolInvocation as any).input || {};
  const resolvedResult = result || (toolInvocation as any).output;

  // Title Generator executes silently and should not be rendered
  if (toolName === "titleGenerator" || toolName === "generateTitle") {
    return null;
  }

  // Determine execution state
  let status: "loading" | "success" | "error" = "loading";
  let displayResult: any = null;
  let errorMessage = "";

  if (state === "result") {
    if (resolvedResult && typeof resolvedResult === "object") {
      if (resolvedResult.status === "success") {
        status = "success";
        displayResult = resolvedResult.data;
      } else if (resolvedResult.status === "error") {
        status = "error";
        errorMessage = resolvedResult.error?.message || "An error occurred during tool execution.";
      } else {
        // Fallback for tools returning raw outputs
        status = "success";
        displayResult = resolvedResult;
      }
    } else {
      status = "success";
      displayResult = resolvedResult;
    }
  }

  // Icon mapping
  const renderIcon = () => {
    switch (status) {
      case "loading":
        return (
          <svg className="animate-spin h-4.5 w-4.5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case "success":
        return (
          <svg className="h-4.5 w-4.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case "error":
        return (
          <svg className="h-4.5 w-4.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "loading": return "Running execution...";
      case "success": return "Completed successfully";
      case "error": return "Execution failed";
    }
  };

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
        // Generic JSON fallback card for unknown tools
        return (
          <div className="flex flex-col gap-3 w-full">
            <div>
              <div className="text-[10px] font-sans font-semibold text-muted-foreground/60 mb-2 uppercase tracking-widest">Parameters</div>
              <pre className="p-3 bg-muted/40 border border-border/10 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-40">
                {JSON.stringify(resolvedArgs, null, 2)}
              </pre>
            </div>
            {displayResult && (
              <div>
                <div className="text-[10px] font-sans font-semibold text-muted-foreground/60 mb-2 uppercase tracking-widest">Output</div>
                <pre className="p-3 bg-muted/40 border border-border/10 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-60">
                  {JSON.stringify(displayResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "my-3 w-full max-w-full overflow-hidden rounded-xl border transition-all duration-200 shadow-sm",
        status === "loading" && "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10",
        status === "success" && "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10",
        status === "error" && "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10"
      )}
      role="region"
      aria-label={`${formatToolName(toolName)} tool execution`}
    >
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        tabIndex={0}
        className="flex items-center justify-between p-4 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-t-xl"
        aria-expanded={isOpen}
        aria-controls={`tool-body-${toolInvocation.toolCallId}`}
      >
        <div className="flex items-center gap-3.5">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200",
            status === "loading" && "bg-amber-500/10 border-amber-500/20",
            status === "success" && "bg-emerald-500/10 border-emerald-500/20",
            status === "error" && "bg-rose-500/10 border-rose-500/20"
          )}>
            {renderIcon()}
          </div>
          <div>
            <div className="text-[14px] font-semibold text-foreground tracking-tight">
              {formatToolName(toolName)}
            </div>
            <div className="text-[11px] text-muted-foreground/80 font-medium">
              {getStatusText()}
            </div>
          </div>
        </div>

        <button 
          className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          aria-label={isOpen ? "Collapse tool details" : "Expand tool details"}
          tabIndex={-1}
        >
          <svg 
            className={cn("h-4 w-4 transform transition-transform duration-250", isOpen && "rotate-180")} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Body / Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`tool-body-${toolInvocation.toolCallId}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/20 bg-muted/5 p-4 space-y-4">
              {status === "error" && (
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-sans font-semibold text-rose-500/80 uppercase tracking-widest">Error Details</div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[12px] leading-relaxed font-sans font-medium">
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Renders specific visual representation */}
              {renderSpecificCard()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
