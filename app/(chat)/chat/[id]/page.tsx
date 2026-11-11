"use client";

import { useParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/chat-window";

export default function ChatPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  if (!id) return null;

  return (
    <div className="flex flex-col h-full w-full">
      <ChatWindow key={id} chatId={id} />
    </div>
  );
}
