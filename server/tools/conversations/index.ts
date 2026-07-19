import { z } from "zod";
import { ToolConfig } from "@/types/tool";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema";
import { eq, and, like, desc } from "drizzle-orm";

export const searchConversationsTool: ToolConfig<any> = {
  name: "searchConversations",
  description: "Search the authenticated user's conversations/chats. Supports filtering by title query, pinned, or archived status.",
  parameters: z.object({
    query: z.string().optional().describe("Substring match for the conversation title."),
    pinned: z.boolean().optional().describe("Filter for pinned conversations only."),
    archived: z.boolean().optional().describe("Filter for archived conversations only (defaults to false if query is present, or returns all)."),
    limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of conversations to return."),
  }),
  execute: async ({ query, pinned, archived, limit }, { userId }) => {
    try {
      if (!userId) {
        throw new Error("Unauthorized: User session is required to search conversations.");
      }

      const conditions = [eq(chat.userId, userId)];

      if (query) {
        conditions.push(like(chat.title, `%${query}%`));
      }
      if (pinned !== undefined) {
        conditions.push(eq(chat.isPinned, pinned));
      }
      if (archived !== undefined) {
        conditions.push(eq(chat.isArchived, archived));
      } else if (!query) {
        // Default to active (non-archived) chats if no explicit filter is set
        conditions.push(eq(chat.isArchived, false));
      }

      const results = await db.select()
        .from(chat)
        .where(and(...conditions))
        .orderBy(desc(chat.lastMessageAt))
        .limit(limit);

      return {
        conversations: results.map(c => ({
          id: c.id,
          title: c.title,
          isPinned: c.isPinned,
          isArchived: c.isArchived,
          lastMessageAt: c.lastMessageAt.toISOString(),
          createdAt: c.createdAt.toISOString(),
        }))
      };
    } catch (err: any) {
      throw new Error(`Failed to search conversations: ${err.message}`);
    }
  }
};
