"use client";

import { useQuery } from "@tanstack/react-query";
import { getAvailableModelsAction } from "@/app/actions/models";
import { useEffect } from "react";
import Image from "next/image";
import { SparklesIcon, CheckmarkBadge01Icon } from "hugeicons-react";
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
