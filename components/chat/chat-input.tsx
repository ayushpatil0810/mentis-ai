import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "../ui/prompt-input";
import { Button } from "../ui/button";
import { ArrowUp01Icon, StopIcon } from "hugeicons-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onStop: () => void;
  placeholder?: string;
  className?: string;
}

export function ChatInput({ value, onChange, onSubmit, isLoading, onStop, placeholder, className }: ChatInputProps) {
  const isExpanded = value.includes("\n") || value.length > 60;

  return (
    <div className={cn("relative w-full", className)}>
      <PromptInput
        value={value}
        onValueChange={onChange}
        isLoading={isLoading}
        onSubmit={onSubmit}
        className="w-full relative px-2 py-1"
      >
        <PromptInputTextarea 
          placeholder={placeholder || "Message Mentis..."} 
          className={cn("px-4 py-2.5 text-[15px]", !isExpanded && "pr-12")} 
        />
        <PromptInputActions className={cn("justify-end", isExpanded ? "pt-2 pb-1 pr-2" : "absolute right-3 bottom-2.5")}>
          <PromptInputAction
            tooltip={isLoading ? "Stop generation" : "Send message"}
          >
            {isLoading ? (
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  onStop();
                }}
              >
                <StopIcon className="size-5 fill-current" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full transition-all duration-200"
                disabled={!value.trim()}
                onClick={(e) => {
                  e.preventDefault();
                  if (value.trim()) onSubmit();
                }}
              >
                <ArrowUp01Icon className="size-5" />
              </Button>
            )}
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
