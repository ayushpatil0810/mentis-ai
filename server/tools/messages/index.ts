import { z } from "zod";
import { ToolConfig } from "@/types/tool";
import { db } from "@/lib/db";
import { message, chat } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

function mapMessageResults(results: any[]) {
  return results.map(r => {
    const content = r.content;
    const preview = content.length > 150 ? content.substring(0, 150) + "..." : content;
    return {
      messageId: r.messageId,
      role: r.role,
      preview,
      createdAt: r.createdAt.toISOString(),
      conversation: {
        id: r.chatId,
        title: r.chatTitle,
      }
    };
  });
}

function getBaseQuery() {
  return db.select({
    messageId: message.id,
    content: message.content,
    role: message.role,
    createdAt: message.createdAt,
    chatId: chat.id,
    chatTitle: chat.title,
  })
  .from(message)
  .innerJoin(chat, eq(message.chatId, chat.id));
}

export const searchMessagesTool: ToolConfig<any> = {
  name: "searchMessages",
  description: "Search inside the text of past chat messages across all user history. Use when user asks 'What did I say about X?' or to look up specific statements or past discussions. Returns message preview and conversation details.",
  parameters: z.object({
    query: z.string().min(1).describe("The search query terms to match against message content."),
    limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of matching messages to return."),
  }),
  execute: async ({ query, limit }, { userId }) => {
    try {
      if (!userId) {
        throw new Error("Unauthorized: User session is required to search messages.");
      }

      // Query joining message with chat to filter by user ownership.
      // Uses PG FTS with to_tsvector and plainto_tsquery (websearch_to_tsquery allows quotes/negations)
      const results = await getBaseQuery()
      .where(
        and(
          eq(chat.userId, userId),
          // PostgreSQL Full-Text Search
          sql`to_tsvector('english', ${message.content}) @@ websearch_to_tsquery('english', ${query})`
        )
      )
      .orderBy(desc(message.createdAt))
      .limit(limit);

      return {
        query,
        messages: mapMessageResults(results)
      };
    } catch (err: any) {
      // Fallback to simple ILIKE search if Full-Text Search functions are not available or fail
      try {
        const searchPattern = `%${query}%`;
        const results = await getBaseQuery()
        .where(
          and(
            eq(chat.userId, userId),
            sql`${message.content} ILIKE ${searchPattern}`
          )
        )
        .orderBy(desc(message.createdAt))
        .limit(limit);

        return {
          query,
          fallbackUsed: true,
          messages: mapMessageResults(results)
        };
      } catch (fallbackErr: any) {
        throw new Error(`Failed to search messages: ${fallbackErr.message || err.message}`);
      }
    }
  }
};
