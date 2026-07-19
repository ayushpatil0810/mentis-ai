import { MessageItem } from "./message-item";
import { ChatContainerContent } from "@/components/ui/chat-container";

interface MessageListProps {
  messages: any[];
  isLoading?: boolean;
  error?: Error;
  readOnly?: boolean;
  branchPointMessageId?: string | null;
  onSwitchVersion?: (messageId: string) => void;
  onBranch?: (messageId: string) => void;
  onRetry?: (versionGroupId: string) => void;
}

export function MessageList({ 
  messages, 
  isLoading, 
  error,
  readOnly = false,
  branchPointMessageId = null,
  onSwitchVersion,
  onBranch,
  onRetry
}: MessageListProps) {
  const showLoader = isLoading && messages.length > 0 && messages[messages.length - 1].role === "user";

  // Group versioned assistant messages and filter to active versions
  const renderedMessages: any[] = [];
  const processedGroups = new Set<string>();

  for (const msg of messages) {
    if (msg.versionGroupId) {
      if (processedGroups.has(msg.versionGroupId)) {
        continue;
      }
      processedGroups.add(msg.versionGroupId);
      
      const group = messages.filter((m) => m.versionGroupId === msg.versionGroupId);
      // Sort group chronologically to show stable order in switcher
      group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      const activeMsg = group.find((m) => m.isActiveVersion) || group[0];
      
      renderedMessages.push({
        ...activeMsg,
        versions: group,
        currentVersionIndex: group.indexOf(activeMsg),
        totalVersions: group.length,
      });
    } else {
      renderedMessages.push(msg);
    }
  }

  return (
    <ChatContainerContent className="flex flex-col w-full max-w-3xl mx-auto px-4 py-8 pb-32">
      {renderedMessages.map((message) => {
        const isBranchPoint = branchPointMessageId && message.id === branchPointMessageId;
        
        return (
          <div key={message.id} id={`msg-${message.id}`} className="w-full flex flex-col transition-all duration-500 rounded-xl">
            <MessageItem 
              message={message} 
              readOnly={readOnly}
              onSwitchVersion={onSwitchVersion}
              onBranch={onBranch}
              onRetry={onRetry}
            />
            {isBranchPoint && (
              <div className="my-6 flex items-center justify-center gap-4 text-xs text-muted-foreground/60 w-full animate-fade-in select-none">
                <div className="h-px bg-border/40 flex-1" />
                <span className="flex items-center gap-1.5 font-medium text-[11px] tracking-widest uppercase">
                  🌿 Branch starts here
                </span>
                <div className="h-px bg-border/40 flex-1" />
              </div>
            )}
          </div>
        );
      })}
      {showLoader && (
        <MessageItem message={{ id: "loading", role: "assistant" }} readOnly={true} />
      )}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-medium leading-relaxed max-w-lg mx-auto mt-4 text-center select-text">
          <p className="font-semibold text-[14px] mb-0.5">Failed to send message</p>
          <p className="opacity-90">{error.message || "The model was unable to respond. Please check your provider settings, API key, or network status."}</p>
        </div>
      )}
      <div className="h-40" />
    </ChatContainerContent>
  );
}
