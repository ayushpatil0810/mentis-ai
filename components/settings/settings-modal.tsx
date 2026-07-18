"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettingsAction } from "@/app/actions/settings";
import { getApiKeysAction } from "@/app/actions/api-keys";
import { ProfileSection } from "./profile-section";
import { ProvidersSection } from "./providers-section";
import { AppearanceSection } from "./appearance-section";
import { AccountSection } from "./account-section";
import { UserCircle02Icon, Key01Icon, PaintBoardIcon, Shield02Icon } from "hugeicons-react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const queryClient = useQueryClient();

  const { data: settings, isLoading: isLoadingSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettingsAction(),
    enabled: open,
  });

  const { data: apiKeys, isLoading: isLoadingKeys, refetch: refetchKeys } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: () => getApiKeysAction(),
    enabled: open,
  });

  const handleUpdateKeys = () => {
    refetchKeys();
    queryClient.invalidateQueries({ queryKey: ["available-models"] });
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: UserCircle02Icon },
    { id: "providers", label: "Connected Providers", icon: Key01Icon },
    { id: "appearance", label: "Appearance", icon: PaintBoardIcon },
    { id: "account", label: "Account", icon: Shield02Icon },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 h-[600px] flex overflow-hidden gap-0">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="w-64 bg-muted/30 border-r flex flex-col p-4 gap-2">
          <h2 className="font-semibold text-lg mb-4 px-2">Settings</h2>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                activeTab === tab.id
                  ? "bg-foreground/5 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {(isLoadingSettings || isLoadingKeys) ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Loading settings...
            </div>
          ) : (
            <>
              {activeTab === "profile" && <ProfileSection settings={settings} onUpdate={refetchSettings} />}
              {activeTab === "providers" && <ProvidersSection settings={settings} apiKeys={apiKeys || []} onUpdateKeys={handleUpdateKeys} onUpdateSettings={refetchSettings} />}
              {activeTab === "appearance" && <AppearanceSection />}
              {activeTab === "account" && <AccountSection />}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
