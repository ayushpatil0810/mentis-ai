import { MessageItem } from "./message-item";
import { ChatContainerContent } from "@/components/ui/chat-container";


export function MessageList({ messages, isLoading, error }: { messages: any[], isLoading?: boolean, error?: Error }) {
  const showLoader = isLoading && messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <ChatContainerContent className="flex flex-col w-full max-w-3xl mx-auto px-4 py-8 pb-32">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {showLoader && (
        <MessageItem message={{ id: "loading", role: "assistant" }} />
      )}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-medium leading-relaxed max-w-lg mx-auto mt-4 text-center">
          <p className="font-semibold text-[14px] mb-0.5">Failed to send message</p>
          <p className="opacity-90">{error.message || "The model was unable to respond. Please check your provider settings, API key, or network status."}</p>
        </div>
      )}
      <div className="h-40" />
    </ChatContainerContent>
  );
}
