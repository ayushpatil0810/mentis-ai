"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { deleteAccountAction } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logout01Icon, Alert01Icon } from "hugeicons-react";
import { Loader } from "@/components/ui/loader";

export function AccountSection() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await authClient.signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to sign out");
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.prompt("Type 'DELETE' to confirm account deletion. This action is irreversible.");
    if (confirm === "DELETE") {
      try {
        setIsDeleting(true);
        await deleteAccountAction();
        toast.success("Account deleted successfully");
        await authClient.signOut();
        router.push("/login");
      } catch {
        toast.error("Failed to delete account");
        setIsDeleting(false);
      }
    } else if (confirm !== null) {
      toast.error("Confirmation failed. Account not deleted.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Account Security</h3>
        <p className="text-sm text-muted-foreground">Manage your session and account data.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            <h4 className="font-medium text-sm">Sign Out</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Log out of your current session on this device.
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? <Loader size="sm" className="mr-2" /> : <Logout01Icon className="w-4 h-4 mr-2" />}
            Sign Out
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="max-w-[60%]">
            <h4 className="font-medium text-sm text-destructive flex items-center gap-2">
              <Alert01Icon className="w-4 h-4" /> Delete Account
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently remove your account and all associated data, including chats, messages, and encrypted API keys. This action cannot be undone.
            </p>
          </div>
          <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
            {isDeleting ? <Loader size="sm" className="mr-2" /> : null}
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
