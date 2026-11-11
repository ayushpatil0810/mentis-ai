"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ulid } from "ulid";
import { createChatAction } from "@/app/actions/chat";
import { DEFAULT_CHAT_TITLE } from "@/lib/chat/title";
import { readSavedModel } from "@/lib/chat/model-preference";
import {
  dropOptimisticChat,
  expectChatCreate,
  optimisticChat,
  rejectChatCreate,
  resolveChatCreate,
  seedOptimisticChat,
  stageInitialMessage,
} from "@/lib/chat/optimistic";
import { getAvailableModelsAction } from "@/app/actions/models";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import { ModelSelector } from "@/components/chat/model-selector";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { 
  CodeCircleIcon, 
  PaintBoardIcon, 
  DocumentAttachmentIcon, 
  SparklesIcon,
  Key01Icon
} from "hugeicons-react";

export default function NewChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const startingRef = useRef(false);
  const [content, setContent] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const { data: models, isLoading: isLoadingModels } = useQuery({
    queryKey: ["available-models"],
    queryFn: () => getAvailableModelsAction(),
    staleTime: 5 * 60 * 1000,
  });

  const hasNoApiKey = !isLoadingModels && (!models || models.length === 0);

  const handleSubmit = (text: string) => {
    const message = text.trim();
    if (!message || startingRef.current) return;
    if (hasNoApiKey) {
      toast.error("Please add an API key in Settings before starting a chat.");
      window.dispatchEvent(new CustomEvent("open-settings"));
      return;
    }

    startingRef.current = true;
    const id = ulid();
    const model = selectedModel || readSavedModel();
    stageInitialMessage(id, message);
    expectChatCreate(id);
    seedOptimisticChat(queryClient, optimisticChat(id, model));
    setContent("");
    setPendingMessage(message);
    router.push(`/chat/${id}`);

    createChatAction({ id, title: DEFAULT_CHAT_TITLE, model: model || undefined })
      .then((response) => {
        if (!response.success) {
          throw new Error(response.error);
        }
        queryClient.setQueryData(["chat", id], response);
        queryClient.setQueryData(
          ["chats"],
          (current: { success: true; data: Array<{ id: string }> } | undefined) => {
            if (!current?.success) return current;
            const without = current.data.filter((chat) => chat.id !== id);
            return { success: true, data: [response.data, ...without] };
          },
        );
        resolveChatCreate(id);
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error("Couldn't start the chat");
        rejectChatCreate(id, error);
        dropOptimisticChat(queryClient, id);
        toast.error(error.message);
        startingRef.current = false;
        setPendingMessage(null);
        router.push("/");
      });
  };

  const actions = [
    { icon: CodeCircleIcon, label: "Write or review code", prompt: "Help me write or review some code" },
    { icon: PaintBoardIcon, label: "Brainstorm UX designs", prompt: "Let's brainstorm some modern UX/UI patterns" },
    { icon: DocumentAttachmentIcon, label: "Draft documentation", prompt: "Help me draft a technical documentation page" },
    { icon: SparklesIcon, label: "Explore new ideas", prompt: "Help me ideate and explore some new concepts" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-background">
      {pendingMessage ? (
        <MessageList
          messages={[{ id: "pending-user", role: "user", parts: [{ type: "text", text: pendingMessage }] }]}
          isLoading
          readOnly
        />
      ) : (
      <>
      {/* Soft Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-primary/5 via-primary/[0.01] to-transparent blur-3xl pointer-events-none -z-10" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[500px]">
        <div className="w-full max-w-[640px] flex flex-col items-center">
          
          {/* Logo and Sleek Typographic Header */}
          <div className="flex flex-col items-center gap-4 mb-8 select-none">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-border/40 bg-muted/20 shadow-sm relative overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="Mentis AI Logo" 
                fill
                className="object-cover p-1"
                priority
              />
            </div>
            
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                How can I help you today?
              </h1>
              <p className="text-muted-foreground text-[13.5px] font-normal leading-relaxed max-w-xs mx-auto">
                Select a model and ask anything to get started.
              </p>
            </div>
          </div>

          {/* API Key Required Alert Banner */}
          {hasNoApiKey && (
            <div className="w-full mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0">
                  <Key01Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold tracking-tight text-amber-950 dark:text-amber-100">
                    API Key Required
                  </h4>
                  <p className="text-[12.5px] opacity-80 leading-snug">
                    You haven&apos;t added an API key yet. Add your OpenAI, Anthropic, or Google Gemini key to start chatting.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent("open-settings"))}
                className="shrink-0 h-8 px-3 rounded-xl border-amber-500/30 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 text-xs font-semibold"
              >
                Add API Key
              </Button>
            </div>
          )}
          
          {/* Prompt Input Box (Kept strictly identical) */}
          <div className="w-full flex flex-col gap-3 relative z-20">
            <div className="w-full relative rounded-2xl bg-background/70 backdrop-blur-2xl border border-border/60 shadow-lg p-1.5 transition-all focus-within:shadow-xl focus-within:border-border focus-within:bg-background/90">
              <ChatInput 
                value={content}
                onChange={setContent}
                onSubmit={() => handleSubmit(content)}
                isLoading={false}
                onStop={() => {}}
                placeholder={hasNoApiKey ? "Add an API Key in Settings to start chatting..." : "Ask Anything"}
                modelSelector={<ModelSelector value={selectedModel} onChange={setSelectedModel} />}
              />
            </div>
          </div>

          {/* Redesigned Minimal Suggestion Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8 max-w-[640px] select-none">
            {actions.map((action, idx) => (
              <button 
                key={idx}
                onClick={() => setContent(action.prompt)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/30 hover:border-border transition-all duration-150 text-left cursor-pointer group active:scale-[0.99]"
              >
                <div className="w-8 h-8 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {action.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
        </div>
      </div>
      </>
      )}
    </div>
  );
}
