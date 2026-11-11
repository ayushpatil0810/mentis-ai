import { eq, asc, and, sql } from "drizzle-orm";
import { db } from "../db";
import { message, chat } from "../db/schema";
import { getChatById } from "./chat";
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

type MessageInput = z.infer<typeof createMessageSchema>;

export async function createMessage(userId: string, data: MessageInput) {
  const [created] = await createMessages(userId, data.chatId, [data]);
  return created;
}

/** Insert a turn in one transaction: one ownership check, one lastMessageAt update. */
export async function createMessages(
  userId: string,
  chatId: string,
  rows: Array<Omit<MessageInput, "chatId">>,
  options?: { skipOwnershipCheck?: boolean },
) {
  if (!userId) throw new AuthError();
  if (rows.length === 0) return [];

  if (!options?.skipOwnershipCheck) {
    await getChatById(userId, chatId);
  }

  const now = Date.now();
  const values = rows.map((row, index) => {
    const parsed = createMessageSchema.parse({ ...row, chatId });
    const id = ulid();
    const versionGroupId = parsed.versionGroupId || (parsed.role === "assistant" ? id : null);
    return {
      id,
      chatId,
      role: parsed.role,
      content: parsed.content,
      status: parsed.status || "complete",
      parts: parsed.parts,
      metadata: parsed.metadata,
      versionGroupId,
      isActiveVersion: parsed.isActiveVersion ?? true,
      createdAt: parsed.createdAt || new Date(now + index),
    };
  });

  const inserted = await db.transaction(async (tx) => {
    for (const row of values) {
      if (!row.versionGroupId || !row.isActiveVersion) continue;
      await tx
        .update(message)
        .set({ isActiveVersion: false })
        .where(and(eq(message.versionGroupId, row.versionGroupId), eq(message.chatId, chatId)));
    }

    const created = await tx.insert(message).values(values).returning();

    const [updatedChat] = await tx
      .update(chat)
      .set({ lastMessageAt: new Date() })
      .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
      .returning({ id: chat.id });

    if (!updatedChat) {
      throw new NotFoundError("Chat not found");
    }

    return created;
  });

  return inserted;
}

export async function getMessagesByChatId(
  userId: string,
  chatId: string,
  options?: { skipOwnershipCheck?: boolean },
) {
  if (!userId) throw new AuthError();

  if (!options?.skipOwnershipCheck) {
    await getChatById(userId, chatId);
  }
  
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

