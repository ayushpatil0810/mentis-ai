"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatsAction, deleteChatAction, updateChatAction } from "@/app/actions/chat";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ThemeToggle } from "../ui/theme-toggle";
import { SettingsModal } from "@/components/settings/settings-modal";
import { 
  MoreHorizontalIcon, 
  PinIcon, 
  ArchiveIcon, 
  Delete02Icon, 
  Edit02Icon,  
  Search01Icon,
  Message01Icon,
  Settings01Icon,
  BrainIcon,
  SidebarLeft01Icon
} from "hugeicons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
  isDesktopCollapsed?: boolean;
  setIsDesktopCollapsed?: (val: boolean) => void;
}

export function DashboardSidebar({ isMobileMenuOpen, setIsMobileMenuOpen, isDesktopCollapsed = false, setIsDesktopCollapsed }: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<any>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [chatToDelete, setChatToDelete] = useState<any>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => getChatsAction(),
    staleTime: 60000, // 1 minute
  });

  const chats = response?.success ? response.data : [];

  const updateChatMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await updateChatAction(id, data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteChatAction(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      if (pathname === `/chat/${deletedId}`) {
        router.push("/");
      }
      toast.success("Chat deleted");
    },
  });

  const pinnedChats = chats.filter((c: any) => c.isPinned && !c.isArchived);
  const recentChats = chats.filter((c: any) => !c.isPinned && !c.isArchived);

  const handleRename = (chat: any) => {
    setChatToRename(chat);
    setRenameTitle(chat.title);
  };

  const renderSection = (title: string, list: any[]) => {
    if (list.length === 0) return null;
    return (
      <div className={cn("mb-6 transition-opacity duration-200", isDesktopCollapsed ? "opacity-0 hidden" : "opacity-100")}>
        <h3 className="px-4 text-xs font-medium text-muted-foreground/60 mb-2 tracking-wide">
          {title}
        </h3>
        <div className="flex flex-col gap-0.5 px-2">
          {list.map((chat) => {
            const isActive = pathname === `/chat/${chat.id}`;
            return (
              <div key={chat.id} className="group relative flex items-center w-full">
                <Link 
                  href={`/chat/${chat.id}`}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] transition-all duration-200 select-none",
                    isActive 
                      ? "bg-accent text-accent-foreground font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-normal"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Message01Icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate flex-1">{chat.title}</span>
                </Link>
                
                <div className={cn(
                  "absolute right-2 flex items-center",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                )}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors">
                        <MoreHorizontalIcon className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="right" className="min-w-[160px] p-1 rounded-xl shadow-lg border-border/50">
                      <DropdownMenuItem onClick={() => handleRename(chat)} className="rounded-lg text-[13px] py-1.5 cursor-pointer">
                        <Edit02Icon className="mr-2 h-3.5 w-3.5 opacity-60" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateChatMutation.mutate({ id: chat.id, data: { isPinned: !chat.isPinned } })} className="rounded-lg text-[13px] py-1.5 cursor-pointer">
                        <PinIcon className="mr-2 h-3.5 w-3.5 opacity-60" /> {chat.isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateChatMutation.mutate({ id: chat.id, data: { isArchived: !chat.isArchived } })} className="rounded-lg text-[13px] py-1.5 cursor-pointer">
                        <ArchiveIcon className="mr-2 h-3.5 w-3.5 opacity-60" /> {chat.isArchived ? "Unarchive" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/40 my-1" />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg text-[13px] py-1.5 cursor-pointer" onClick={() => {
                        setChatToDelete(chat);
                      }}>
                        <Delete02Icon className="mr-2 h-3.5 w-3.5 opacity-60" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 bg-sidebar flex flex-col transition-all duration-300 ease-out border-r border-border/0 md:border-border/0",
        isMobileMenuOpen ? "translate-x-0 w-[260px]" : "-translate-x-full md:translate-x-0",
        isDesktopCollapsed ? "md:w-[0px] md:opacity-0 md:overflow-hidden" : "md:w-[260px]"
      )}>
        <div className="flex flex-col h-full w-[260px]">
          {/* Header / Brand */}
          <div className="h-14 flex items-center justify-between px-4 shrink-0 mt-2">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80" onClick={() => setIsMobileMenuOpen(false)}>
              <Image 
                src="/logo.png" 
                alt="Mentis AI Logo" 
                width={28} 
                height={28} 
                className="rounded-lg object-contain"
                priority
              />
              <span className="font-semibold tracking-tight text-[16px]">Mentis AI</span>
            </Link>
            
            {setIsDesktopCollapsed && (
              <button 
                onClick={() => setIsDesktopCollapsed(true)}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Collapse Sidebar"
              >
                <SidebarLeft01Icon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Global Actions */}
          <div className="px-3 pt-4 pb-4 shrink-0 flex flex-col gap-1">
            <button 
              className="flex items-center gap-2.5 h-9 px-3 w-full rounded-lg bg-foreground text-background hover:opacity-90 transition-all text-[13px] font-medium shadow-sm active:scale-[0.98]"
              onClick={() => {
                router.push('/');
                setIsMobileMenuOpen(false);
              }}
            >
              <Edit02Icon className="w-4 h-4" />
              <span>New Chat</span>
            </button>
            
            <button className="flex items-center justify-between h-9 px-3 w-full rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all text-[13px] mt-1 border border-transparent hover:border-border/50 shadow-none">
              <div className="flex items-center gap-2.5">
                <Search01Icon className="w-4 h-4 opacity-70" />
                <span>Search</span>
              </div>
              <div className="flex items-center gap-0.5 opacity-60">
                <kbd className="font-sans text-[10px] bg-muted/80 rounded px-1.5 py-0.5">⌘</kbd>
                <kbd className="font-sans text-[10px] bg-muted/80 rounded px-1.5 py-0.5">K</kbd>
              </div>
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
            {isLoading ? (
              <div className="px-5 py-3 flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-5 bg-muted rounded-md w-full animate-pulse opacity-50" />
                ))}
              </div>
            ) : (
              <>
                {chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                    <Message01Icon className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground/60">No chats yet</p>
                    <p className="text-xs text-muted-foreground/40 mt-1">Start a new conversation</p>
                  </div>
                ) : (
                  <>
                    {renderSection("Pinned", pinnedChats)}
                    {renderSection("Recent", recentChats)}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 shrink-0 flex flex-col gap-1 bg-sidebar">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex-1 flex items-center gap-2.5 h-9 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-[13px] font-medium"
              >
                <Settings01Icon className="w-4 h-4 opacity-70" />
                <span>Settings</span>
              </button>
              <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      <Dialog open={!!chatToRename} onOpenChange={(open) => !open && setChatToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={renameTitle} 
              onChange={e => setRenameTitle(e.target.value)} 
              placeholder="Enter new chat title"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (renameTitle && renameTitle.trim() !== chatToRename?.title) {
                    updateChatMutation.mutate({ id: chatToRename.id, data: { title: renameTitle.trim() } });
                  }
                  setChatToRename(null);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChatToRename(null)}>Cancel</Button>
            <Button onClick={() => {
              if (renameTitle && renameTitle.trim() !== chatToRename?.title) {
                updateChatMutation.mutate({ id: chatToRename.id, data: { title: renameTitle.trim() } });
              }
              setChatToRename(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChatToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              deleteChatMutation.mutate(chatToDelete.id);
              setChatToDelete(null);
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
