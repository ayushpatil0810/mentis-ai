import { getChatByIdAction } from "@/app/actions/chat";
import { ChatWindow } from "@/components/chat/chat-window";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="flex flex-col h-full w-full">
      <ChatWindow chatId={id} />
    </div>
  );
}
