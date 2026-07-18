"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatsAction, deleteChatAction, updateChatAction } from "@/app/actions/chat";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ThemeToggle } from "../ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Hugeicons-react icons (assuming standard names)
import { 
  MoreHorizontalIcon, 
  PinIcon, 
  ArchiveIcon, 
  Delete02Icon, 
  Edit02Icon,  
  ArrowDown01Icon,
  SidebarRightIcon,
  SidebarLeftIcon
} from "hugeicons-react";
import { SettingsModal } from "@/components/settings/settings-modal";
import { authClient } from "@/lib/auth/auth-client";

export function DashboardSidebar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toggleSidebar } = useSidebar();

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => getChatsAction(),
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

  const handleRename = (chat: any) => {
    const newTitle = window.prompt("Enter new title:", chat.title);
    if (newTitle && newTitle.trim() !== chat.title) {
      updateChatMutation.mutate({ id: chat.id, data: { title: newTitle.trim() } });
    }
  };

  const renderSection = (title: string, list: any[]) => {
    if (list.length === 0) return null;
    return (
      <SidebarGroup key={title} className="p-0 mb-4 group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="h-8 px-4 text-[11px] font-semibold text-muted-foreground/60 tracking-widest uppercase">
          {title}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5 px-2">
            {list.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <div className="flex items-center group w-full">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/chat/${chat.id}`}
                    tooltip={chat.title}
                    className={cn(
                      'h-8 flex-1 gap-3 rounded-md px-3 text-[13px] transition-colors',
                      pathname === `/chat/${chat.id}`
                        ? 'bg-muted/50 text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground font-normal',
                    )}
                  >
                    <Link href={`/chat/${chat.id}`}>
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted/50">
                        <MoreHorizontalIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="border-border shadow-sm rounded-lg min-w-[160px]">
                      <DropdownMenuItem onClick={() => handleRename(chat)} className="text-[13px] cursor-pointer">
                        <Edit02Icon className="mr-2 h-3.5 w-3.5 opacity-70" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateChatMutation.mutate({ id: chat.id, data: { isPinned: !chat.isPinned } })} className="text-[13px] cursor-pointer">
                        <PinIcon className="mr-2 h-3.5 w-3.5 opacity-70" /> {chat.isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateChatMutation.mutate({ id: chat.id, data: { isArchived: !chat.isArchived } })} className="text-[13px] cursor-pointer">
                        <ArchiveIcon className="mr-2 h-3.5 w-3.5 opacity-70" /> {chat.isArchived ? "Unarchive" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive text-[13px] cursor-pointer" onClick={() => {
                        if (window.confirm("Are you sure you want to delete this chat?")) {
                          deleteChatMutation.mutate(chat.id);
                        }
                      }}>
                        <Delete02Icon className="mr-2 h-3.5 w-3.5 opacity-70" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 border-r-border/0 bg-transparent">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-10 px-2 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:p-0 hover:bg-transparent"
            >
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.png" alt="Mentis AI Logo" width={24} height={24} className="object-contain" />
                <span className="text-base font-semibold tracking-tight">Mentis</span>
              </Link>
            </SidebarMenuButton>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="group-data-[collapsible=icon]:hidden h-8 w-8 ml-auto hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            >
              <SidebarLeftIcon className="h-4 w-4" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            
            <button 
              onClick={toggleSidebar}
              className="hidden group-data-[collapsible=icon]:flex relative group/trigger items-center justify-center w-8 h-8 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Image src="/logo.png" alt="Mentis AI Logo" width={20} height={20} className="object-contain transition-opacity group-hover/trigger:opacity-0 absolute" />
              <SidebarRightIcon className="w-4 h-4 opacity-0 transition-opacity group-hover/trigger:opacity-100 absolute text-muted-foreground" />
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <div className="px-3 pb-2 pt-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <button 
          onClick={() => router.push('/')} 
          className="flex w-full items-center justify-center rounded-md bg-foreground h-8 px-3 text-[12px] font-medium text-background shadow-none transition-opacity hover:opacity-90 active:scale-[0.98] group-data-[collapsible=icon]:hidden"
        >
          <Edit02Icon className="mr-1.5 h-3.5 w-3.5" /> New chat
        </button>
        <button 
          onClick={() => router.push('/')} 
          className="hidden group-data-[collapsible=icon]:flex w-8 h-8 items-center justify-center rounded-md bg-foreground text-background shadow-none transition-opacity hover:opacity-90 p-0"
        >
          <Edit02Icon className="h-3.5 w-3.5" />
        </button>
      </div>

      <SidebarContent className="gap-2 p-1">
        {isLoading ? (
          <div className="px-4 py-2 text-[13px] text-muted-foreground/60 group-data-[collapsible=icon]:hidden">Loading...</div>
        ) : (
          <div className="pb-4 pt-2">
            {renderSection("Pinned", pinnedChats)}
            {renderSection("Recent", recentChats)}
            {renderSection("Archived", archivedChats)}
            
            {chats.length === 0 && (
              <div className="px-4 text-[13px] text-muted-foreground/50 text-center mt-10 group-data-[collapsible=icon]:hidden">
                No conversations
              </div>
            )}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="gap-3 px-3 pb-3">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem className="flex items-center gap-0 group-data-[collapsible=icon]:p-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="User profile"
                  className="flex h-10 items-center gap-2 rounded-md group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 hover:bg-muted/50"
                >
                  <Avatar className="size-6 shrink-0 rounded-sm">
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium rounded-sm">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 overflow-hidden text-left text-[13px] font-medium text-ellipsis whitespace-nowrap group-data-[collapsible=icon]:hidden">
                    User
                  </span>
                  <ArrowDown01Icon className="text-muted-foreground size-3.5 shrink-0 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 border-border shadow-sm rounded-lg"
                align="end"
                side="right"
                sideOffset={16}
              >
                <DropdownMenuItem className="text-[13px]" onClick={() => setIsSettingsOpen(true)}>Profile</DropdownMenuItem>
                <DropdownMenuItem className="text-[13px]" onClick={() => setIsSettingsOpen(true)}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem variant="destructive" className="text-[13px]" onClick={async () => {
                  await authClient.signOut();
                  router.push("/login");
                }}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="group-data-[collapsible=icon]:hidden ml-1">
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </Sidebar>
  );
}
