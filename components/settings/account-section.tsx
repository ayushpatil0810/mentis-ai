"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { deleteAccountAction } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logout01Icon, Alert01Icon, UserCircleIcon, Key01Icon } from "hugeicons-react";
import { Loader } from "@/components/ui/loader";

export function AccountSection() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // In a real app, you'd fetch the user's email/name from the session or a query
  // We'll use a placeholder or check authClient state if available
  const { data: session } = authClient.useSession();
  const userEmail = session?.user?.email || "Your Account";

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
    <div className="space-y-10">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Profile & Security</h3>
        <p className="text-[14px] text-muted-foreground mt-1">Manage your personal information, session, and account data.</p>
      </div>

      <div className="space-y-4">
        
        {/* Profile Card */}
        <div className="border border-border/60 bg-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center shrink-0">
              <UserCircleIcon className="w-6 h-6 text-foreground/70" />
            </div>
            <div>
              <h4 className="font-semibold text-[15px]">{session?.user?.name || "Mentis User"}</h4>
              <p className="text-[13px] text-muted-foreground mt-0.5">{userEmail}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignOut} 
            disabled={isSigningOut}
            className="h-9 px-4 rounded-lg text-[13px] font-medium"
          >
            {isSigningOut ? <Loader size="sm" className="mr-2" /> : <Logout01Icon className="w-4 h-4 mr-2 text-muted-foreground" />}
            Sign Out
          </Button>
        </div>

        {/* Security / Danger Zone */}
        <div className="border border-destructive/20 bg-destructive/5 rounded-2xl p-6 mt-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <Key01Icon className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h4 className="font-semibold text-[15px] text-destructive">Danger Zone</h4>
              <p className="text-[13px] text-destructive/80 mt-0.5">Permanent destructive actions.</p>
            </div>
          </div>
          
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-[70%]">
              <h4 className="font-medium text-[14px]">Delete Account</h4>
              <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                Permanently remove your account and all associated data, including chats, messages, and encrypted API keys. This action cannot be undone.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
              className="h-9 px-4 rounded-lg text-[13px] font-medium shadow-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader size="sm" className="mr-2" /> : <Alert01Icon className="w-4 h-4 mr-2" />}
              Delete Account
            </Button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
