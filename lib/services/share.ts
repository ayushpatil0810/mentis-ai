import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { share, chat, message } from "../db/schema";
import { getChatById } from "./chat";
import { getMessagesByChatId } from "./message";
import { ulid } from "ulid";
import { AuthError, NotFoundError } from "../utils/errors";

export async function createShare(userId: string, chatId: string) {
  if (!userId) throw new AuthError();

  const chatObj = await getChatById(userId, chatId);
  const messagesList = await getMessagesByChatId(userId, chatId);

  // Snapshot contains only the active thread messages
  const activeMessages = messagesList.filter(
    (m) => m.isActiveVersion || m.versionGroupId === null
  );

  const snapshot = {
    chat: {
      title: chatObj.title,
      model: chatObj.model,
      systemPrompt: chatObj.systemPrompt,
    },
    messages: activeMessages.map((m) => ({
      role: m.role,
      content: m.content,
      parts: m.parts,
      createdAt: m.createdAt,
    })),
  };

  const shareId = ulid();

  const [newShare] = await db.insert(share).values({
    id: shareId,
    chatId,
    userId,
    snapshot,
    isPublic: true,
    viewCount: 0,
  }).returning();

  return newShare;
}

export async function getShareById(shareId: string) {
  const [existingShare] = await db.select()
    .from(share)
    .where(eq(share.id, shareId));

  if (!existingShare || !existingShare.isPublic) {
    throw new NotFoundError("Shared conversation not found or is private");
  }

  // Increment view count asynchronously
  db.update(share)
    .set({ viewCount: sql`${share.viewCount} + 1` })
    .where(eq(share.id, shareId))
    .catch((err) => console.error("Failed to increment share view count", err));

  return existingShare;
}

export async function getShareByChatId(userId: string, chatId: string) {
  if (!userId) throw new AuthError();

  // Verify ownership of the chat
  await getChatById(userId, chatId);

  const [existingShare] = await db.select()
    .from(share)
    .where(eq(share.chatId, chatId));

  return existingShare || null;
}

export async function updateShare(userId: string, shareId: string) {
  if (!userId) throw new AuthError();

  const [existingShare] = await db.select()
    .from(share)
    .where(eq(share.id, shareId));

  if (!existingShare) {
    throw new NotFoundError("Share not found");
  }

  if (existingShare.userId !== userId) {
    throw new AuthError("You do not own this share");
  }

  const chatObj = await getChatById(userId, existingShare.chatId);
  const messagesList = await getMessagesByChatId(userId, existingShare.chatId);

  const activeMessages = messagesList.filter(
    (m) => m.isActiveVersion || m.versionGroupId === null
  );

  const snapshot = {
    chat: {
      title: chatObj.title,
      model: chatObj.model,
      systemPrompt: chatObj.systemPrompt,
    },
    messages: activeMessages.map((m) => ({
      role: m.role,
      content: m.content,
      parts: m.parts,
      createdAt: m.createdAt,
    })),
  };

  const [updated] = await db.update(share)
    .set({ snapshot, updatedAt: new Date() })
    .where(eq(share.id, shareId))
    .returning();

  return updated;
}

export async function setShareVisibility(userId: string, shareId: string, isPublic: boolean) {
  if (!userId) throw new AuthError();

  const [existingShare] = await db.select()
    .from(share)
    .where(eq(share.id, shareId));

  if (!existingShare) {
    throw new NotFoundError("Share not found");
  }

  if (existingShare.userId !== userId) {
    throw new AuthError("You do not own this share");
  }

  const [updated] = await db.update(share)
    .set({ isPublic, updatedAt: new Date() })
    .where(eq(share.id, shareId))
    .returning();

  return updated;
}

export async function deleteShare(userId: string, shareId: string) {
  if (!userId) throw new AuthError();

  const [existingShare] = await db.select()
    .from(share)
    .where(eq(share.id, shareId));

  if (!existingShare) {
    throw new NotFoundError("Share not found");
  }

  if (existingShare.userId !== userId) {
    throw new AuthError("You do not own this share");
  }

  await db.delete(share)
    .where(eq(share.id, shareId));

  return true;
}

interface ShareSnapshot {
  chat: {
    title: string;
    model?: string | null;
    systemPrompt?: string | null;
  };
  messages: Array<{
    role: "system" | "user" | "assistant" | "data" | "tool";
    content: string;
    parts?: any;
    createdAt: string | Date;
  }>;
}

export async function forkShare(userId: string, shareId: string) {
  if (!userId) throw new AuthError();

  const existingShare = await getShareById(shareId);
  const snapshot = existingShare.snapshot as unknown as ShareSnapshot;

  const newChatId = ulid();

  // Create new chat
  await db.insert(chat).values({
    id: newChatId,
    userId,
    title: snapshot.chat.title || "Forked Chat",
    model: snapshot.chat.model || null,
    systemPrompt: snapshot.chat.systemPrompt || null,
  });

  // Copy messages
  if (snapshot.messages && snapshot.messages.length > 0) {
    await db.transaction(async (tx) => {
      for (const msg of snapshot.messages) {
        const newMsgId = ulid();
        const vGroupId = msg.role === "assistant" ? newMsgId : null;
        await tx.insert(message).values({
          id: newMsgId,
          chatId: newChatId,
          role: msg.role,
          content: msg.content,
          parts: msg.parts || null,
          versionGroupId: vGroupId,
          isActiveVersion: true,
          createdAt: typeof msg.createdAt === "string" ? new Date(msg.createdAt) : msg.createdAt,
        });
      }
    });
  }

  return newChatId;
}
