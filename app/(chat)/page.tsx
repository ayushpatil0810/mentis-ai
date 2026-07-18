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
      const chat = await createChatAction({ title: "New Chat" });
      sessionStorage.setItem("initial_message", messageContent);
      sessionStorage.setItem("mentis_selected_model", selectedModel);
      return chat;
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
    { icon: CodeCircleIcon, label: "Code", desc: "Write or review code", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: PaintBoardIcon, label: "Design", desc: "Brainstorm UX patterns", color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: DocumentAttachmentIcon, label: "Write", desc: "Draft documentation", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: SparklesIcon, label: "Ideate", desc: "Explore new ideas", color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-background">
      {/* Immersive Ambient Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-radial from-foreground/5 to-transparent blur-[80px] pointer-events-none -z-10" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[500px]">
        <div className="w-full max-w-[700px] flex flex-col items-center">
          
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-foreground/10 blur-xl rounded-full scale-125" />
              <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border border-background/20 overflow-hidden bg-background">
                <Image 
                  src="/logo.png" 
                  alt="Mentis AI Logo" 
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                How can I help you today?
              </h1>
              <p className="text-muted-foreground text-[15px]">
                Select a model and start a conversation.
              </p>
            </div>
          </div>
          
          <div className="w-full flex flex-col gap-3 relative z-20">
            <div className="w-full relative shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.02)] rounded-[1.5rem] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <ChatInput 
                value={content}
                onChange={setContent}
                onSubmit={() => handleSubmit(content)}
                isLoading={createChatMutation.isPending}
                onStop={() => {}}
                placeholder="Message Mentis..."
                modelSelector={<ModelSelector value={selectedModel} onChange={setSelectedModel} />}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-14">
            {actions.map((action, idx) => (
              <button 
                key={idx}
                onClick={() => handleSubmit(`I want to ${action.label.toLowerCase()}: `)}
                className="flex flex-col items-start p-5 rounded-2xl bg-card border border-border/60 hover:border-foreground/20 hover:bg-muted/30 transition-all text-left group shadow-sm hover:shadow-md active:scale-[0.98] relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${action.bg} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className={`w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center mb-4 relative z-10 shadow-sm border border-black/5 dark:border-white/5`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-semibold text-foreground mb-1 relative z-10">{action.label}</span>
                <span className="text-[13px] text-muted-foreground relative z-10 leading-relaxed">{action.desc}</span>
              </button>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}
