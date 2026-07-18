"use client";

import { useQuery } from "@tanstack/react-query";
import { getAvailableModelsAction } from "@/app/actions/models";
import { useEffect } from "react";
import { SparklesIcon, BrainIcon, Message02Icon, AiNetworkIcon, CheckmarkBadge01Icon } from "hugeicons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { data: models } = useQuery({
    queryKey: ["available-models"],
    queryFn: () => getAvailableModelsAction(),
  });

  // Automatically set a default value if not set and models are loaded
  useEffect(() => {
    if (models && models.length > 0 && !value) {
      const savedModel = localStorage.getItem("mentis_selected_model");
      if (savedModel && models.some((m) => m.id === savedModel)) {
        onChange(savedModel);
      } else {
        onChange(models[0].id);
      }
    }
  }, [models, value, onChange]);

  if (!models || models.length === 0) return null;

  const getIcon = (providerId: string) => {
    if (providerId === "anthropic") return <BrainIcon className="w-4 h-4" />;
    if (providerId === "openai") return <AiNetworkIcon className="w-4 h-4" />;
    if (providerId === "gemini") return <Message02Icon className="w-4 h-4" />;
    return <SparklesIcon className="w-4 h-4" />;
  };

  const getProviderName = (providerId: string) => {
    if (providerId === "anthropic") return "Anthropic";
    if (providerId === "openai") return "OpenAI";
    if (providerId === "gemini") return "Google Gemini";
    return "Local / Default";
  };

  // Group models by provider
  const groupedModels = models.reduce((acc, model) => {
    const providerName = getProviderName(model.providerId);
    if (!acc[providerName]) acc[providerName] = [];
    acc[providerName].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  const selectedModel = models.find(m => m.id === value);
  const SelectedIcon = selectedModel ? getIcon(selectedModel.providerId) : <SparklesIcon className="w-4 h-4" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          title={selectedModel ? `Model: ${selectedModel.name}` : "Select Model"}
        >
          {SelectedIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] p-1.5 rounded-xl border-border/50 shadow-xl bg-background/95 backdrop-blur-md">
        {Object.entries(groupedModels).map(([provider, providerModels], idx) => (
          <DropdownMenuGroup key={provider}>
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5">
              {provider}
            </DropdownMenuLabel>
            {providerModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => {
                  onChange(model.id);
                  localStorage.setItem("mentis_selected_model", model.id);
                }}
                className="flex items-center justify-between px-2 py-2 cursor-pointer rounded-lg text-[13px] hover:bg-muted focus:bg-muted"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 flex items-center justify-center opacity-60">
                    {getIcon(model.providerId)}
                  </div>
                  <span className="truncate">{model.name}</span>
                </div>
                {value === model.id && (
                  <CheckmarkBadge01Icon className="w-4 h-4 text-foreground opacity-70 shrink-0 ml-2" />
                )}
              </DropdownMenuItem>
            ))}
            {idx < Object.entries(groupedModels).length - 1 && (
              <DropdownMenuSeparator className="bg-border/30 my-1" />
            )}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
