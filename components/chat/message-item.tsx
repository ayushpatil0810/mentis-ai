"use client";

import { useState } from "react";
import { Copy01Icon, ThumbsUpIcon, ThumbsDownIcon } from "hugeicons-react";
import { toast } from "sonner";
import { MessageRenderer } from "./message-renderer";

export function MessageItem({ message }: { message: any }) {
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
    <div className="flex w-full group py-6 border-b border-border/30 last:border-0">
      <div className="flex w-full gap-4 md:gap-6">
        
        {/* Avatar/Indicator Column */}
        <div className="shrink-0 flex flex-col items-center pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shadow-sm">
              <span className="text-background font-bold text-xs">U</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-transparent border border-border/60 flex items-center justify-center shadow-sm">
              <span className="text-foreground font-bold text-xs">M</span>
            </div>
          )}
        </div>

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0 max-w-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[14px]">
              {isUser ? "You" : "Mentis AI"}
            </span>
            <span className="text-[12px] text-muted-foreground/60">
              {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>

          <div className={`w-full ${isUser ? "text-[15px] leading-relaxed font-medium text-foreground/90 mt-1" : "text-[15px]"}`}>
            {isUser ? (
              <div className="whitespace-pre-wrap">{textContent}</div>
            ) : (
              <MessageRenderer content={textContent} />
            )}
          </div>
          
          {/* Action Bar (Assistant Only) */}
          {!isUser && (
            <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className={`flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/80 text-muted-foreground transition-colors ${copied ? "text-green-500" : ""}`}
                title="Copy to clipboard"
              >
                <Copy01Icon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setLiked(true)}
                className={`flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/80 transition-colors ${liked === true ? "text-green-500 bg-green-500/10" : "text-muted-foreground"}`}
                title="Helpful"
              >
                <ThumbsUpIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setLiked(false)}
                className={`flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/80 transition-colors ${liked === false ? "text-destructive bg-destructive/10" : "text-muted-foreground"}`}
                title="Not helpful"
              >
                <ThumbsDownIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
