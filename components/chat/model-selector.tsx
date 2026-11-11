"use client";

import { useQuery } from "@tanstack/react-query";
import { getAvailableModelsAction } from "@/app/actions/models";
import { saveModelPreference, pickDefaultModelId } from "@/lib/chat/model-preference";
import { useEffect } from "react";
import Image from "next/image";
import { SparklesIcon, CheckmarkBadge01Icon, Key01Icon } from "hugeicons-react";
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
  autoSelect?: boolean;
}

export function ModelSelector({ value, onChange, autoSelect = true }: ModelSelectorProps) {
  const { data: models, isPending } = useQuery({
    queryKey: ["available-models"],
    queryFn: () => getAvailableModelsAction(),
    staleTime: 5 * 60 * 1000,
  });

  // Automatically set a default value if not set and models are loaded
  useEffect(() => {
    if (!autoSelect || !models || models.length === 0 || value) return;
    const savedModel = localStorage.getItem("mentis_selected_model");
    const next =
      savedModel && models.some((m) => m.id === savedModel)
        ? savedModel
        : pickDefaultModelId(models.map((m) => m.id));
    if (!next) return;
    saveModelPreference(next);
    onChange(next);
  }, [autoSelect, models, value, onChange]);

  if (isPending) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="h-8 px-3 rounded-xl text-muted-foreground text-[12.5px] font-medium"
      >
        Loading…
      </Button>
    );
  }

  if (!models || models.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.dispatchEvent(new CustomEvent("open-settings"))}
        className="h-8 px-3 rounded-xl border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer"
      >
        <Key01Icon className="w-3.5 h-3.5" />
        <span>Add API Key</span>
      </Button>
    );
  }

  const getIcon = (providerId: string, name: string) => {
    if (providerId === "anthropic") {
      return (
        <div className="relative w-4 h-4">
          <Image src="/provider-brand/anthropic-light.svg" alt={name} fill className="object-contain block dark:hidden" />
          <Image src="/provider-brand/anthropic-dark.svg" alt={name} fill className="object-contain hidden dark:block" />
        </div>
      );
    }
    if (providerId === "openai") {
      return (
        <div className="relative w-4 h-4">
          <Image src="/provider-brand/openai-light.svg" alt={name} fill className="object-contain block dark:hidden" />
          <Image src="/provider-brand/openai-dark.svg" alt={name} fill className="object-contain hidden dark:block" />
        </div>
      );
    }
    if (providerId === "gemini") {
      return (
        <div className="relative w-4 h-4">
          <Image src="/provider-brand/gemini.svg" alt={name} fill className="object-contain" />
        </div>
      );
    }
    return <SparklesIcon className="w-4 h-4 opacity-60" />;
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-8 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[13px] font-medium tracking-tight"
          title={selectedModel ? `Model: ${selectedModel.name}` : "Select Model"}
        >
          {selectedModel ? selectedModel.name : "Select Model"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] p-1.5 rounded-2xl border-border/50 shadow-xl bg-background/95 backdrop-blur-md">
        <div className="mb-1.5 mx-1 p-2 bg-muted/40 rounded-xl border border-border/30">
          <p className="text-[10.5px] text-muted-foreground/90 leading-snug text-center">
            Note: Only text-based models are fully supported at this time. Audio and image models may not work correctly.
          </p>
        </div>
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
                  saveModelPreference(model.id);
                }}
                className="flex items-center justify-between px-2 py-2 cursor-pointer rounded-xl text-[13px] hover:bg-muted focus:bg-muted"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="flex items-center justify-center">
                    {getIcon(model.providerId, provider)}
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
