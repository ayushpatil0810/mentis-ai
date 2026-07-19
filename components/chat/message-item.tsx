"use client";

import { useState, memo } from "react";
import { Copy01Icon, ThumbsUpIcon, ThumbsDownIcon } from "hugeicons-react";
import { toast } from "sonner";
import { MessageRenderer } from "./message-renderer";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { ToolCall } from "./tool-call";

export const MessageItem = memo(function MessageItem({ message }: { message: any }) {
  const isUser = message.role === "user";
  const textContent = message.content || 
    (message.parts && Array.isArray(message.parts) ? message.parts.map((p: any) => p.text || "").join("") : "") || 
    message.text || "";

  // Dynamically extract toolInvocations from message.toolInvocations or message.parts
  const toolInvocations = message.toolInvocations || 
    (message.parts && Array.isArray(message.parts) 
      ? message.parts
          .filter((p: any) => p.type?.startsWith("tool-") || p.type === "dynamic-tool")
          .map((p: any) => {
            const toolName = p.type === "dynamic-tool" ? p.toolName : p.type.replace(/^tool-/, "");
            return {
              toolCallId: p.toolCallId,
              toolName,
              args: p.input,
              input: p.input,
              state: p.state === "output-available" ? "result" : (p.state === "output-error" ? "result" : "call"),
              result: p.state === "output-error" ? { status: "error", error: { message: p.errorText } } : p.output,
              output: p.output,
              errorText: p.errorText,
            };
          }) 
      : []) || [];

  const [liked, setLiked] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "flex w-full group py-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex flex-col relative",
        isUser ? "items-end max-w-[80%]" : "items-start max-w-full md:max-w-[90%]"
      )}>
        
        <div className={cn(
          "px-5 py-3.5",
          isUser 
            ? "bg-muted text-foreground border border-border/40 rounded-2xl rounded-tr-sm text-[15px] font-normal leading-relaxed shadow-sm" 
            : "bg-transparent text-foreground text-[15px] w-full"
        )}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{textContent}</div>
          ) : (message.id === "loading" || (!textContent && message.role === "assistant" && !toolInvocations.length)) ? (
            <Loader variant="typing" size="sm" className="opacity-70" />
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {textContent && <MessageRenderer content={textContent} />}
              {toolInvocations && toolInvocations.length > 0 && (
                <div className="flex flex-col gap-1 w-full mt-1">
                  {toolInvocations.map((toolInvocation: any) => (
                    <ToolCall key={toolInvocation.toolCallId} toolInvocation={toolInvocation} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action Bar (Assistant Only) */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className={cn("flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/80 transition-colors", copied ? "text-green-500" : "text-muted-foreground")}
              title="Copy to clipboard"
            >
              <Copy01Icon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setLiked(true)}
              className={cn("flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/80 transition-colors", liked === true ? "text-green-500 bg-green-500/10" : "text-muted-foreground")}
              title="Helpful"
            >
              <ThumbsUpIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setLiked(false)}
              className={cn("flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/80 transition-colors", liked === false ? "text-destructive bg-destructive/10" : "text-muted-foreground")}
              title="Not helpful"
            >
              <ThumbsDownIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
