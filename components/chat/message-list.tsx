import { MessageItem } from "./message-item";
import { ChatContainerContent } from "@/components/ui/chat-container";
import { Loader } from "@/components/ui/loader";
import { Loading01Icon } from "hugeicons-react";

export function MessageList({ messages, isLoading }: { messages: any[], isLoading?: boolean }) {
  const showLoader = isLoading && messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <ChatContainerContent className="flex flex-col w-full max-w-3xl mx-auto px-4 py-8 pb-32">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      
      {showLoader && (
        <div className="flex w-full group py-6">
          <div className="flex w-full gap-4 md:gap-6">
            <div className="shrink-0 flex flex-col items-center pt-0.5">
              <div className="w-8 h-8 rounded-xl bg-transparent border border-border/60 flex items-center justify-center shadow-sm">
                <span className="text-foreground font-bold text-xs">M</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col min-w-0 pt-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loading01Icon className="w-4 h-4 animate-spin" />
                <span className="text-[13px]">Mentis AI is thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </ChatContainerContent>
  );
}
