"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

// --- 1. CALCULATOR CARD ---
interface CalculatorResult {
  result: number;
}

export function CalculatorCard({ args, result }: { args: { expression: string }; result?: CalculatorResult }) {
  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.result.toString());
      toast.success("Result copied to clipboard");
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-background/40 p-4 border border-border/40 rounded-xl">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Expression</span>
        <span className="text-[14px] font-mono font-medium text-foreground bg-muted/30 px-3 py-1.5 rounded-md mt-1 border border-border/10">
          {args.expression}
        </span>
      </div>
      
      {result && (
        <div className="flex items-end justify-between mt-1 bg-emerald-500/5 border border-emerald-500/10 px-4 py-3 rounded-lg">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/90 dark:text-emerald-400/90">Result</span>
            <span className="text-xl font-mono font-bold text-foreground mt-0.5">{result.result}</span>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center justify-center p-2 rounded-lg bg-background border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Copy result"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// --- 2. WEB SEARCH CARD ---
interface SearchItem {
  citation: string;
  title: string;
  url: string;
  snippet: string;
}

interface SearchResult {
  query: string;
  results: SearchItem[];
}

export function WebSearchCard({ args, result }: { args: { query: string }; result?: SearchResult }) {
  return (
    <div className="flex flex-col gap-3.5 w-full bg-background/40 p-4 border border-border/40 rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Search Query</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground max-w-[200px] truncate">
          {args.query}
        </span>
      </div>

      {result && result.results && result.results.length > 0 ? (
        <div className="flex flex-col gap-3 mt-1.5">
          {result.results.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col gap-1 text-[13px] group border-b border-border/10 last:border-b-0 pb-3 last:pb-0"
            >
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-muted-foreground/70">{item.citation}</span>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-semibold text-primary hover:underline transition-colors flex items-center gap-1 leading-snug"
                >
                  {item.title}
                  <svg className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <span className="text-[11px] text-muted-foreground/80 break-all leading-normal hover:text-foreground/90 transition-colors">
                {item.url}
              </span>
              <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">
                {item.snippet}
              </p>
            </motion.div>
          ))}
        </div>
      ) : result ? (
        <div className="text-xs text-muted-foreground py-2 italic">No search results found.</div>
      ) : null}
    </div>
  );
}

// --- 3. FETCH URL CARD ---
interface FetchUrlResult {
  url: string;
  title: string;
  content: string;
}

export function FetchUrlCard({ args, result }: { args: { url: string }; result?: FetchUrlResult }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const domain = new URL(args.url).hostname;
  const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

  // Generate a basic summary of contents (first 250 characters)
  const summary = result?.content
    ? result.content.substring(0, 250) + (result.content.length > 250 ? "..." : "")
    : "";

  return (
    <div className="flex flex-col gap-3 w-full bg-background/40 p-4 border border-border/40 rounded-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img 
            src={faviconUrl} 
            alt="" 
            className="h-4.5 w-4.5 rounded bg-muted-foreground/10 shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-semibold text-foreground truncate">
              {result?.title || domain}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">{args.url}</span>
          </div>
        </div>
        
        {result && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/50 bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            aria-label={isExpanded ? "Collapse webpage content" : "Expand webpage content"}
          >
            {isExpanded ? "Collapse" : "View content"}
            <svg 
              className={cn("h-3.5 w-3.5 transform transition-transform duration-200", isExpanded && "rotate-180")} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {result ? (
        <div className="flex flex-col gap-2 mt-1">
          <div className="text-xs text-muted-foreground/80 leading-relaxed font-sans italic border-l-2 border-border/60 pl-3">
            {summary}
          </div>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/10 mt-2">
                  <div className="text-[10px] font-sans font-semibold text-muted-foreground/60 mb-2 uppercase tracking-widest">Full Extracted Text</div>
                  <pre className="p-3 bg-muted/40 border border-border/10 rounded-lg overflow-y-auto text-[11px] leading-relaxed max-h-60 whitespace-pre-wrap font-mono">
                    {result.content}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <svg className="animate-spin h-3.5 w-3.5 text-muted-foreground/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Fetching page data...
        </div>
      )}
    </div>
  );
}

// --- 4. SEARCH CONVERSATIONS CARD ---
interface ConversationItem {
  id: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  lastMessageAt: string;
  createdAt: string;
}

interface ConversationResult {
  conversations: ConversationItem[];
}

export function ConversationsCard({ result }: { result?: ConversationResult }) {
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-3.5 w-full bg-background/40 p-4 border border-border/40 rounded-xl">
      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Matching Conversations</div>

      {result && result.conversations && result.conversations.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5">
          {result.conversations.map((chat) => (
            <Link 
              key={chat.id} 
              href={`/chat/${chat.id}`}
              className="flex items-center justify-between p-3.5 rounded-lg border border-border/50 bg-background/60 hover:bg-muted/80 hover:border-border transition-all group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <div className="flex flex-col gap-1 overflow-hidden pr-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-semibold text-[13.5px] text-foreground truncate group-hover:text-primary transition-colors">
                    {chat.title}
                  </span>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {chat.isPinned && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Pinned
                      </span>
                    )}
                    {chat.isArchived && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        Archived
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10.5px] text-muted-foreground/80 font-medium">
                  Last updated: {formatDate(chat.lastMessageAt)}
                </span>
              </div>

              <div className="text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : result ? (
        <div className="text-xs text-muted-foreground py-1 italic">No matching conversations found.</div>
      ) : null}
    </div>
  );
}

// --- 5. SEARCH MESSAGES CARD ---
interface MessageItem {
  messageId: string;
  role: string;
  preview: string;
  createdAt: string;
  conversation: {
    id: string;
    title: string;
  };
}

interface MessageResult {
  query: string;
  messages: MessageItem[];
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-500/25 text-foreground font-semibold px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export function MessagesCard({ result }: { result?: MessageResult }) {
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-3.5 w-full bg-background/40 p-4 border border-border/40 rounded-xl">
      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Matching Messages</div>

      {result && result.messages && result.messages.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {result.messages.map((msg) => (
            <Link 
              key={msg.messageId} 
              href={`/chat/${msg.conversation.id}`}
              className="flex flex-col gap-1.5 p-3.5 rounded-lg border border-border/50 bg-background/60 hover:bg-muted/80 hover:border-border transition-all group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between gap-2.5">
                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                  {msg.conversation.title}
                </span>
                <span className="text-[10px] text-muted-foreground/80 shrink-0 font-medium font-sans">
                  {formatDate(msg.createdAt)}
                </span>
              </div>
              
              <p className="text-muted-foreground text-[12.5px] leading-relaxed bg-muted/20 border border-border/10 p-2.5 rounded-md italic">
                <HighlightText text={msg.preview} query={result.query} />
              </p>

              <div className="flex items-center gap-1 text-[10px] font-semibold text-primary/80 group-hover:text-primary transition-colors self-end">
                Jump to message
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : result ? (
        <div className="text-xs text-muted-foreground py-1 italic">No matching messages found.</div>
      ) : null}
    </div>
  );
}

// --- 6. DATE TIME CARD ---
interface DateTimeResult {
  iso: string;
  formatted: string;
  timezone: string;
  timestamp: number;
}

export function DateTimeCard({ result }: { result?: DateTimeResult }) {
  if (!result) return null;

  // Format date and time fields nicely from the formatted property or ISO
  const parsedDate = new Date(result.iso);
  const displayDate = parsedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const displayTime = parsedDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full bg-background/40 p-4 border border-border/40 rounded-xl">
      <div className="flex flex-col border-b md:border-b-0 md:border-r border-border/20 pb-3 md:pb-0 pr-0 md:pr-4">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Date</span>
        <span className="text-[14px] font-semibold text-foreground mt-1 leading-snug">
          {displayDate}
        </span>
      </div>

      <div className="flex flex-col pl-0 md:pl-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Time & Timezone</span>
        <span className="text-[14px] font-semibold text-foreground mt-1 leading-snug">
          {displayTime}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/90 font-medium mt-0.5">
          {result.timezone} ({result.formatted.split(" ").pop()})
        </span>
      </div>
    </div>
  );
}
