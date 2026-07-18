import { cn } from "@/lib/utils";
import { Sparks, Copy } from "iconoir-react";
import { MessageRenderer } from "./message-renderer";
import { Button } from "../ui/button";
import { toast } from "sonner";

export function MessageItem({ message }: { message: any }) {
  const isUser = message.role === "user";
  const textContent = message.content || 
    (message.parts && Array.isArray(message.parts) ? message.parts.map((p: any) => p.text || "").join("") : "") || 
    message.text || "";

  return (
    <div className={cn("flex w-full gap-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mt-1">
          <Sparks className="h-4 w-4" />
        </div>
      )}
      
      <div 
        className={cn(
          "max-w-[80%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed relative group",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-foreground"
        )}
      >
        <MessageRenderer content={textContent} />
        
        {!isUser && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute -right-10 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              navigator.clipboard.writeText(textContent);
              toast.success("Message copied to clipboard");
            }}
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
