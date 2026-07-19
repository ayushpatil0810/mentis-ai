import { pgTable, text, timestamp, jsonb, index, pgEnum, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { chat } from "./chat";
import { timestamps } from "./utils";

export const roleEnum = pgEnum("role", ["system", "user", "assistant", "data", "tool"]);
export const messageStatusEnum = pgEnum("status", ["pending", "complete", "error"]);

export const message = pgTable(
  "message",
  {
    id: text("id").primaryKey(), // ULID
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    status: messageStatusEnum("status").default("complete").notNull(),
    content: text("content").notNull(),
    parts: jsonb("parts"),
    metadata: jsonb("metadata"),
    versionGroupId: text("version_group_id"),
    isActiveVersion: boolean("is_active_version").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    // Essential for loading a chat's history chronologically
    index("message_chatId_createdAt_idx").on(table.chatId, table.createdAt.asc()),
    // GIN index for Full-Text Search on message content
    index("message_content_fts_idx").using("gin", sql`to_tsvector('english', ${table.content})`),
  ]
);
