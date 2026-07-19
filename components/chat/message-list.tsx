import { MessageItem } from "./message-item";
import { ChatContainerContent } from "@/components/ui/chat-container";


export function MessageList({ messages, isLoading }: { messages: any[], isLoading?: boolean }) {
  const showLoader = isLoading && messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <ChatContainerContent className="flex flex-col w-full max-w-3xl mx-auto px-4 py-8 pb-32">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {showLoader && (
        <MessageItem message={{ id: "loading", role: "assistant" }} />
      )}
      <div className="h-40" />
    </ChatContainerContent>
  );
}
