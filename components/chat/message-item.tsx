import { cn } from "@/lib/utils";
import { Sparks } from "iconoir-react";

export function MessageItem({ message }: { message: any }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full gap-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary mt-1">
          <Sparks className="h-4 w-4" />
        </div>
      )}
      
      <div 
        className={cn(
          "max-w-[80%] rounded-2xl px-5 py-3 whitespace-pre-wrap text-[15px] leading-relaxed",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
