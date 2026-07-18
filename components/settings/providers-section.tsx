"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertApiKeyAction, deleteApiKeyAction, toggleApiKeyAction, testApiKeyAction } from "@/app/actions/api-keys";
import { updateSettingsAction } from "@/app/actions/settings";
import { toast } from "sonner";
import { CheckmarkCircle01Icon, CancelCircleIcon } from "hugeicons-react";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";

const PROVIDERS = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "gemini", name: "Google Gemini" },
];

export function ProvidersSection({ settings, apiKeys, onUpdateKeys, onUpdateSettings }: { settings: any, apiKeys: any[], onUpdateKeys: () => void, onUpdateSettings: () => void }) {
  const [defaultProvider, setDefaultProvider] = useState(settings?.defaultProvider || "openai");
  const [keysInput, setKeysInput] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

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
    // If they typed something, test that, otherwise test the saved key?
    // Wait, we need the raw key to test it. If they just saved it, we don't have it on the client.
    // The testApiKeyAction expects the raw key.
    const keyToTest = keysInput[providerId];
    if (!keyToTest) {
      toast.error("Please enter an API key to test first. Testing saved keys is not supported directly for security reasons (keys are encrypted).");
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

  const handleDelete = async (providerId: string) => {
    if (!window.confirm(`Are you sure you want to delete the ${providerId} API key?`)) return;
    try {
      await deleteApiKeyAction(providerId);
      toast.success("API key deleted");
      onUpdateKeys();
    } catch {
      toast.error("Failed to delete API key");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Connected Providers</h3>
        <p className="text-sm text-muted-foreground">Manage your AI provider API keys and default selection.</p>
      </div>

      <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Default Application Provider</label>
          <Select value={defaultProvider} onValueChange={handleDefaultProviderChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a default provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            This provider will be used if no specific model is selected in a chat.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {PROVIDERS.map((provider) => {
          const existingKey = apiKeys?.find((k: any) => k.provider === provider.id);
          const isEnabled = existingKey?.isEnabled ?? false;

          return (
            <div key={provider.id} className="border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{provider.name}</h4>
                  {existingKey ? (
                    isEnabled ? (
                      <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 shadow-none">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="shadow-none">Disabled</Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground shadow-none">Not Configured</Badge>
                  )}
                </div>
                {existingKey && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggle(provider.id, isEnabled)}>
                      {isEnabled ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(provider.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-sm font-medium">
                  {existingKey ? "Update API Key" : "Add API Key"}
                </label>
                <div className="flex gap-2">
                  <Input 
                    type="password"
                    placeholder={existingKey ? "sk-****************abc" : "Enter API Key..."}
                    value={keysInput[provider.id] || ""}
                    onChange={(e) => setKeysInput(prev => ({ ...prev, [provider.id]: e.target.value }))}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button 
                    variant="secondary" 
                    onClick={() => handleTestKey(provider.id)}
                    disabled={!keysInput[provider.id] || testing[provider.id]}
                  >
                    {testing[provider.id] ? <Loader size="sm" className="mr-2" /> : null}
                    Test
                  </Button>
                  <Button 
                    onClick={() => handleSaveKey(provider.id)}
                    disabled={!keysInput[provider.id] || saving[provider.id]}
                  >
                    {saving[provider.id] ? <Loader size="sm" className="mr-2" /> : null}
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your keys are encrypted before being stored securely.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
