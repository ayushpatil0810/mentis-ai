"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createChatAction, sendMessageAction } from "@/app/actions/chat";
import { ChatInput } from "@/components/chat/chat-input";

export default function NewChatPage() {
  const router = useRouter();
  const [content, setContent] = useState("");

  const createChatMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      // 1. Create chat
      const chat = await createChatAction({ title: "New Chat" });
      
      // 2. Send initial message
      await sendMessageAction(chat.id, messageContent);
      
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
    <div className="flex-1 flex flex-col h-full items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        <h1 className="text-4xl font-semibold tracking-tight text-center">
          What can I help you with?
        </h1>
        
        <div className="w-full">
          <ChatInput 
            value={content}
            onChange={setContent}
            onSubmit={() => handleSubmit(content)}
            isLoading={createChatMutation.isPending}
            placeholder="Send a message..."
          />
        </div>
      </div>
    </div>
  );
}
