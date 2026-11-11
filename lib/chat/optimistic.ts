import type { QueryClient } from "@tanstack/react-query";
import { DEFAULT_CHAT_TITLE } from "@/lib/chat/title";

const pendingCreates = new Map<string, Promise<void>>();
const createSettled = new Map<string, { resolve: () => void; reject: (error: Error) => void }>();

export function initialMessageKey(chatId: string) {
  return `initial_message:${chatId}`;
}

export function stageInitialMessage(chatId: string, text: string) {
  sessionStorage.setItem(initialMessageKey(chatId), text);
}

export function peekInitialMessage(chatId: string) {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(initialMessageKey(chatId)) || "";
}

export function takeInitialMessage(chatId: string) {
  const text = peekInitialMessage(chatId);
  if (text) sessionStorage.removeItem(initialMessageKey(chatId));
  return text;
}

/** The chat page waits on this before it calls the model, so the row exists. */
export function expectChatCreate(chatId: string) {
  let resolve: () => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  pendingCreates.set(chatId, promise);
  createSettled.set(chatId, { resolve, reject });
}

export function resolveChatCreate(chatId: string) {
  createSettled.get(chatId)?.resolve();
  createSettled.delete(chatId);
  pendingCreates.delete(chatId);
}

export function rejectChatCreate(chatId: string, error: Error) {
  createSettled.get(chatId)?.reject(error);
  createSettled.delete(chatId);
  pendingCreates.delete(chatId);
}

export function waitForChatCreate(chatId: string) {
  return pendingCreates.get(chatId) ?? Promise.resolve();
}

export function optimisticChat(id: string, model: string) {
  const now = new Date().toISOString();
  return {
    id,
    title: DEFAULT_CHAT_TITLE,
    model: model || null,
    systemPrompt: null,
    isPinned: false,
    isArchived: false,
    isShared: false,
    sharePath: null,
    parentChatId: null,
    branchPointMessageId: null,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  };
}

type ListResult = { success: true; data: Array<{ id: string }> } | { success: false };

export function seedOptimisticChat(
  queryClient: QueryClient,
  chat: ReturnType<typeof optimisticChat>,
) {
  queryClient.setQueryData(["chat", chat.id], { success: true, data: chat });
  queryClient.setQueryData(["messages", chat.id], { success: true, data: [] });
  queryClient.setQueryData(["chats"], (current: ListResult | undefined) => {
    if (!current?.success) return current;
    if (current.data.some((item) => item.id === chat.id)) return current;
    return { success: true, data: [chat, ...current.data] };
  });
}

export function dropOptimisticChat(queryClient: QueryClient, chatId: string) {
  queryClient.setQueryData(["chats"], (current: ListResult | undefined) => {
    if (!current?.success) return current;
    return { success: true, data: current.data.filter((item) => item.id !== chatId) };
  });
  queryClient.removeQueries({ queryKey: ["chat", chatId] });
  queryClient.removeQueries({ queryKey: ["messages", chatId] });
  sessionStorage.removeItem(initialMessageKey(chatId));
}

export function patchCachedChat(
  queryClient: QueryClient,
  chatId: string,
  patch: Record<string, unknown>,
) {
  queryClient.setQueryData(["chat", chatId], (current: { success: true; data: Record<string, unknown> } | undefined) => {
    if (!current?.success) return current;
    return { success: true, data: { ...current.data, ...patch } };
  });
  queryClient.setQueryData(["chats"], (current: { success: true; data: Array<Record<string, unknown> & { id: string }> } | undefined) => {
    if (!current?.success) return current;
    return {
      success: true,
      data: current.data.map((chat) => (chat.id === chatId ? { ...chat, ...patch } : chat)),
    };
  });
}

export function removeCachedChat(queryClient: QueryClient, chatId: string) {
  queryClient.setQueryData(["chats"], (current: ListResult | undefined) => {
    if (!current?.success) return current;
    return { success: true, data: current.data.filter((item) => item.id !== chatId) };
  });
}
