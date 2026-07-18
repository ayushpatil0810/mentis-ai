"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateSettingsAction } from "@/app/actions/settings";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

export function ProfileSection({ settings, onUpdate }: { settings: any, onUpdate: () => void }) {
  const [name, setName] = useState(settings?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      await updateSettingsAction({ name });
      toast.success("Profile updated successfully");
      onUpdate();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">Manage your public profile and details.</p>
      </div>

      <div className="flex items-center gap-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={settings?.image || undefined} />
          <AvatarFallback className="text-2xl">{settings?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-medium text-sm">Profile Picture</p>
          <p className="text-xs text-muted-foreground">Managed by your authentication provider.</p>
        </div>
      </div>

      <div className="space-y-4 max-w-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Name</label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Your name" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <Input 
            value={settings?.email || ""} 
            disabled 
            className="bg-muted/50 text-muted-foreground"
          />
        </div>

        <Button onClick={handleUpdate} disabled={isUpdating || name === settings?.name}>
          {isUpdating && <Loader size="sm" className="mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
