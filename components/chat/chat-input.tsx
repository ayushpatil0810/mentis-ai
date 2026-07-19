import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "../ui/prompt-input";
import { Button } from "../ui/button";
import { ArrowUp01Icon, StopIcon } from "hugeicons-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onStop: () => void;
  placeholder?: string;
  className?: string;
  modelSelector?: React.ReactNode;
}

export function ChatInput({ value, onChange, onSubmit, isLoading, onStop, placeholder, className, modelSelector }: ChatInputProps) {
  const isExpanded = value.includes("\n") || value.length > 60;

  return (
    <div className={cn("relative w-full", className)}>
      <PromptInput
        value={value}
        onValueChange={onChange}
        isLoading={isLoading}
        onSubmit={onSubmit}
        className="w-full relative border-none bg-transparent shadow-none p-0 focus-within:ring-0"
      >
        <PromptInputTextarea 
          placeholder={placeholder || "Ask Anything"} 
          className={cn("px-3.5 py-2 text-[15px]", !isExpanded && "pr-12")} 
        />
        <PromptInputActions className={cn("justify-end items-center gap-1.5", isExpanded ? "pt-2 pb-1 pr-2" : "absolute right-1.5 top-1/2 -translate-y-1/2")}>
          {modelSelector && (
            <div className="shrink-0">
              {modelSelector}
            </div>
          )}
          <AnimatePresence>
            {(value.trim().length > 0 || isLoading) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="shrink-0"
              >
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
                      className="h-8 w-8 rounded-full shadow-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        if (value.trim()) onSubmit();
                      }}
                    >
                      <ArrowUp01Icon className="size-5" />
                    </Button>
                  )}
                </PromptInputAction>
              </motion.div>
            )}
          </AnimatePresence>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
