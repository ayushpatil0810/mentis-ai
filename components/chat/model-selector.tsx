"use client";

import { useQuery } from "@tanstack/react-query";
import { getAvailableModelsAction } from "@/app/actions/models";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SparklesIcon } from "hugeicons-react";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { data: models, isLoading } = useQuery({
    queryKey: ["available-models"],
    queryFn: () => getAvailableModelsAction(),
  });

  // Automatically set a default value if not set and models are loaded
  useEffect(() => {
    if (models && models.length > 0 && !value) {
      // Try to get from localStorage first
      const savedModel = localStorage.getItem("mentis_selected_model");
      if (savedModel && models.some((m) => m.id === savedModel)) {
        onChange(savedModel);
      } else {
        onChange(models[0].id);
      }
    }
  }, [models, value, onChange]);

  const handleValueChange = (newValue: string) => {
    onChange(newValue);
    localStorage.setItem("mentis_selected_model", newValue);
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-[180px] rounded-md" />;
  }

  if (!models || models.length === 0) {
    return null;
  }

  // Group models by provider
  const groupedModels = models.reduce((acc, model) => {
    const providerName = model.providerId === "openai" ? "OpenAI"
      : model.providerId === "anthropic" ? "Anthropic"
      : model.providerId === "gemini" ? "Google Gemini"
      : "Default";
      
    if (!acc[providerName]) acc[providerName] = [];
    acc[providerName].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[200px] h-9 text-sm font-medium border-none shadow-none focus:ring-0 bg-transparent hover:bg-muted/50 rounded-full flex gap-2">
        <SparklesIcon className="h-4 w-4 text-muted-foreground" />
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedModels).map(([provider, providerModels]) => (
          <SelectGroup key={provider}>
            <SelectLabel>{provider}</SelectLabel>
            {providerModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
