import { MessageItem } from "./message-item";
import { ChatContainerContent } from "@/components/ui/chat-container";
import { Loader } from "@/components/ui/loader";

export function MessageList({ messages, isLoading }: { messages: any[], isLoading?: boolean }) {
  const showLoader = isLoading && messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <ChatContainerContent className="flex flex-col w-full max-w-3xl mx-auto px-4 py-8 pb-32">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      
      {showLoader && (
        <div className="flex w-full py-2 justify-start">
          <div className="flex w-full flex-col gap-1 max-w-[85%]">
            <div className="bg-transparent text-foreground p-0 px-2 py-3 opacity-70">
              <Loader variant="dots" />
            </div>
          </div>
        </div>
      )}
    </ChatContainerContent>
  );
}
