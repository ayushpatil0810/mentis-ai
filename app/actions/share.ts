"use server";

import { requireAuth } from "@/lib/auth/auth-utils";
import * as shareService from "@/lib/services/share";
import { safeAction } from "@/lib/utils/action";

export async function createShareAction(chatId: string) {
  return safeAction("createShare", async () => {
    const { user } = await requireAuth();
    return await shareService.createShare(user.id, chatId);
  });
}

export async function getShareByChatIdAction(chatId: string) {
  return safeAction("getShareByChatId", async () => {
    const { user } = await requireAuth();
    return await shareService.getShareByChatId(user.id, chatId);
  });
}

export async function updateShareAction(shareId: string) {
  return safeAction("updateShare", async () => {
    const { user } = await requireAuth();
    return await shareService.updateShare(user.id, shareId);
  });
}

export async function setShareVisibilityAction(shareId: string, isPublic: boolean) {
  return safeAction("setShareVisibility", async () => {
    const { user } = await requireAuth();
    return await shareService.setShareVisibility(user.id, shareId, isPublic);
  });
}

export async function deleteShareAction(shareId: string) {
  return safeAction("deleteShare", async () => {
    const { user } = await requireAuth();
    return await shareService.deleteShare(user.id, shareId);
  });
}

export async function forkShareAction(shareId: string) {
  return safeAction("forkShare", async () => {
    const { user } = await requireAuth();
    return await shareService.forkShare(user.id, shareId);
  });
}
