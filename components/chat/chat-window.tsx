"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessagesAction } from "@/app/actions/chat";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useState } from "react";
import { Loading01Icon } from "hugeicons-react";
import { ChatContainerRoot } from "@/components/ui/chat-container";
import { ModelSelector } from "./model-selector";

export function ChatWindow({ chatId }: { chatId: string }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const { data: dbMessages, isLoading: isFetching } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getMessagesAction(chatId),
  });

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: { chatId, modelId: selectedModel },
    }),
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] }); // Refresh sidebar
    }
  });

  // Sync DB messages to useChat state initially
  useEffect(() => {
    if (dbMessages && messages.length === 0) {
      setMessages(dbMessages.map(m => ({
        id: m.id,
        role: m.role as "system" | "user" | "assistant" | "data" | "tool",
        content: m.content,
        createdAt: m.createdAt,
      })) as any);
    }
  }, [dbMessages, messages.length, setMessages]);

  // Handle initial message from new chat
  useEffect(() => {
    const initialMsg = sessionStorage.getItem("initial_message");
    if (initialMsg && !isFetching) {
      sessionStorage.removeItem("initial_message");
      sendMessage({ text: initialMsg });
    }
  }, [sendMessage, isFetching]);

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
      <ChatContainerRoot className="flex-1 w-full relative">
        {isFetching && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center absolute inset-0">
            <Loading01Icon className="animate-spin h-5 w-5 text-muted-foreground/50" />
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </ChatContainerRoot>
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-2">
          <div className="px-2">
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />
          </div>
          <ChatInput 
            value={input}
            onChange={setInput}
            onSubmit={() => {
              sendMessage({ text: input });
              setInput("");
            }}
            isLoading={isLoading}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
}
