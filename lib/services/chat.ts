import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { chat } from "../db/schema";
import { ulid } from "ulid";
import { z } from "zod";
import { NotFoundError, AuthError } from "../utils/errors";

const createChatSchema = z.object({
  title: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
});

export async function createChat(userId: string, data: z.infer<typeof createChatSchema>) {
  if (!userId) throw new AuthError();
  
  const parsed = createChatSchema.parse(data);
  const id = ulid();
  
  const [newChat] = await db.insert(chat).values({
    id,
    userId,
    title: parsed.title || "New Chat",
    model: parsed.model,
    systemPrompt: parsed.systemPrompt,
  }).returning();
  
  return newChat;
}

export async function getChats(userId: string) {
  if (!userId) throw new AuthError();
  
  return await db.select()
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.lastMessageAt));
}

export async function getChatById(userId: string, chatId: string) {
  if (!userId) throw new AuthError();
  
  const [existingChat] = await db.select()
    .from(chat)
    .where(and(eq(chat.id, chatId), eq(chat.userId, userId)));
    
  if (!existingChat) {
    throw new NotFoundError("Chat not found");
  }
  
  return existingChat;
}

const updateChatSchema = z.object({
  title: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isShared: z.boolean().optional(),
  lastMessageAt: z.date().optional(),
});

export async function updateChat(userId: string, chatId: string, data: z.infer<typeof updateChatSchema>) {
  if (!userId) throw new AuthError();
  
  const parsed = updateChatSchema.parse(data);
  
  const [updatedChat] = await db.update(chat)
    .set({ ...parsed })
    .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
    .returning();
    
  if (!updatedChat) {
    throw new NotFoundError("Chat not found");
  }
  
  return updatedChat;
}

export async function deleteChat(userId: string, chatId: string) {
  if (!userId) throw new AuthError();
  
  const [deletedChat] = await db.delete(chat)
    .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
    .returning();
    
  if (!deletedChat) {
    throw new NotFoundError("Chat not found");
  }
  
  return deletedChat;
}
