import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { message } from "../db/schema";
import { getChatById, updateChat } from "./chat";
import { ulid } from "ulid";
import { z } from "zod";
import { AuthError } from "../utils/errors";

const createMessageSchema = z.object({
  chatId: z.string(),
  role: z.enum(["system", "user", "assistant", "data", "tool"]),
  content: z.string(),
  status: z.enum(["pending", "complete", "error"]).optional(),
  parts: z.any().optional(), 
  metadata: z.any().optional(),
});

export async function createMessage(userId: string, data: z.infer<typeof createMessageSchema>) {
  if (!userId) throw new AuthError();
  
  const parsed = createMessageSchema.parse(data);
  
  // Verify the chat belongs to the user
  await getChatById(userId, parsed.chatId);
  
  const id = ulid();
  
  const [newMessage] = await db.insert(message).values({
    id,
    chatId: parsed.chatId,
    role: parsed.role,
    content: parsed.content,
    status: parsed.status || "complete",
    parts: parsed.parts,
    metadata: parsed.metadata,
  }).returning();
  
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
