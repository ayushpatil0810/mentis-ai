"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { 
  getMessagesAction, 
  getChatByIdAction, 
  updateChatAction, 
  deleteChatAction, 
  branchChatAction, 
  getBranchesAction, 
  setActiveVersionAction 
} from "@/app/actions/chat";
import { getAvailableModelsAction } from "@/app/actions/models";
import { 
  createShareAction, 
  getShareByChatIdAction, 
  updateShareAction, 
  deleteShareAction, 
  setShareVisibilityAction 
} from "@/app/actions/share";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { ExportDialog } from "./export-dialog";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Loading01Icon, Key01Icon } from "hugeicons-react";
import { ChatContainerRoot } from "@/components/ui/chat-container";
import { ModelSelector } from "./model-selector";
import { mapDbMessagesToUiMessages } from "@/lib/tools/history-utils";
import { DEFAULT_CHAT_TITLE } from "@/lib/chat/title";
import { readSavedModel, saveModelPreference, pickDefaultModelId } from "@/lib/chat/model-preference";
import { patchCachedChat, peekInitialMessage, takeInitialMessage, waitForChatCreate } from "@/lib/chat/optimistic";
import { 
  GitBranch, Share, MoreHorizontal, Pin, Archive, Trash2, Edit, Check, Copy, Info, Download 
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ChatWindow({ chatId }: { chatId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightMsgId = searchParams.get("msg");
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(() => {
    const cached = queryClient.getQueryData<{ success: boolean; data?: { model?: string | null } }>([
      "chat",
      chatId,
    ]);
    if (cached?.success && cached.data?.model) return cached.data.model;
    return readSavedModel();
  });
  const hydratedChatId = useRef<string | null>(null);
  const modelInitializedForChat = useRef<string | null>(null);
  const allowInitialSend = useRef(true);

  // UI state variables
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [branchMessageId, setBranchMessageId] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Queries
  const { data: response, isLoading: isFetching } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getMessagesAction(chatId),
    staleTime: Infinity, 
  });

  const { data: chatResponse, isFetched: isChatFetched } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => getChatByIdAction(chatId),
    staleTime: 30_000,
  });

  const currentChat = chatResponse?.success ? chatResponse.data : null;

  const { data: parentChatResponse } = useQuery({
    queryKey: ["chat", currentChat?.parentChatId],
    queryFn: () => getChatByIdAction(currentChat!.parentChatId!),
    enabled: !!currentChat?.parentChatId,
  });

  const parentChat = parentChatResponse?.success ? parentChatResponse.data : null;

  const { data: branchesResponse } = useQuery({
    queryKey: ["branches", chatId],
    queryFn: () => getBranchesAction(chatId),
  });

  const branches = branchesResponse?.success ? branchesResponse.data : [];

  const { data: shareResponse } = useQuery({
    queryKey: ["share", chatId],
    queryFn: () => getShareByChatIdAction(chatId),
  });

  const shareObj = shareResponse?.success ? shareResponse.data : null;

  const { data: models, isLoading: isLoadingModels } = useQuery({
    queryKey: ["available-models"],
    queryFn: () => getAvailableModelsAction(),
    staleTime: 5 * 60 * 1000,
  });

  const hasNoApiKey = !isLoadingModels && (!models || models.length === 0);

  const dbMessages = response?.success ? response.data : undefined;

  // Mutations
  const renameMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await updateChatAction(chatId, { title });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (title: string) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      await queryClient.cancelQueries({ queryKey: ["chat", chatId] });
      const previousChats = queryClient.getQueryData(["chats"]);
      const previousChat = queryClient.getQueryData(["chat", chatId]);
      patchCachedChat(queryClient, chatId, { title });
      setIsRenameDialogOpen(false);
      return { previousChats, previousChat };
    },
    onSuccess: () => {
      toast.success("Conversation renamed");
    },
    onError: (err: Error, _title, context) => {
      if (context?.previousChats) queryClient.setQueryData(["chats"], context.previousChats);
      if (context?.previousChat) queryClient.setQueryData(["chat", chatId], context.previousChat);
      toast.error(err.message || "Couldn't rename the conversation");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async (isPinned: boolean) => {
      const res = await updateChatAction(chatId, { isPinned });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (isPinned: boolean) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      await queryClient.cancelQueries({ queryKey: ["chat", chatId] });
      const previousChats = queryClient.getQueryData(["chats"]);
      const previousChat = queryClient.getQueryData(["chat", chatId]);
      patchCachedChat(queryClient, chatId, { isPinned });
      return { previousChats, previousChat };
    },
    onSuccess: (data) => {
      toast.success(data.isPinned ? "Conversation pinned" : "Conversation unpinned");
    },
    onError: (err: Error, _value, context) => {
      if (context?.previousChats) queryClient.setQueryData(["chats"], context.previousChats);
      if (context?.previousChat) queryClient.setQueryData(["chat", chatId], context.previousChat);
      toast.error(err.message || "Couldn't update the conversation");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (isArchived: boolean) => {
      const res = await updateChatAction(chatId, { isArchived });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (isArchived: boolean) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previousChats = queryClient.getQueryData(["chats"]);
      patchCachedChat(queryClient, chatId, { isArchived });
      router.push("/");
      return { previousChats };
    },
    onSuccess: (data) => {
      toast.success(data.isArchived ? "Conversation archived" : "Conversation unarchived");
    },
    onError: (err: Error, _value, context) => {
      if (context?.previousChats) queryClient.setQueryData(["chats"], context.previousChats);
      toast.error(err.message || "Couldn't update the conversation");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await deleteChatAction(chatId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      const previousChats = queryClient.getQueryData(["chats"]);
      queryClient.setQueryData(["chats"], (current: { success: true; data: Array<{ id: string }> } | undefined) => {
        if (!current?.success) return current;
        return { success: true, data: current.data.filter((chat) => chat.id !== chatId) };
      });
      router.push("/");
      return { previousChats };
    },
    onSuccess: () => {
      toast.success("Conversation deleted");
    },
    onError: (err: Error, _value, context) => {
      if (context?.previousChats) queryClient.setQueryData(["chats"], context.previousChats);
      toast.error(err.message || "Couldn't delete the conversation");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const branchMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await branchChatAction(chatId, messageId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setIsBranchDialogOpen(false);
      toast.success("Conversation branched successfully!");
      router.push(`/chat/${newChat.id}`);
    },
  });

  const createShareMutation = useMutation({
    mutationFn: async () => {
      const res = await createShareAction(chatId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share", chatId] });
      toast.success("Public share link created!");
    },
  });

  const updateShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const res = await updateShareAction(shareId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Shared snapshot updated successfully!");
    },
  });

  const setShareVisibilityMutation = useMutation({
    mutationFn: async ({ shareId, isPublic }: { shareId: string; isPublic: boolean }) => {
      const res = await setShareVisibilityAction(shareId, isPublic);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["share", chatId] });
      toast.success(data.isPublic ? "Share enabled" : "Share disabled (private)");
    },
  });

  const deleteShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const res = await deleteShareAction(shareId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share", chatId] });
      toast.success("Share link deleted");
    },
  });

  const { messages, sendMessage, status, stop, setMessages, error, regenerate } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId, modelId: selectedModel },
    }),
    onFinish: async () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      const data = queryClient.getQueryData<Awaited<ReturnType<typeof getMessagesAction>>>([
        "messages",
        chatId,
      ]);
      if (data?.success) {
        setMessages(mapDbMessagesToUiMessages(data.data));
      }
    },
    onError: (err) => {
      console.error("Chat window error:", err);
    }
  });

  useEffect(() => {
    if (!isChatFetched || modelInitializedForChat.current === chatId) return;
    if (currentChat?.model) {
      modelInitializedForChat.current = chatId;
      setSelectedModel(currentChat.model);
      return;
    }
    const saved = readSavedModel();
    if (saved) {
      modelInitializedForChat.current = chatId;
      setSelectedModel(saved);
      return;
    }
    if (!models || models.length === 0) return;
    const fallback = pickDefaultModelId(models.map((model) => model.id));
    if (!fallback) return;
    modelInitializedForChat.current = chatId;
    setSelectedModel(fallback);
    saveModelPreference(fallback);
  }, [isChatFetched, currentChat?.model, chatId, models]);

  useEffect(() => {
    if (!dbMessages) return;
    if (hydratedChatId.current === chatId) return;
    if (status === "submitted" || status === "streaming") return;
    if (peekInitialMessage(chatId)) return;
    setMessages(mapDbMessagesToUiMessages(dbMessages));
    hydratedChatId.current = chatId;
  }, [dbMessages, chatId, status, setMessages]);

  useEffect(() => {
    if (!selectedModel || !peekInitialMessage(chatId)) return;
    let cancelled = false;
    waitForChatCreate(chatId)
      .then(() => {
        if (cancelled || !allowInitialSend.current) return;
        const text = takeInitialMessage(chatId);
        if (!text || !allowInitialSend.current) return;
        sendMessage({ text });
      })
      .catch(() => {
        // Starting the chat failed. The home page already left this route.
      });
    return () => {
      cancelled = true;
    };
  }, [chatId, selectedModel, sendMessage]);

  useEffect(() => {
    if (currentChat?.title !== DEFAULT_CHAT_TITLE) return;
    if (!dbMessages || dbMessages.length === 0) return;
    if (status === "submitted" || status === "streaming") return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      if (attempts >= 6) clearInterval(timer);
    }, 1500);
    return () => clearInterval(timer);
  }, [currentChat?.title, dbMessages, status, chatId, queryClient]);

  function handleModelChange(modelId: string) {
    modelInitializedForChat.current = chatId;
    setSelectedModel(modelId);
    saveModelPreference(modelId);
  }

  // Handle auto-scroll to highlighted message from Global Search
  useEffect(() => {
    if (highlightMsgId && messages.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`msg-${highlightMsgId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("bg-yellow-500/10", "dark:bg-yellow-500/5", "border", "border-yellow-500/30");
          setTimeout(() => {
            el.classList.remove("bg-yellow-500/10", "dark:bg-yellow-500/5", "border", "border-yellow-500/30");
          }, 3000);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [highlightMsgId, messages]);

  const handleBranchFromLast = () => {
    if (dbMessages && dbMessages.length > 0) {
      const activeMessages = dbMessages.filter(m => m.isActiveVersion);
      const lastMsg = activeMessages[activeMessages.length - 1] || dbMessages[dbMessages.length - 1];
      if (lastMsg) {
        handleTriggerBranch(lastMsg.id);
      }
    } else {
      toast.error("No messages to branch from");
    }
  };

  // Listen for global command palette and shortcut triggers
  useEffect(() => {
    const handleExport = () => setIsExportDialogOpen(true);
    const handleShare = () => setIsShareDialogOpen(true);
    const handleBranch = () => handleBranchFromLast();
    const handleArchive = () => handleToggleArchive();
    const handlePin = () => handleTogglePin();

    window.addEventListener("trigger-chat-export", handleExport);
    window.addEventListener("trigger-chat-share", handleShare);
    window.addEventListener("trigger-chat-branch", handleBranch);
    window.addEventListener("trigger-chat-archive", handleArchive);
    window.addEventListener("trigger-chat-pin", handlePin);

    return () => {
      window.removeEventListener("trigger-chat-export", handleExport);
      window.removeEventListener("trigger-chat-share", handleShare);
      window.removeEventListener("trigger-chat-branch", handleBranch);
      window.removeEventListener("trigger-chat-archive", handleArchive);
      window.removeEventListener("trigger-chat-pin", handlePin);
    };
  }, [messages, currentChat]);

  // Handlers
  function handleConfirmRename() {
    if (renameTitle.trim()) {
      renameMutation.mutate(renameTitle.trim());
    }
  }

  function handleTogglePin() {
    if (currentChat) {
      pinMutation.mutate(!currentChat.isPinned);
    }
  }

  function handleToggleArchive() {
    if (currentChat) {
      archiveMutation.mutate(!currentChat.isArchived);
    }
  }

  function handleDeleteChat() {
    setIsDeleteDialogOpen(true);
  }

  function handleTriggerBranch(messageId: string) {
    setBranchMessageId(messageId);
    setIsBranchDialogOpen(true);
  }

  const handleConfirmBranch = () => {
    if (branchMessageId) {
      branchMutation.mutate(branchMessageId);
    }
  };

  const handleSwitchVersion = async (messageId: string) => {
    const res = await setActiveVersionAction(messageId);
    if (!res.success) {
      toast.error(res.error || "Failed to switch version");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    const data = queryClient.getQueryData<Awaited<ReturnType<typeof getMessagesAction>>>([
      "messages",
      chatId,
    ]);
    if (data?.success) {
      setMessages(mapDbMessagesToUiMessages(data.data));
    }
  };

  const handleRetry = async (versionGroupId: string) => {
    // Locate the first message in this group to find where to slice
    const firstInGroup = dbMessages?.find(m => m.versionGroupId === versionGroupId || m.id === versionGroupId);
    if (!firstInGroup || !dbMessages) return;

    const index = dbMessages.findIndex(m => m.id === firstInGroup.id);
    if (index === -1) return;

    // Slice history client-side to user message prior to retry group
    const slicedUi = mapDbMessagesToUiMessages(dbMessages.slice(0, index));
    setMessages(slicedUi);

    // Call Vercel AI SDK regenerate with retryGroupId in body
    regenerate({
      body: {
        chatId,
        modelId: selectedModel,
        retryGroupId: versionGroupId,
      }
    });
  };

  const handleCreateShare = () => {
    createShareMutation.mutate();
  };

  const handleUpdateShare = () => {
    if (shareObj) {
      updateShareMutation.mutate(shareObj.id);
    }
  };

  const handleToggleShareVisibility = (isPublic: boolean) => {
    if (shareObj) {
      setShareVisibilityMutation.mutate({ shareId: shareObj.id, isPublic });
    }
  };

  const handleDeleteShare = () => {
    if (shareObj && confirm("Are you sure you want to delete this share link?")) {
      deleteShareMutation.mutate(shareObj.id);
    }
  };

  const handleCopyShareLink = () => {
    if (shareObj) {
      navigator.clipboard.writeText(`${window.location.origin}/share/${shareObj.id}`);
      setCopiedLink(true);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isLoading = status === "submitted" || status === "streaming";
  const pendingText = peekInitialMessage(chatId);
  const visibleMessages =
    messages.length > 0 || !pendingText
      ? messages
      : [{ id: `pending-${chatId}`, role: "user", parts: [{ type: "text", text: pendingText }] }];
  const showThinking = isLoading || (Boolean(pendingText) && messages.length === 0);

  return (
    <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
      
      {/* Top Toolbar */}
      <header className="h-14 border-b border-border/40 flex items-center justify-between px-4 md:px-6 w-full shrink-0 bg-background/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate max-w-[150px] sm:max-w-[240px]">
                {currentChat?.title || DEFAULT_CHAT_TITLE}
              </span>
              {currentChat?.isPinned && (
                <Pin className="h-3.5 w-3.5 text-muted-foreground/75 fill-muted-foreground/10 shrink-0" />
              )}
            </div>
            
            {/* Branched Parent Link */}
            {currentChat?.parentChatId && parentChat && (
              <Link 
                href={`/chat/${currentChat.parentChatId}`}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5 transition-colors select-none"
              >
                <span>Branched from</span>
                <span className="underline max-w-[120px] truncate">{parentChat.title}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Branch Navigation Dropdown (only if this chat has branches) */}
          {branches.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border-border/40 gap-1.5 px-2.5 bg-muted/20 select-none cursor-pointer"
                >
                  <GitBranch className="h-3.5 w-3.5 text-primary/70 animate-pulse" />
                  <span>{branches.length} {branches.length === 1 ? 'Branch' : 'Branches'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] p-1 rounded-xl shadow-lg border-border/50 select-none">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  🌿 Branches
                </div>
                <DropdownMenuSeparator className="bg-border/30" />
                {branches.map((branch: { id: string; title: string; createdAt: string | Date }) => (
                  <DropdownMenuItem 
                    key={branch.id} 
                    asChild
                    className="rounded-lg text-[13px] py-2 cursor-pointer"
                  >
                    <Link href={`/chat/${branch.id}`} className="flex flex-col items-start gap-0.5">
                      <span className="font-medium text-foreground truncate w-full">{branch.title}</span>
                      <span className="text-[10px] opacity-60">Created {new Date(branch.createdAt).toLocaleDateString()}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export Dialog Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            className="h-8 rounded-lg text-xs font-medium border-border/40 gap-1.5 px-2 sm:px-3 select-none cursor-pointer"
            title="Export"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* Share Dialog Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareDialogOpen(true)}
            className="h-8 rounded-lg text-xs font-medium border-border/40 gap-1.5 px-2 sm:px-3 select-none cursor-pointer"
            title="Share"
          >
            <Share className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* Overflow Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted border border-transparent hover:border-border/30 select-none cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px] p-1 rounded-xl shadow-lg border-border/50 select-none">
              <DropdownMenuItem 
                onClick={() => {
                  setRenameTitle(currentChat?.title || "");
                  setIsRenameDialogOpen(true);
                }} 
                className="rounded-lg text-[13px] py-1.5 cursor-pointer"
              >
                <Edit className="mr-2 h-3.5 w-3.5 opacity-60" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleTogglePin} 
                className="rounded-lg text-[13px] py-1.5 cursor-pointer"
              >
                <Pin className="mr-2 h-3.5 w-3.5 opacity-60" /> {currentChat?.isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleToggleArchive} 
                className="rounded-lg text-[13px] py-1.5 cursor-pointer"
              >
                <Archive className="mr-2 h-3.5 w-3.5 opacity-60" /> {currentChat?.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsExportDialogOpen(true)} 
                className="rounded-lg text-[13px] py-1.5 cursor-pointer"
              >
                <Download className="mr-2 h-3.5 w-3.5 opacity-60" /> Export
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40 my-1" />
              <DropdownMenuItem 
                onClick={handleDeleteChat} 
                className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg text-[13px] py-1.5 cursor-pointer"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5 opacity-60" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>

      <ChatContainerRoot className="flex-1 w-full relative overflow-y-auto">
        {response && !response.success ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted-foreground">{response.error || "Couldn't load this conversation."}</p>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["messages", chatId] })}>
              Try again
            </Button>
          </div>
        ) : isFetching && visibleMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center absolute inset-0">
            <Loading01Icon className="animate-spin h-5 w-5 text-muted-foreground/50" />
          </div>
        ) : (
          <MessageList 
            messages={visibleMessages} 
            isLoading={showThinking} 
            error={error} 
            branchPointMessageId={currentChat?.branchPointMessageId}
            onSwitchVersion={handleSwitchVersion}
            onBranch={isLoading ? undefined : handleTriggerBranch}
            onRetry={isLoading ? undefined : handleRetry}
          />
        )}
      </ChatContainerRoot>
      
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        {/* Solid fade to mask scrolling text in the gap below the input */}
        <div className="h-40 bg-gradient-to-t from-background via-background/90 to-transparent w-full" />
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 px-4 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-2 pointer-events-auto">
          {hasNoApiKey && (
            <div className="w-full mb-1 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-md backdrop-blur-xl animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                  <Key01Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-[12.5px] font-medium text-amber-950 dark:text-amber-100">
                  No API key configured. Add a key in Settings to continue messaging.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent("open-settings"))}
                className="shrink-0 h-7 px-2.5 rounded-lg border-amber-500/30 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 text-[11.5px] font-semibold"
              >
                Add Key
              </Button>
            </div>
          )}
          <div className="rounded-2xl bg-background/70 backdrop-blur-2xl border border-border/60 shadow-lg p-1.5 transition-all focus-within:shadow-xl focus-within:border-border focus-within:bg-background/90">
            <ChatInput 
              value={input}
              onChange={setInput}
              onSubmit={() => {
                if (hasNoApiKey) {
                  toast.error("Please add an API key in Settings before sending a message.");
                  window.dispatchEvent(new CustomEvent("open-settings"));
                  return;
                }
                sendMessage({ text: input });
                setInput("");
              }}
              isLoading={showThinking}
              onStop={() => {
                allowInitialSend.current = false;
                takeInitialMessage(chatId);
                stop();
              }}
              placeholder={hasNoApiKey ? "Add an API Key in Settings to continue..." : "Ask Anything"}
              className="shadow-none border-none bg-transparent"
              modelSelector={<ModelSelector value={selectedModel} onChange={handleModelChange} autoSelect={false} />}
            />
          </div>
        </div>
      </div>

      {/* Branch Confirmation Dialog */}
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent className="sm:max-w-[400px] select-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Branch Conversation
            </DialogTitle>
            <DialogDescription className="text-left mt-2">
              This will create a new conversation beginning from this point. The original conversation will remain unchanged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBranch} disabled={branchMutation.isPending}>
              {branchMutation.isPending ? "Creating Branch..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Conversation Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[420px] select-none">
          <DialogHeader>
            <DialogTitle>Share Conversation</DialogTitle>
            <DialogDescription>
              Anyone with the link can view this conversation. Shared conversations are read-only.
            </DialogDescription>
          </DialogHeader>

          {shareObj ? (
            <div className="space-y-4 py-2 select-text">
              {/* Copy URL Input */}
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/share/${shareObj.id}` : ""}
                  className="flex-1 bg-muted/40 font-mono text-xs h-9 rounded-lg"
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCopyShareLink}
                  className="h-9 gap-1"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Copy</span>
                </Button>
              </div>

              {/* Share Options */}
              <div className="flex flex-col gap-2 border-t border-border/20 pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUpdateShare} 
                  disabled={updateShareMutation.isPending}
                  className="w-full justify-start h-9 rounded-lg text-xs cursor-pointer"
                >
                  {updateShareMutation.isPending ? "Updating Snapshot..." : "Update Snapshot"}
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleShareVisibility(!shareObj.isPublic)}
                    disabled={setShareVisibilityMutation.isPending}
                    className="flex-1 justify-center h-9 rounded-lg text-xs cursor-pointer"
                  >
                    {shareObj.isPublic ? "Disable Share" : "Enable Share"}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteShare}
                    disabled={deleteShareMutation.isPending}
                    className="flex-1 justify-center h-9 rounded-lg text-xs cursor-pointer"
                  >
                    Delete Share
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 flex justify-center">
              <Button 
                onClick={handleCreateShare} 
                disabled={createShareMutation.isPending}
                className="w-full h-10 rounded-lg text-sm font-semibold cursor-pointer"
              >
                {createShareMutation.isPending ? "Creating Link..." : "Create Share Link"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input 
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="Conversation title"
              className="h-9"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRename} disabled={renameMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ExportDialog 
        isOpen={isExportDialogOpen} 
        onClose={() => setIsExportDialogOpen(false)} 
        chat={currentChat} 
        messages={messages} 
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
