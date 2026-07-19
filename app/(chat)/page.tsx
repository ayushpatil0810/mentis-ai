"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createChatAction } from "@/app/actions/chat";
import { ChatInput } from "@/components/chat/chat-input";
import { ModelSelector } from "@/components/chat/model-selector";
import Image from "next/image";
import { 
  CodeCircleIcon, 
  PaintBoardIcon, 
  DocumentAttachmentIcon, 
  SparklesIcon
} from "hugeicons-react";

export default function NewChatPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const createChatMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      const response = await createChatAction({ title: "New Chat" });
      if (!response.success) {
        throw new Error(response.error);
      }
      sessionStorage.setItem("initial_message", messageContent);
      sessionStorage.setItem("mentis_selected_model", selectedModel);
      return response.data;
    },
    onSuccess: (chat) => {
      router.push(`/chat/${chat.id}`);
    }
  });

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    createChatMutation.mutate(text);
  };

  const actions = [
    { icon: CodeCircleIcon, label: "Write or review code", prompt: "Help me write or review some code" },
    { icon: PaintBoardIcon, label: "Brainstorm UX designs", prompt: "Let's brainstorm some modern UX/UI patterns" },
    { icon: DocumentAttachmentIcon, label: "Draft documentation", prompt: "Help me draft a technical documentation page" },
    { icon: SparklesIcon, label: "Explore new ideas", prompt: "Help me ideate and explore some new concepts" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-background">
      {/* Soft Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-primary/5 via-primary/[0.01] to-transparent blur-3xl pointer-events-none -z-10" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[500px]">
        <div className="w-full max-w-[640px] flex flex-col items-center">
          
          {/* Logo and Sleek Typographic Header */}
          <div className="flex flex-col items-center gap-4 mb-10 select-none">
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
          
          {/* Prompt Input Box (Kept strictly identical) */}
          <div className="w-full flex flex-col gap-3 relative z-20">
            <div className="w-full relative rounded-2xl bg-background/70 backdrop-blur-2xl border border-border/60 shadow-lg p-1.5 transition-all focus-within:shadow-xl focus-within:border-border focus-within:bg-background/90">
              <ChatInput 
                value={content}
                onChange={setContent}
                onSubmit={() => handleSubmit(content)}
                isLoading={createChatMutation.isPending}
                onStop={() => {}}
                placeholder="Ask Anything"
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
    </div>
  );
}
