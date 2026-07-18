"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatsAction, createChatAction, deleteChatAction, updateChatAction } from "@/app/actions/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHoriz, Pin, Archive, Trash, Edit, ChatLines } from "iconoir-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function ChatItem({ chat, isActive, updateMutation, deleteMutation }: any) {
  const handleRename = () => {
    const newTitle = window.prompt("Enter new title:", chat.title);
    if (newTitle && newTitle.trim() !== chat.title) {
      updateMutation.mutate({ id: chat.id, data: { title: newTitle.trim() } });
    }
  };

  return (
    <div className={cn(
      "group flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm", 
      isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
    )}>
      <Link href={`/chat/${chat.id}`} className="flex-1 truncate block py-1">
        {chat.title}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHoriz className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleRename}>
            <Edit className="mr-2 h-4 w-4" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: chat.id, data: { isPinned: !chat.isPinned } })}>
            <Pin className="mr-2 h-4 w-4" /> {chat.isPinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: chat.id, data: { isArchived: !chat.isArchived } })}>
            <Archive className="mr-2 h-4 w-4" /> {chat.isArchived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => {
            if (window.confirm("Are you sure you want to delete this chat?")) {
              deleteMutation.mutate(chat.id);
            }
          }}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => getChatsAction(),
  });

  const createChatMutation = useMutation({
    mutationFn: () => createChatAction({ title: "New Chat" }),
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      router.push(`/chat/${newChat.id}`);
    },
  });

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

  const pinnedChats = chats.filter((c: any) => c.isPinned && !c.isArchived);
  const recentChats = chats.filter((c: any) => !c.isPinned && !c.isArchived);
  const archivedChats = chats.filter((c: any) => c.isArchived);

  const renderSection = (title: string, list: any[]) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="px-4 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
          {title}
        </h4>
        <div className="space-y-1 px-2">
          {list.map(chat => (
            <ChatItem 
              key={chat.id}
              chat={chat}
              isActive={pathname === `/chat/${chat.id}`}
              updateMutation={updateChatMutation}
              deleteMutation={deleteChatMutation}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 border-r bg-muted/20 flex flex-col h-full flex-shrink-0">
      <div className="p-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg flex items-center gap-2">
          <ChatLines className="h-5 w-5" /> Mentis AI
        </Link>
      </div>
      
      <div className="px-4 pb-4">
        <Button 
          onClick={() => createChatMutation.mutate()} 
          disabled={createChatMutation.isPending}
          className="w-full justify-start rounded-full bg-background hover:bg-muted text-foreground border shadow-sm h-10"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="px-4 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="pb-4">
            {renderSection("Pinned", pinnedChats)}
            {renderSection("Recent", recentChats)}
            {renderSection("Archived", archivedChats)}
            
            {chats.length === 0 && (
              <div className="px-4 text-sm text-muted-foreground text-center mt-10">
                No conversations yet
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
