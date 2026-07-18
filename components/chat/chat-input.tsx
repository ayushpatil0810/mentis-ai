import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Send, Square } from "iconoir-react";
import { Textarea } from "../ui/textarea";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ value, onChange, onSubmit, isLoading, placeholder }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-muted/50 p-2 shadow-sm border focus-within:ring-1 focus-within:ring-primary/20">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type a message..."}
        className="min-h-[44px] max-h-[200px] w-full resize-none border-0 bg-transparent py-3 px-4 focus-visible:ring-0 shadow-none text-base"
        rows={1}
      />
      <div className="absolute right-3 bottom-3 flex items-center justify-end">
        <Button 
          size="icon" 
          variant={value.trim() ? "default" : "secondary"} 
          className="h-8 w-8 rounded-full" 
          disabled={!value.trim() || isLoading}
          onClick={(e) => {
            e.preventDefault();
            if (value.trim()) onSubmit();
          }}
        >
          {isLoading ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
