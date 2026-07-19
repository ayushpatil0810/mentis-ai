"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Globe, 
  Calculator, 
  Calendar, 
  PlusCircle, 
  Share2, 
  GitBranch, 
  Download, 
  Settings, 
  HelpCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Command {
  name: string;
  description: string;
  icon: any;
  hint: string;
  action: (onChange: (v: string) => void, router: any) => void;
}

export const SLASH_COMMANDS: Command[] = [
  {
    name: "search",
    description: "Search the web for a query",
    icon: Search,
    hint: "/search <query>",
    action: (onChange) => onChange("/search "),
  },
  {
    name: "url",
    description: "Analyze a webpage URL",
    icon: Globe,
    hint: "/url <url>",
    action: (onChange) => onChange("/url "),
  },
  {
    name: "calculate",
    description: "Calculate mathematical expressions",
    icon: Calculator,
    hint: "/calculate <expression>",
    action: (onChange) => onChange("/calculate "),
  },
  {
    name: "date",
    description: "Insert current date and time",
    icon: Calendar,
    hint: "/date",
    action: (onChange) => {
      onChange(`Current Date and Time: ${new Date().toLocaleString()}`);
    },
  },
  {
    name: "new",
    description: "Start a new conversation",
    icon: PlusCircle,
    hint: "/new",
    action: (_, router) => router.push("/"),
  },
  {
    name: "share",
    description: "Open the share dialog",
    icon: Share2,
    hint: "/share",
    action: () => window.dispatchEvent(new CustomEvent("trigger-chat-share")),
  },
  {
    name: "branch",
    description: "Branch the conversation",
    icon: GitBranch,
    hint: "/branch",
    action: () => window.dispatchEvent(new CustomEvent("trigger-chat-branch")),
  },
  {
    name: "export",
    description: "Open the export dialog",
    icon: Download,
    hint: "/export",
    action: () => window.dispatchEvent(new CustomEvent("trigger-chat-export")),
  },
  {
    name: "settings",
    description: "Open user settings",
    icon: Settings,
    hint: "/settings",
    action: () => window.dispatchEvent(new CustomEvent("open-settings")),
  },
  {
    name: "help",
    description: "Display help information",
    icon: HelpCircle,
    hint: "/help",
    action: (onChange) => {
      onChange(
        `Available Slash Commands:\n` +
        `• /search <query> - Search the web\n` +
        `• /url <url> - Analyze a URL\n` +
        `• /calculate <expr> - Calculator\n` +
        `• /date - Current date/time\n` +
        `• /new - New chat\n` +
        `• /share - Share chat\n` +
        `• /branch - Branch chat\n` +
        `• /export - Export chat\n` +
        `• /settings - Open settings`
      );
    },
  },
];

interface SlashCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (val: string) => void;
  activeIndex: number;
  setActiveIndex: (idx: number) => void;
  filteredCommands: Command[];
}

export function SlashCommandMenu({
  isOpen,
  onClose,
  value,
  onChange,
  activeIndex,
  setActiveIndex,
  filteredCommands,
}: SlashCommandMenuProps) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view if overflowed
  useEffect(() => {
    if (listRef.current && activeIndex >= 0) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        const parent = listRef.current;
        const parentTop = parent.scrollTop;
        const parentBottom = parentTop + parent.clientHeight;
        const elemTop = activeEl.offsetTop;
        const elemBottom = elemTop + activeEl.offsetHeight;

        if (elemBottom > parentBottom) {
          parent.scrollTop = elemBottom - parent.clientHeight;
        } else if (elemTop < parentTop) {
          parent.scrollTop = elemTop;
        }
      }
    }
  }, [activeIndex]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute bottom-full left-0 mb-2 w-full max-w-[320px] sm:max-w-[380px]",
        "bg-popover text-popover-foreground border border-border/60 shadow-xl rounded-2xl overflow-hidden z-50",
        "animate-in fade-in slide-in-from-bottom-2 duration-150"
      )}
    >
      <div className="px-3.5 py-2 border-b border-border/30 bg-muted/30">
        <span className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider block">
          Commands
        </span>
      </div>
      <div
        ref={listRef}
        className="max-h-[220px] overflow-y-auto p-1.5 flex flex-col gap-0.5 scrollbar-hide"
      >
        {filteredCommands.map((cmd, idx) => {
          const Icon = cmd.icon;
          const isActive = idx === activeIndex;

          return (
            <button
              key={cmd.name}
              type="button"
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => {
                cmd.action(onChange, router);
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg border",
                  isActive
                    ? "bg-background border-border/60 text-primary"
                    : "bg-muted/50 border-transparent text-muted-foreground/70"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13.5px] font-semibold text-foreground block leading-normal">
                  /{cmd.name}
                </span>
                <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                  {cmd.description}
                </span>
              </div>
              <span className="text-[10px] font-mono opacity-50 px-1.5 py-0.5 bg-muted/60 rounded">
                {cmd.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
