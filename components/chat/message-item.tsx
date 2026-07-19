import { useState, memo } from "react";
import { Copy01Icon, ThumbsUpIcon, ThumbsDownIcon } from "hugeicons-react";
import { toast } from "sonner";
import { MessageRenderer } from "./message-renderer";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { ToolCall } from "./tool-call";
import { GitBranch, RotateCw, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { calculateCost } from "@/lib/ai/costs";

// Inner Request Inspector Component
function RequestInspector({ metadata }: { metadata: any }) {
  if (!metadata) return null;
  
  const latency = metadata.latencyMs ? `${(metadata.latencyMs / 1000).toFixed(2)}s` : "N/A";
  const cost = metadata.cost !== undefined ? `$${Number(metadata.cost).toFixed(6)}` : "N/A";
  const usage = metadata.usage;
  const promptTokens = usage?.promptTokens ?? 0;
  const completionTokens = usage?.completionTokens ?? 0;
  const totalTokens = usage?.totalTokens ?? 0;
  const contextCount = metadata.contextMessageCount ?? "N/A";
  const toolsUsed = metadata.toolNames || [];

  return (
    <div className="mt-3 p-4 rounded-xl border border-border/40 bg-muted/20 text-xs text-muted-foreground font-mono space-y-2.5 max-w-md shadow-sm select-text">
      <div className="flex items-center justify-between border-b border-border/20 pb-1.5">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-primary/70" />
          Request Inspector
        </span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
          {metadata.model || "Unknown Model"}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div className="flex items-center justify-between">
          <span className="opacity-70">Latency:</span>
          <span className="text-foreground">{latency}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="opacity-70">Cost:</span>
          <span className="text-foreground">{cost}</span>
        </div>
        <div className="flex items-center justify-between col-span-2 border-t border-border/10 pt-1.5 mt-0.5">
          <span className="opacity-70">Tokens:</span>
          <span className="text-foreground">
            {totalTokens} <span className="opacity-50 text-[10px]">({promptTokens} in / {completionTokens} out)</span>
          </span>
        </div>
        <div className="flex items-center justify-between col-span-2">
          <span className="opacity-70">Context Size:</span>
          <span className="text-foreground">{contextCount} messages</span>
        </div>
      </div>
      
      {toolsUsed.length > 0 && (
        <div className="border-t border-border/10 pt-2 mt-1">
          <span className="font-semibold text-foreground block mb-1">Tools Called:</span>
          <div className="flex flex-wrap gap-1">
            {toolsUsed.map((tool: string) => (
              <span key={tool} className="bg-muted/80 px-1.5 py-0.5 rounded text-[10px] text-foreground border border-border/30">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MessageItemProps {
  message: any;
  readOnly?: boolean;
  onSwitchVersion?: (messageId: string) => void;
  onBranch?: (messageId: string) => void;
  onRetry?: (versionGroupId: string) => void;
}

export const MessageItem = memo(function MessageItem({ 
  message, 
  readOnly = false,
  onSwitchVersion,
  onBranch,
  onRetry
}: MessageItemProps) {
  const isUser = message.role === "user";
  const textContent = message.content || 
    (message.parts && Array.isArray(message.parts) ? message.parts.map((p: any) => p.text || "").join("") : "") || 
    message.text || "";

  // Dynamically extract toolInvocations from message.toolInvocations or message.parts
  const toolInvocations = message.toolInvocations || 
    (message.parts && Array.isArray(message.parts) 
      ? message.parts
          .filter((p: any) => p.type?.startsWith("tool-") || p.type === "dynamic-tool")
          .map((p: any) => {
            const toolName = p.type === "dynamic-tool" ? p.toolName : p.type.replace(/^tool-/, "");
            return {
              toolCallId: p.toolCallId,
              toolName,
              args: p.input,
              input: p.input,
              state: p.state === "output-available" ? "result" : (p.state === "output-error" ? "result" : "call"),
              result: p.state === "output-error" ? { status: "error", error: { message: p.errorText } } : p.output,
              output: p.output,
              errorText: p.errorText,
            };
          }) 
      : []) || [];

  const [liked, setLiked] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const currentVersionIndex = message.currentVersionIndex ?? 0;
  const totalVersions = message.totalVersions ?? 1;
  const hasMultipleVersions = totalVersions > 1;

  const handlePrevVersion = () => {
    if (onSwitchVersion && message.versions && currentVersionIndex > 0) {
      onSwitchVersion(message.versions[currentVersionIndex - 1].id);
    }
  };

  const handleNextVersion = () => {
    if (onSwitchVersion && message.versions && currentVersionIndex < totalVersions - 1) {
      onSwitchVersion(message.versions[currentVersionIndex + 1].id);
    }
  };

  return (
    <div className={cn(
      "flex flex-col w-full group py-4 select-none",
      isUser ? "items-end" : "items-start"
    )}>
      <div className={cn(
        "flex flex-col relative w-full",
        isUser ? "items-end max-w-[80%]" : "items-start max-w-full md:max-w-[90%]"
      )}>
        
        <div className={cn(
          "px-5 py-3.5",
          isUser 
            ? "bg-muted text-foreground border border-border/40 rounded-2xl rounded-tr-sm text-[15px] font-normal leading-relaxed shadow-sm select-text" 
            : "bg-transparent text-foreground text-[15px] w-full select-text"
        )}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{textContent}</div>
          ) : (message.id === "loading" || (!textContent && message.role === "assistant" && !toolInvocations.length)) ? (
            <Loader variant="typing" size="sm" className="opacity-70" />
          ) : (
            <div className="flex flex-col gap-2 w-full">
              {textContent && <MessageRenderer content={textContent} />}
              {toolInvocations && toolInvocations.length > 0 && (
                <div className="flex flex-col gap-1 w-full mt-1">
                  {toolInvocations.map((toolInvocation: any) => (
                    <ToolCall key={toolInvocation.toolCallId} toolInvocation={toolInvocation} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action Bar */}
        {message.id !== "loading" && (
          <div className="flex items-center gap-1.5 mt-1.5 ml-5">
            {/* Copy Button (All messages) */}
            <button
              onClick={handleCopy}
              className={cn("flex items-center justify-center h-7 px-2 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all gap-1 text-[11px] font-medium border border-transparent hover:border-border/30", copied ? "text-green-500" : "")}
              title="Copy message"
            >
              <Copy01Icon className="h-3.5 w-3.5" />
              <span>Copy</span>
            </button>

            {/* Branch Button (All messages, owner only) */}
            {!readOnly && onBranch && (
              <button
                onClick={() => onBranch(message.id)}
                className="flex items-center justify-center h-7 px-2 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all gap-1 text-[11px] font-medium border border-transparent hover:border-border/30"
                title="Branch conversation from here"
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>Branch</span>
              </button>
            )}

            {/* Assistant Specific Actions */}
            {!isUser && (
              <>
                {/* Retry Button (Owner only) */}
                {!readOnly && onRetry && (
                  <button
                    onClick={() => onRetry(message.versionGroupId || message.id)}
                    className="flex items-center justify-center h-7 px-2 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all gap-1 text-[11px] font-medium border border-transparent hover:border-border/30"
                    title="Retry generation"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Retry</span>
                  </button>
                )}

                {/* Request Inspector Toggle */}
                {message.metadata && (
                  <button
                    onClick={() => setShowInspector(!showInspector)}
                    className={cn(
                      "flex items-center justify-center h-7 px-2 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all gap-1 text-[11px] font-medium border border-transparent hover:border-border/30",
                      showInspector ? "bg-muted/50 border-border/30 text-foreground" : ""
                    )}
                    title="Inspect Request Metrics"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>Inspect</span>
                  </button>
                )}

                {/* Thumbs Feedback (Owner only) */}
                {!readOnly && (
                  <>
                    <button
                      onClick={() => setLiked(true)}
                      className={cn("flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/80 transition-colors", liked === true ? "text-green-500 bg-green-500/10" : "text-muted-foreground")}
                      title="Helpful"
                    >
                      <ThumbsUpIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setLiked(false)}
                      className={cn("flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/80 transition-colors", liked === false ? "text-destructive bg-destructive/10" : "text-muted-foreground")}
                      title="Not helpful"
                    >
                      <ThumbsDownIcon className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}

                {/* Version switcher */}
                {hasMultipleVersions && (
                  <div className="flex items-center gap-1 border border-border/30 bg-muted/40 px-1 py-0.5 rounded-md text-[11px] font-medium text-muted-foreground ml-2">
                    <button
                      disabled={currentVersionIndex === 0}
                      onClick={handlePrevVersion}
                      className="p-0.5 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-1 min-w-[32px] text-center select-none">
                      {currentVersionIndex + 1} / {totalVersions}
                    </span>
                    <button
                      disabled={currentVersionIndex === totalVersions - 1}
                      onClick={handleNextVersion}
                      className="p-0.5 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Collapsible Request Inspector Panel */}
        {showInspector && message.metadata && (
          <div className="ml-5">
            <RequestInspector metadata={message.metadata} />
          </div>
        )}
      </div>
    </div>
  );
});

