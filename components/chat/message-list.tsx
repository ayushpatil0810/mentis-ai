import { useEffect, useRef } from "react";
import { MessageItem } from "./message-item";

export function MessageList({ messages }: { messages: any[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-6 p-4 pt-8 pb-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={bottomRef} className="h-px" />
    </div>
  );
}
