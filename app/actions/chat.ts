"use server";

import { requireAuth } from "@/lib/auth/auth-utils";
import * as chatService from "@/lib/services/chat";
import * as messageService from "@/lib/services/message";
import { safeAction } from "@/lib/utils/action";

export async function createChatAction(data: { title?: string, model?: string, systemPrompt?: string }) {
  return safeAction("createChat", async () => {
    const { user } = await requireAuth();
    return await chatService.createChat(user.id, data);
  });
}

export async function getChatsAction() {
  return safeAction("getChats", async () => {
    const { user } = await requireAuth();
    return await chatService.getChats(user.id);
  });
}

export async function getChatByIdAction(chatId: string) {
  return safeAction("getChatById", async () => {
    const { user } = await requireAuth();
    return await chatService.getChatById(user.id, chatId);
  });
}

export async function updateChatAction(chatId: string, data: { title?: string, isPinned?: boolean, isArchived?: boolean, isShared?: boolean }) {
  return safeAction("updateChat", async () => {
    const { user } = await requireAuth();
    return await chatService.updateChat(user.id, chatId, data);
  });
}

export async function deleteChatAction(chatId: string) {
  return safeAction("deleteChat", async () => {
    const { user } = await requireAuth();
    return await chatService.deleteChat(user.id, chatId);
  });
}

export async function getMessagesAction(chatId: string) {
  return safeAction("getMessages", async () => {
    const { user } = await requireAuth();
    return await messageService.getMessagesByChatId(user.id, chatId);
  });
}

export async function branchChatAction(chatId: string, messageId: string) {
  return safeAction("branchChat", async () => {
    const { user } = await requireAuth();
    return await chatService.branchChat(user.id, chatId, messageId);
  });
}

export async function getBranchesAction(chatId: string) {
  return safeAction("getBranches", async () => {
    const { user } = await requireAuth();
    return await chatService.getBranches(user.id, chatId);
  });
}

export async function setActiveVersionAction(messageId: string) {
  return safeAction("setActiveVersion", async () => {
    const { user } = await requireAuth();
    return await messageService.setActiveVersion(user.id, messageId);
  });
}

