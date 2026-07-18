"use client";

import { useState } from "react";
import { Copy01Icon, ThumbsUpIcon, ThumbsDownIcon } from "hugeicons-react";
import { toast } from "sonner";
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
} from "@/components/ui/message";
import { Button } from "../ui/button";

export function MessageItem({ message }: { message: any }) {
  const isUser = message.role === "user";
  const textContent = message.content || 
    (message.parts && Array.isArray(message.parts) ? message.parts.map((p: any) => p.text || "").join("") : "") || 
    message.text || "";

  const [liked, setLiked] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 w-full py-2 group">
      {isUser ? (
        <Message className="justify-end w-full">
          <MessageContent className="rounded-3xl bg-muted text-foreground px-5 py-2.5 max-w-[85%] text-[15px]">
            {textContent}
          </MessageContent>
        </Message>
      ) : (
        <Message className="justify-start w-full">
          <div className="flex w-full flex-col gap-1 max-w-[85%]">
            <MessageContent 
              markdown
              className="bg-transparent text-foreground p-0 text-[15px] prose-p:leading-relaxed prose-pre:my-4 prose-pre:rounded-lg prose-headings:font-medium prose-a:text-primary max-w-none"
            >
              {textContent}
            </MessageContent>
            
            <MessageActions className="self-end opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageAction tooltip="Copy to clipboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={handleCopy}
                >
                  <Copy01Icon className={`h-4 w-4 ${copied ? "text-green-500" : ""}`} />
                </Button>
              </MessageAction>

              <MessageAction tooltip="Helpful">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-full text-muted-foreground hover:text-foreground ${liked === true ? "bg-green-100 text-green-500 hover:text-green-600 dark:bg-green-900/30" : ""}`}
                  onClick={() => setLiked(true)}
                >
                  <ThumbsUpIcon className="h-4 w-4" />
                </Button>
              </MessageAction>

              <MessageAction tooltip="Not helpful">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-full text-muted-foreground hover:text-foreground ${liked === false ? "bg-red-100 text-red-500 hover:text-red-600 dark:bg-red-900/30" : ""}`}
                  onClick={() => setLiked(false)}
                >
                  <ThumbsDownIcon className="h-4 w-4" />
                </Button>
              </MessageAction>
            </MessageActions>
          </div>
        </Message>
      )}
    </div>
  );
}
