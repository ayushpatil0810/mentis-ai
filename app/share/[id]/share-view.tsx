"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageList } from "@/components/chat/message-list";
import { ChatContainerRoot } from "@/components/ui/chat-container";
import { forkShareAction } from "@/app/actions/share";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GitBranch, UserPlus, LogIn, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ShareViewProps {
  share: {
    id: string;
    chatId: string;
    userId: string;
    snapshot: any;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

export function ShareView({ share }: ShareViewProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isForking, setIsForking] = useState(false);

  const snapshot = share.snapshot;
  const chatTitle = snapshot.chat.title || "Shared Chat";
  
  // Format snapshot messages with mock IDs for rendering
  const mappedMessages = (snapshot.messages || []).map((m: any, idx: number) => ({
    id: `share-msg-${idx}`,
    role: m.role,
    content: m.content,
    parts: m.parts,
    createdAt: m.createdAt,
    versionGroupId: null, // Public shared view has no versions
    isActiveVersion: true,
  }));

  const forkMutation = useMutation({
    mutationFn: async () => {
      const res = await forkShareAction(share.id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (newChatId) => {
      toast.success("Conversation forked successfully!");
      router.push(`/chat/${newChatId}`);
    },
    onError: (err: any) => {
      console.error("Fork error:", err);
      toast.error(err.message || "Failed to fork conversation");
    },
  });

  const handleFork = () => {
    if (!session) {
      toast.info("Please login to fork this conversation");
      router.push(`/login?callbackUrl=/share/${share.id}`);
      return;
    }
    forkMutation.mutate();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* Header Toolbar */}
      <header className="h-14 border-b border-border/40 flex items-center justify-between px-4 md:px-6 w-full shrink-0 bg-background/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80">
            <Image 
              src="/logo.png" 
              alt="Mentis AI Logo" 
              width={24} 
              height={24}
              className="rounded"
            />
            <span className="font-semibold text-xs tracking-wider uppercase text-foreground/80 hidden sm:inline">
              Mentis AI
            </span>
          </Link>
          <div className="h-4 w-px bg-border/40 hidden sm:block shrink-0" />
          <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[400px]">
            {chatTitle}
          </h1>
          <span className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded shrink-0 select-none">
            Public Share
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 select-none">
          <Button
            variant="default"
            size="sm"
            onClick={handleFork}
            disabled={forkMutation.isPending}
            className="h-8 rounded-lg text-xs font-semibold gap-1.5 px-3 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-sm"
          >
            {session ? (
              <>
                <GitBranch className="h-3.5 w-3.5" />
                <span>{forkMutation.isPending ? "Forking..." : "Fork Conversation"}</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign in to Fork</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Shared Read-only Message Container */}
      <ChatContainerRoot className="flex-1 w-full relative overflow-y-auto">
        {mappedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-muted-foreground text-sm">This shared conversation has no messages.</p>
          </div>
        ) : (
          <MessageList 
            messages={mappedMessages} 
            readOnly={true} 
          />
        )}
      </ChatContainerRoot>

    </div>
  );
}
