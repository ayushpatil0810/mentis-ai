"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatsAction, deleteChatAction, updateChatAction } from "@/app/actions/chat";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  PinIcon, 
  ArchiveIcon, 
  Delete02Icon, 
  Edit02Icon, 
  Share01Icon,
  MoreHorizontalIcon
} from "hugeicons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const chatId = pathname?.startsWith("/chat/") ? pathname.split("/").pop() : null;

  const { data: chats = [] } = useQuery({
    queryKey: ["chats"],
    queryFn: () => getChatsAction(),
  });

  const currentChat = chats.find((c: any) => c.id === chatId);

  const updateChatMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateChatAction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
  });

  const deleteChatMutation = useMutation({
    mutationFn: (id: string) => deleteChatAction(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      if (pathname === `/chat/${deletedId}`) {
        router.push("/");
      }
      toast.success("Chat deleted");
    },
  });

  const handleRename = () => {
    if (!currentChat) return;
    const newTitle = window.prompt("Enter new title:", currentChat.title);
    if (newTitle && newTitle.trim() !== currentChat.title) {
      updateChatMutation.mutate({ id: currentChat.id, data: { title: newTitle.trim() } });
    }
  };

  const handleShare = () => {
    if (!currentChat) return;
    // Mock share functionality for now
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <header className="flex min-h-12 items-center justify-between gap-4 py-1.5 px-4 bg-transparent">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="shrink-0 lg:hidden text-muted-foreground hover:text-foreground hover:bg-transparent" />
        {currentChat && (
          <h1 className="text-sm font-semibold truncate hidden md:block max-w-[200px] lg:max-w-[400px]">
            {currentChat.title}
          </h1>
        )}
      </div>

      {currentChat && (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={handleShare} title="Share" className="h-8 w-8 hover:bg-muted/50 text-muted-foreground hover:text-foreground">
            <Share01Icon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => updateChatMutation.mutate({ id: currentChat.id, data: { isPinned: !currentChat.isPinned } })} 
            title={currentChat.isPinned ? "Unpin" : "Pin"}
            className="h-8 w-8 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
          >
            <PinIcon className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50 text-muted-foreground hover:text-foreground">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border shadow-sm rounded-lg min-w-[160px]">
              <DropdownMenuItem onClick={handleRename} className="text-[13px] cursor-pointer">
                <Edit02Icon className="mr-2 h-3.5 w-3.5 opacity-70" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateChatMutation.mutate({ id: currentChat.id, data: { isArchived: !currentChat.isArchived } })} className="text-[13px] cursor-pointer">
                <ArchiveIcon className="mr-2 h-3.5 w-3.5 opacity-70" /> {currentChat.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive text-[13px] cursor-pointer" onClick={() => {
                if (window.confirm("Are you sure you want to delete this chat?")) {
                  deleteChatMutation.mutate(currentChat.id);
                }
              }}>
                <Delete02Icon className="mr-2 h-3.5 w-3.5 opacity-70" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
