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
import { Loading01Icon } from "hugeicons-react";

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
      <DialogContent className="sm:max-w-5xl p-0 h-[80vh] min-h-[600px] flex overflow-hidden gap-0 rounded-[24px] border border-border shadow-2xl bg-background">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        
        {/* Settings Sidebar */}
        <div className="w-[240px] bg-sidebar/30 border-r border-border/40 flex flex-col pt-8 pb-4">
          <div className="px-6 mb-6">
            <h2 className="font-semibold text-[14px] tracking-tight text-foreground/80">Preferences</h2>
          </div>
          
          <div className="flex flex-col gap-0.5 px-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] transition-all duration-200 text-left select-none relative",
                  activeTab === tab.id
                    ? "bg-foreground/5 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground font-normal"
                )}
              >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "opacity-100" : "opacity-60")} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto bg-background p-10 relative">
          <div className="max-w-2xl mx-auto w-full">
            {(isLoadingSettings || isLoadingKeys) ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loading01Icon className="w-5 h-5 animate-spin text-muted-foreground/50" />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "profile" && <ProfileSection settings={settings} onUpdate={refetchSettings} />}
                {activeTab === "providers" && <ProvidersSection settings={settings} apiKeys={apiKeys || []} onUpdateKeys={handleUpdateKeys} onUpdateSettings={refetchSettings} />}
                {activeTab === "appearance" && <AppearanceSection />}
                {activeTab === "account" && <AccountSection />}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
