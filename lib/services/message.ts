import { eq, asc, and, ne, sql } from "drizzle-orm";
import { db } from "../db";
import { message, chat } from "../db/schema";
import { getChatById, updateChat } from "./chat";
import { ulid } from "ulid";
import { z } from "zod";
import { AuthError, NotFoundError } from "../utils/errors";

const createMessageSchema = z.object({
  chatId: z.string(),
  role: z.enum(["system", "user", "assistant", "data", "tool"]),
  content: z.string(),
  status: z.enum(["pending", "complete", "error"]).optional(),
  parts: z.any().optional(), 
  metadata: z.any().optional(),
  versionGroupId: z.string().nullable().optional(),
  isActiveVersion: z.boolean().optional(),
  createdAt: z.date().optional(),
});

export async function createMessage(userId: string, data: z.infer<typeof createMessageSchema>) {
  if (!userId) throw new AuthError();
  
  const parsed = createMessageSchema.parse(data);
  
  // Verify the chat belongs to the user
  await getChatById(userId, parsed.chatId);
  
  const id = ulid();
  const vGroupId = parsed.versionGroupId || (parsed.role === "assistant" ? id : null);
  const isActive = parsed.isActiveVersion ?? true;
  
  // Run inside transaction to ensure atomicity when deactivating old versions
  const newMessage = await db.transaction(async (tx) => {
    if (vGroupId && isActive) {
      await tx.update(message)
        .set({ isActiveVersion: false })
        .where(
          and(
            eq(message.versionGroupId, vGroupId),
            eq(message.chatId, parsed.chatId)
          )
        );
    }
    
    const [inserted] = await tx.insert(message).values({
      id,
      chatId: parsed.chatId,
      role: parsed.role,
      content: parsed.content,
      status: parsed.status || "complete",
      parts: parsed.parts,
      metadata: parsed.metadata,
      versionGroupId: vGroupId,
      isActiveVersion: isActive,
      createdAt: parsed.createdAt || new Date(),
    }).returning();
    
    return inserted;
  });
  
  // Update the chat's lastMessageAt timestamp
  await updateChat(userId, parsed.chatId, { lastMessageAt: new Date() });
  
  return newMessage;
}

export async function getMessagesByChatId(userId: string, chatId: string) {
  if (!userId) throw new AuthError();
  
  // Verify ownership
  await getChatById(userId, chatId);
  
  return await db.select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(asc(message.createdAt));
}

async function getMessageById(userId: string, messageId: string) {
  if (!userId) throw new AuthError();
  
  const [existingMessage] = await db.select()
    .from(message)
    .where(eq(message.id, messageId));
    
  if (!existingMessage) {
    throw new NotFoundError("Message not found");
  }
  
  // Verify chat ownership
  await getChatById(userId, existingMessage.chatId);
  
  return existingMessage;
}

export async function setActiveVersion(userId: string, messageId: string) {
  if (!userId) throw new AuthError();
  
  const targetMessage = await getMessageById(userId, messageId);
  const vGroupId = targetMessage.versionGroupId;
  
  if (!vGroupId) {
    throw new Error("Message is not versioned");
  }
  
  const metadata = targetMessage.metadata as Record<string, any> | null;
  const runId = metadata?.runId;
  
  await db.transaction(async (tx) => {
    // Deactivate all in group
    await tx.update(message)
      .set({ isActiveVersion: false })
      .where(
        and(
          eq(message.versionGroupId, vGroupId),
          eq(message.chatId, targetMessage.chatId)
        )
      );
      
    // Activate target(s)
    if (runId) {
      await tx.update(message)
        .set({ isActiveVersion: true })
        .where(
          and(
            eq(message.versionGroupId, vGroupId),
            eq(message.chatId, targetMessage.chatId),
            sql`metadata->>'runId' = ${runId}`
          )
        );
    } else {
      await tx.update(message)
        .set({ isActiveVersion: true })
        .where(eq(message.id, messageId));
    }
  });
  
  return targetMessage;
}

