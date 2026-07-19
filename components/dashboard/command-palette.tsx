"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { globalSearchAction } from "@/app/actions/search";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Plus,
  Settings,
  Download,
  Share2,
  GitBranch,
  Archive,
  Pin,
  Sun,
  Moon,
  LogOut,
  MessageSquare,
  Search,
  Sparkles,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  conversations: any[];
  messages: any[];
  shared: any[];
  branches: any[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  // Listen for global open event and shortcuts
  useEffect(() => {
    const handleOpen = (e: any) => {
      setOpen(true);
      if (e.detail?.search) {
        // Pre-focus input if triggered by Search shortcut
        setTimeout(() => {
          const input = document.querySelector("[cmdk-input]") as HTMLInputElement | null;
          if (input) input.focus();
        }, 100);
      }
    };
    window.addEventListener("open-command-palette", handleOpen);
    return () => window.removeEventListener("open-command-palette", handleOpen);
  }, []);

  // Debounced search fetching
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchResults(null);
      return;
    }

    // Always fetch initial recent items or results
    setIsLoading(true);
    const delay = query.trim() ? 300 : 0;
    const handler = setTimeout(async () => {
      try {
        const res = await globalSearchAction(query);
        if (res.success) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [query, open]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const isChatActive = pathname.startsWith("/chat/");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search conversations..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="scrollbar-hide max-h-[400px]">
        {isLoading && (
          <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
            Searching records...
          </div>
        )}

        <CommandEmpty>No results found.</CommandEmpty>

        {/* Global Search Results - Conversations */}
        {searchResults && searchResults.conversations.length > 0 && (
          <CommandGroup heading={query ? "Conversations" : "Recent Conversations"}>
            {searchResults.conversations.map((c) => (
              <CommandItem
                key={c.id}
                onSelect={() =>
                  runCommand(() => {
                    router.push(`/chat/${c.id}`);
                  })
                }
                className="cursor-pointer gap-2"
              >
                <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                <div className="flex-1 truncate">
                  <span
                    dangerouslySetInnerHTML={{ __html: c.highlightedTitle || c.title }}
                    className="font-medium text-foreground [&_mark]:bg-yellow-500/20 [&_mark]:text-yellow-600 dark:[&_mark]:text-yellow-400 [&_mark]:font-medium [&_mark]:px-0.5 [&_mark]:rounded"
                  />
                </div>
                {c.isPinned && (
                  <Pin className="h-3 w-3 shrink-0 opacity-40 fill-current" />
                )}
                {c.isArchived && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded opacity-50">Archived</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Global Search Results - Branches */}
        {searchResults && searchResults.branches.length > 0 && (
          <CommandGroup heading="Branches">
            {searchResults.branches.map((b) => (
              <CommandItem
                key={b.id}
                onSelect={() =>
                  runCommand(() => {
                    router.push(`/chat/${b.id}`);
                  })
                }
                className="cursor-pointer gap-2"
              >
                <GitBranch className="h-4 w-4 shrink-0 opacity-60 text-primary" />
                <div className="flex-1 truncate">
                  <span
                    dangerouslySetInnerHTML={{ __html: b.highlightedTitle || b.title }}
                    className="font-medium text-foreground [&_mark]:bg-yellow-500/20 [&_mark]:text-yellow-600 dark:[&_mark]:text-yellow-400 [&_mark]:font-medium [&_mark]:px-0.5 [&_mark]:rounded"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground/60 opacity-80">Branch</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Global Search Results - Shared */}
        {searchResults && searchResults.shared.length > 0 && (
          <CommandGroup heading="Shared Conversations">
            {searchResults.shared.map((s) => (
              <CommandItem
                key={s.id}
                onSelect={() =>
                  runCommand(() => {
                    router.push(`/chat/${s.id}`);
                  })
                }
                className="cursor-pointer gap-2"
              >
                <Share2 className="h-4 w-4 shrink-0 opacity-60 text-emerald-500" />
                <div className="flex-1 truncate">
                  <span
                    dangerouslySetInnerHTML={{ __html: s.highlightedTitle || s.title }}
                    className="font-medium text-foreground [&_mark]:bg-yellow-500/20 [&_mark]:text-yellow-600 dark:[&_mark]:text-yellow-400 [&_mark]:font-medium [&_mark]:px-0.5 [&_mark]:rounded"
                  />
                </div>
                <span className="text-[10px] text-emerald-500/80 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">Shared</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Global Search Results - Messages */}
        {searchResults && searchResults.messages.length > 0 && (
          <CommandGroup heading="Message Content Matches">
            {searchResults.messages.map((m) => (
              <CommandItem
                key={m.id}
                onSelect={() =>
                  runCommand(() => {
                    router.push(`/chat/${m.chatId}?msg=${m.id}`);
                  })
                }
                className="cursor-pointer flex flex-col items-start gap-1 p-3 rounded-lg"
              >
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80 truncate max-w-[200px]">
                    in: {m.chatTitle}
                  </span>
                  <span className="text-[10px] opacity-75">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div 
                  dangerouslySetInnerHTML={{ __html: m.highlightedContent || m.content }}
                  className="text-xs text-muted-foreground/90 line-clamp-2 w-full pl-1 border-l border-border/40 [&_mark]:bg-yellow-500/20 [&_mark]:text-yellow-600 dark:[&_mark]:text-yellow-400 [&_mark]:font-medium [&_mark]:px-0.5 [&_mark]:rounded"
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Action Commands */}
        <CommandGroup heading="Commands & Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                router.push("/");
              })
            }
            className="cursor-pointer gap-2"
          >
            <Plus className="h-4 w-4 opacity-60" />
            <span>New Conversation</span>
            <kbd className="ml-auto text-[10px] font-mono opacity-50 bg-muted px-1.5 py-0.5 rounded">Ctrl+N</kbd>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.dispatchEvent(new CustomEvent("open-settings"));
              })
            }
            className="cursor-pointer gap-2"
          >
            <Settings className="h-4 w-4 opacity-60" />
            <span>Open Settings</span>
          </CommandItem>

          {isChatActive && (
            <>
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    window.dispatchEvent(new CustomEvent("trigger-chat-export"));
                  })
                }
                className="cursor-pointer gap-2"
              >
                <Download className="h-4 w-4 opacity-60" />
                <span>Export Conversation</span>
                <kbd className="ml-auto text-[10px] font-mono opacity-50 bg-muted px-1.5 py-0.5 rounded">Ctrl+E</kbd>
              </CommandItem>

              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    window.dispatchEvent(new CustomEvent("trigger-chat-share"));
                  })
                }
                className="cursor-pointer gap-2"
              >
                <Share2 className="h-4 w-4 opacity-60" />
                <span>Share Conversation</span>
                <kbd className="ml-auto text-[10px] font-mono opacity-50 bg-muted px-1.5 py-0.5 rounded">Ctrl+Shift+S</kbd>
              </CommandItem>

              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    window.dispatchEvent(new CustomEvent("trigger-chat-branch"));
                  })
                }
                className="cursor-pointer gap-2"
              >
                <GitBranch className="h-4 w-4 opacity-60" />
                <span>Branch Conversation</span>
              </CommandItem>

              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    window.dispatchEvent(new CustomEvent("trigger-chat-archive"));
                  })
                }
                className="cursor-pointer gap-2"
              >
                <Archive className="h-4 w-4 opacity-60" />
                <span>Archive Conversation</span>
              </CommandItem>

              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    window.dispatchEvent(new CustomEvent("trigger-chat-pin"));
                  })
                }
                className="cursor-pointer gap-2"
              >
                <Pin className="h-4 w-4 opacity-60" />
                <span>Pin/Unpin Conversation</span>
              </CommandItem>
            </>
          )}

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                setTheme(theme === "dark" ? "light" : "dark");
              })
            }
            className="cursor-pointer gap-2"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 opacity-60" />
            ) : (
              <Moon className="h-4 w-4 opacity-60" />
            )}
            <span>Toggle Theme</span>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(async () => {
                try {
                  await authClient.signOut();
                  toast.success("Signed out successfully");
                  router.push("/login");
                } catch (e) {
                  toast.error("Failed to sign out");
                }
              })
            }
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
          >
            <LogOut className="h-4 w-4 opacity-60" />
            <span>Logout</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
