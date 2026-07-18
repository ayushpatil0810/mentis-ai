"use server";

import { getUserSettings, updateUserSettings, deleteUserAccount } from "@/lib/services/user";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getSettingsAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) throw new Error("Unauthorized");
  
  return getUserSettings(session.user.id);
}

export async function updateSettingsAction(data: { name?: string, defaultProvider?: string | null }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) throw new Error("Unauthorized");
  
  const updated = await updateUserSettings(session.user.id, data);
  revalidatePath("/");
  return updated;
}

export async function deleteAccountAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) throw new Error("Unauthorized");
  
  const deleted = await deleteUserAccount(session.user.id);
  // Optional: better-auth might need to know the session is invalid, but 
  // since the user is gone, it will be naturally unauthorized.
  revalidatePath("/");
  return deleted;
}
