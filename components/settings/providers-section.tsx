"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertApiKeyAction, deleteApiKeyAction, toggleApiKeyAction, testApiKeyAction } from "@/app/actions/api-keys";
import { updateSettingsAction } from "@/app/actions/settings";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  { 
    id: "openai", 
    name: "OpenAI",
    desc: "GPT-4o, GPT-4, GPT-3.5 Turbo",
    logoLight: "/provider-brand/openai-light.svg",
    logoDark: "/provider-brand/openai-dark.svg"
  },
  { 
    id: "anthropic", 
    name: "Anthropic",
    desc: "Claude 3.5 Sonnet, Opus, Haiku",
    logoLight: "/provider-brand/anthropic-light.svg",
    logoDark: "/provider-brand/anthropic-dark.svg"
  },
  { 
    id: "gemini", 
    name: "Google Gemini",
    desc: "Gemini 1.5 Pro, Flash",
    logoLight: "/provider-brand/gemini.svg",
    logoDark: "/provider-brand/gemini.svg"
  },
];

export function ProvidersSection({ settings, apiKeys, onUpdateKeys, onUpdateSettings }: { settings: any, apiKeys: any[], onUpdateKeys: () => void, onUpdateSettings: () => void }) {
  const [defaultProvider, setDefaultProvider] = useState(settings?.defaultProvider || "openai");
  const [keysInput, setKeysInput] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<Record<string, boolean>>({});

  const handleDefaultProviderChange = async (value: string) => {
    setDefaultProvider(value);
    try {
      await updateSettingsAction({ defaultProvider: value });
      toast.success("Default provider updated");
      onUpdateSettings();
    } catch {
      toast.error("Failed to update default provider");
    }
  };

  const handleSaveKey = async (providerId: string) => {
    const key = keysInput[providerId];
    if (!key) return;

    try {
      setSaving((prev) => ({ ...prev, [providerId]: true }));
      await upsertApiKeyAction(providerId, key);
      toast.success(`${providerId} API key saved successfully`);
      setKeysInput((prev) => ({ ...prev, [providerId]: "" }));
      onUpdateKeys();
    } catch {
      toast.error(`Failed to save ${providerId} API key`);
    } finally {
      setSaving((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleTestKey = async (providerId: string) => {
    const keyToTest = keysInput[providerId];
    if (!keyToTest) {
      toast.error("Please enter an API key to test first.");
      return;
    }

    try {
      setTesting((prev) => ({ ...prev, [providerId]: true }));
      const result = await testApiKeyAction(providerId, keyToTest);
      if (result.success) {
        toast.success(`Connection to ${providerId} successful!`);
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch {
      toast.error("An error occurred while testing the key");
    } finally {
      setTesting((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleToggle = async (providerId: string, currentState: boolean) => {
    try {
      await toggleApiKeyAction(providerId, !currentState);
      toast.success(`Provider ${!currentState ? "enabled" : "disabled"}`);
      onUpdateKeys();
    } catch {
      toast.error("Failed to toggle provider");
    }
  };

  const handleDelete = (providerId: string) => {
    setProviderToDelete(providerId);
  };

  const confirmDelete = async () => {
    if (!providerToDelete) return;
    try {
      await deleteApiKeyAction(providerToDelete);
      toast.success("API key deleted");
      onUpdateKeys();
    } catch {
      toast.error("Failed to delete API key");
    } finally {
      setProviderToDelete(null);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Connected Providers</h3>
        <p className="text-[14px] text-muted-foreground mt-1">Configure and manage your API keys to enable different AI models.</p>
      </div>

      <div className="bg-muted/30 p-5 rounded-2xl border border-border/40 shadow-sm flex items-center justify-between">
        <div>
          <label className="text-[14px] font-medium block">Default Application Provider</label>
          <p className="text-[13px] text-muted-foreground mt-0.5 max-w-sm">
            This provider will be automatically used when starting new conversations if no specific model is selected.
          </p>
        </div>
        <Select value={defaultProvider} onValueChange={handleDefaultProviderChange}>
          <SelectTrigger className="w-[200px] h-10 rounded-xl">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {PROVIDERS.map((p) => (
              <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const existingKey = apiKeys?.find((k: any) => k.provider === provider.id);
          const isEnabled = existingKey?.isEnabled ?? false;
          const isEditing = editingProvider[provider.id] || !existingKey;

          return (
            <div key={provider.id} className={cn(
              "border border-border/60 rounded-2xl p-5 space-y-4 transition-all duration-300",
              existingKey ? (isEnabled ? "bg-card shadow-sm" : "bg-card/40 border-border/40") : "bg-card/20 border-dashed border-border/30"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border/50 shadow-sm flex items-center justify-center relative overflow-hidden p-2.5">
                    {provider.logoLight === provider.logoDark ? (
                      <Image src={provider.logoLight} alt={provider.name} fill className="object-contain p-2.5" />
                    ) : (
                      <>
                        <Image src={provider.logoLight} alt={provider.name} fill className="object-contain p-2.5 block dark:hidden" />
                        <Image src={provider.logoDark} alt={provider.name} fill className="object-contain p-2.5 hidden dark:block" />
                      </>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[15px]">{provider.name}</h4>
                      {existingKey ? (
                        isEnabled ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none font-medium h-5 px-1.5 text-[10px] rounded-md">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="shadow-none font-medium h-5 px-1.5 text-[10px] rounded-md">Disabled</Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground shadow-none font-medium h-5 px-1.5 text-[10px] rounded-md border-border/50">Not Configured</Badge>
                      )}
                    </div>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{provider.desc}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {existingKey && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggle(provider.id, isEnabled)} 
                        className="h-8 rounded-lg text-xs"
                      >
                        {isEnabled ? "Disable" : "Enable"}
                      </Button>
                      {!isEditing && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingProvider(prev => ({ ...prev, [provider.id]: true }))} 
                          className="h-8 rounded-lg text-xs"
                        >
                          Change Key
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(provider.id)} 
                        className="h-8 rounded-lg text-xs bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-none border-0"
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="pl-16 space-y-3">
                  <p className="text-[12px] text-muted-foreground">
                    Please paste your {provider.name} API key below. Keys are encrypted and saved securely.
                  </p>
                  <div className="flex gap-2 relative">
                    <Input 
                      type="password"
                      placeholder={existingKey ? "sk-••••••••••••••••••••••••" : `Enter your ${provider.name} API Key...`}
                      value={keysInput[provider.id] || ""}
                      onChange={(e) => setKeysInput(prev => ({ ...prev, [provider.id]: e.target.value }))}
                      className="flex-1 font-mono text-[13px] h-9 rounded-lg bg-background"
                    />
                    {keysInput[provider.id] && (
                      <Button 
                        variant="secondary" 
                        onClick={() => handleTestKey(provider.id)}
                        disabled={testing[provider.id]}
                        className="h-9 px-3 rounded-lg text-xs"
                      >
                        {testing[provider.id] ? <Loader size="sm" className="mr-1.5" /> : null}
                        Test
                      </Button>
                    )}
                    <Button 
                      onClick={async () => {
                        await handleSaveKey(provider.id);
                        setEditingProvider(prev => ({ ...prev, [provider.id]: false }));
                      }}
                      disabled={!keysInput[provider.id] || saving[provider.id]}
                      className="h-9 px-4 rounded-lg text-xs font-medium"
                    >
                      {saving[provider.id] ? <Loader size="sm" className="mr-1.5" /> : null}
                      {existingKey ? "Update" : "Save Key"}
                    </Button>
                    {existingKey && (
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setKeysInput(prev => ({ ...prev, [provider.id]: "" }));
                          setEditingProvider(prev => ({ ...prev, [provider.id]: false }));
                        }}
                        className="h-9 px-3 rounded-lg text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="pl-16 flex items-center justify-between text-[13px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    API key configured & securely saved
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <Dialog open={!!providerToDelete} onOpenChange={(open) => !open && setProviderToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the {providerToDelete} API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
