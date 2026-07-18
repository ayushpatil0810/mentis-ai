"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createChatAction } from "@/app/actions/chat";
import { ChatInput } from "@/components/chat/chat-input";
import { ModelSelector } from "@/components/chat/model-selector";

export default function NewChatPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const createChatMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      // 1. Create chat
      const chat = await createChatAction({ title: "New Chat" });
      
      // Store initial message for the chat window to pick up
      sessionStorage.setItem("initial_message", messageContent);
      // Store initial model selection for the chat window to pick up
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

  return (
    <div className="flex-1 flex flex-col h-full items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        <h1 className="text-3xl font-medium tracking-tight text-center text-foreground/80">
          What are we working on?
        </h1>
        
        <div className="w-full flex flex-col gap-2">
          <div className="px-2">
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />
          </div>
          <ChatInput 
            value={content}
            onChange={setContent}
            onSubmit={() => handleSubmit(content)}
            isLoading={createChatMutation.isPending}
            onStop={() => {}}
            placeholder="Message Mentis..."
          />
        </div>
      </div>
    </div>
  );
}
