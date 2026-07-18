"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessagesAction, sendMessageAction } from "@/app/actions/chat";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useState } from "react";
import { Refresh } from "iconoir-react";

export function ChatWindow({ chatId }: { chatId: string }) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getMessagesAction(chatId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      return await sendMessageAction(chatId, messageContent);
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ["messages", chatId] });
      const previousMessages = queryClient.getQueryData(["messages", chatId]);
      
      queryClient.setQueryData(["messages", chatId], (old: any) => [
        ...(old || []), 
        { id: "temp", role: "user", content: newMessage, createdAt: new Date() }
      ]);
      
      setContent("");
      return { previousMessages };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["messages", chatId], context?.previousMessages);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] }); // Refresh sidebar
    },
  });

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Refresh className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MessageList messages={messages || []} />
        )}
      </div>
      
      <div className="p-4 bg-background sticky bottom-0">
        <ChatInput 
          value={content}
          onChange={setContent}
          onSubmit={() => sendMessageMutation.mutate(content)}
          isLoading={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}
