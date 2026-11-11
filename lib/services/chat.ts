import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "../db";
import { chat, message } from "../db/schema";
import { ulid } from "ulid";
import { z } from "zod";
import { NotFoundError, AuthError } from "../utils/errors";
import { DEFAULT_CHAT_TITLE } from "../chat/title";

const createChatSchema = z.object({
  id: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/i).optional(),
  title: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
});

export async function createChat(userId: string, data: z.infer<typeof createChatSchema>) {
  if (!userId) throw new AuthError();
  
  const parsed = createChatSchema.parse(data);
  const id = parsed.id || ulid();
  
  const [newChat] = await db.insert(chat).values({
    id,
    userId,
    title: parsed.title || DEFAULT_CHAT_TITLE,
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

/** Set a generated title only when the chat is still using the default title. */
export async function updateChatTitleIfDefault(userId: string, chatId: string, title: string) {
  if (!userId) throw new AuthError();

  const parsedTitle = z.string().min(1).parse(title);

  const [updatedChat] = await db
    .update(chat)
    .set({ title: parsedTitle })
    .where(
      and(
        eq(chat.id, chatId),
        eq(chat.userId, userId),
        eq(chat.title, DEFAULT_CHAT_TITLE),
      ),
    )
    .returning();

  return updatedChat ?? null;
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

export async function getBranches(userId: string, chatId: string) {
  if (!userId) throw new AuthError();
  
  // Verify ownership of the parent chat
  await getChatById(userId, chatId);
  
  return await db.select()
    .from(chat)
    .where(and(eq(chat.parentChatId, chatId), eq(chat.userId, userId)))
    .orderBy(desc(chat.createdAt));
}

export async function branchChat(userId: string, chatId: string, messageId: string) {
  if (!userId) throw new AuthError();

  const originalChat = await getChatById(userId, chatId);

  // Fetch all messages in the original chat
  const allDbMessages = await db.select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(asc(message.createdAt));

  // Determine the target message
  const targetMsg = allDbMessages.find(m => m.id === messageId);
  if (!targetMsg) {
    throw new NotFoundError("Branch point message not found");
  }

  // Filter messages to construct the active conversation thread up to targetMsg
  const activeThread: typeof allDbMessages = [];
  for (const msg of allDbMessages) {
    if (msg.versionGroupId) {
      const alreadyAdded = activeThread.some(m => m.versionGroupId === msg.versionGroupId);
      if (!alreadyAdded) {
        const groupMessages = allDbMessages.filter(m => m.versionGroupId === msg.versionGroupId);
        const choice = groupMessages.find(m => m.id === messageId) || groupMessages.find(m => m.isActiveVersion) || groupMessages[0];
        activeThread.push(choice);
      }
    } else {
      activeThread.push(msg);
    }
  }

  // Find the index of targetMsg in the activeThread
  const targetIndex = activeThread.findIndex(m => m.id === messageId);
  if (targetIndex === -1) {
    throw new Error("Target message is not in the active thread");
  }

  // Slice up to and including the targetMsg
  const messagesToCopy = activeThread.slice(0, targetIndex + 1);

  // Create new branched chat
  const newChatId = ulid();
  const [newChat] = await db.insert(chat).values({
    id: newChatId,
    userId,
    title: originalChat.title,
    model: originalChat.model,
    systemPrompt: originalChat.systemPrompt,
    parentChatId: chatId,
    branchPointMessageId: messageId,
  }).returning();

  // Copy messages
  if (messagesToCopy.length > 0) {
    await db.transaction(async (tx) => {
      for (const msg of messagesToCopy) {
        const newMsgId = ulid();
        const vGroupId = msg.role === "assistant" ? newMsgId : null;
        await tx.insert(message).values({
          id: newMsgId,
          chatId: newChatId,
          role: msg.role,
          content: msg.content,
          status: msg.status,
          parts: msg.parts,
          metadata: msg.metadata,
          versionGroupId: vGroupId,
          isActiveVersion: true,
          createdAt: msg.createdAt, // Preserve original timestamp for sorting consistency
        });
      }
    });
  }

  return newChat;
}

