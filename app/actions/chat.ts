"use server";

import { requireAuth } from "@/lib/auth/auth-utils";
import * as chatService from "@/lib/services/chat";
import * as messageService from "@/lib/services/message";

export async function createChatAction(data: { title?: string, model?: string, systemPrompt?: string }) {
  const { user } = await requireAuth();
  return await chatService.createChat(user.id, data);
}

export async function getChatsAction() {
  const { user } = await requireAuth();
  return await chatService.getChats(user.id);
}

export async function getChatByIdAction(chatId: string) {
  const { user } = await requireAuth();
  return await chatService.getChatById(user.id, chatId);
}



export async function updateChatAction(chatId: string, data: { title?: string, isPinned?: boolean, isArchived?: boolean, isShared?: boolean }) {
  const { user } = await requireAuth();
  return await chatService.updateChat(user.id, chatId, data);
}

export async function deleteChatAction(chatId: string) {
  const { user } = await requireAuth();
  return await chatService.deleteChat(user.id, chatId);
}

export async function getMessagesAction(chatId: string) {
  const { user } = await requireAuth();
  return await messageService.getMessagesByChatId(user.id, chatId);
}


