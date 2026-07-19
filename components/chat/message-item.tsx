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
        
        {/* Content Bubble */}
        <div className={cn(
          "px-5 py-3.5",
          isUser 
            ? "bg-foreground text-background rounded-3xl rounded-tr-sm text-[15px] font-medium leading-relaxed" 
            : "bg-transparent text-foreground text-[15px] w-full"
        )}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{textContent}</div>
          ) : (message.id === "loading" || (!textContent && message.role === "assistant" && !message.toolInvocations?.length)) ? (
            <Loader variant="typing" size="sm" className="opacity-70" />
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {textContent && <MessageRenderer content={textContent} />}
              {message.toolInvocations && message.toolInvocations.length > 0 && (
                <div className="flex flex-col gap-1 w-full mt-1">
                  {message.toolInvocations.map((toolInvocation: any) => (
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
