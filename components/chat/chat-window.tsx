"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessagesAction } from "@/app/actions/chat";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useState } from "react";
import { Refresh } from "iconoir-react";

export function ChatWindow({ chatId }: { chatId: string }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");

  const { data: dbMessages, isLoading: isFetching } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getMessagesAction(chatId),
  });

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/chat",
      body: { chatId },
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
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
        {isFetching && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Refresh className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
      
      <div className="p-4 bg-background sticky bottom-0">
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
  );
}
