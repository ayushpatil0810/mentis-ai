"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessagesAction } from "@/app/actions/chat";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";
import { Loading01Icon } from "hugeicons-react";
import { ChatContainerRoot } from "@/components/ui/chat-container";
import { ModelSelector } from "./model-selector";
import { mapDbMessagesToUiMessages } from "@/lib/tools/history-utils";

export function ChatWindow({ chatId }: { chatId: string }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("");


  const { data: response, isLoading: isFetching } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getMessagesAction(chatId),
    staleTime: Infinity, // Messages don't change unless we update them
  });

  const dbMessages = response?.success ? response.data : undefined;

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { chatId, modelId: selectedModel },
    }),
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (err) => {
      console.error("Chat window error:", err);
    }
  });

  useEffect(() => {
    if (dbMessages && messages.length === 0) {
      setMessages(mapDbMessagesToUiMessages(dbMessages));
    }
  }, [dbMessages, messages.length, setMessages]);

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
      
      <ChatContainerRoot className="flex-1 w-full relative overflow-y-auto">
        {isFetching && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center absolute inset-0">
            <Loading01Icon className="animate-spin h-5 w-5 text-muted-foreground/50" />
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} error={error} />
        )}
      </ChatContainerRoot>
      
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        {/* Solid fade to mask scrolling text in the gap below the input */}
        <div className="h-40 bg-gradient-to-t from-background via-background/90 to-transparent w-full" />
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 px-4 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-2 pointer-events-auto">
          <div className="rounded-2xl bg-background/70 backdrop-blur-2xl border border-border/60 shadow-lg p-1.5 transition-all focus-within:shadow-xl focus-within:border-border focus-within:bg-background/90">
            <ChatInput 
              value={input}
              onChange={setInput}
              onSubmit={() => {
                sendMessage({ text: input });
                setInput("");
              }}
              isLoading={isLoading}
              onStop={stop}
              className="shadow-none border-none bg-transparent"
              modelSelector={<ModelSelector value={selectedModel} onChange={setSelectedModel} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
