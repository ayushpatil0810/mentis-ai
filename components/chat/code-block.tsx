"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy01Icon, CheckmarkBadge01Icon } from "hugeicons-react";
import { cn } from "@/lib/utils";

export function CodeBlock({
  language,
  value,
  className,
}: {
  language: string;
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code", error);
    }
  };

  return (
    <div className={cn("my-4 flex flex-col overflow-hidden rounded-xl border border-border/50 bg-[#1d1f21] shadow-sm", className)}>
      <div className="flex items-center justify-between bg-[#16181a] px-4 py-2 border-b border-border/20">
        <span className="text-xs font-mono font-semibold tracking-wider text-muted-foreground uppercase">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <CheckmarkBadge01Icon className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy01Icon className="h-3.5 w-3.5" />
              Copy code
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto max-w-full text-[13px] [&>div]:!m-0 [&>div]:!p-4 [&>div]:!bg-transparent">
        <SyntaxHighlighter
          style={atomDark}
          language={language}
          PreTag="div"
          wrapLongLines={false}
          customStyle={{ margin: 0, padding: 0, backgroundColor: "transparent" }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
