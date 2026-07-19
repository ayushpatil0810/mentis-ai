import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const chat = pgTable(
  "chat",
  {
    id: text("id").primaryKey(), // ULID
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New Chat"),
    model: text("model"), // e.g. openai/gpt-4o — per-thread model override
    systemPrompt: text("system_prompt"),
    isPinned: boolean("is_pinned").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    isShared: boolean("is_shared").default(false).notNull(),
    sharePath: text("share_path").unique(), // For public sharing links
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentChatId: text("parent_chat_id").references((): any => chat.id, { onDelete: "set null" }),
    branchPointMessageId: text("branch_point_message_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  },
  (table) => [
    // Highly efficient index for rendering the sidebar (filtering by user, sorting by latest)
    index("chat_userId_lastMessageAt_idx").on(table.userId, table.lastMessageAt.desc()),
    // Index for filtering pinned or archived chats efficiently
    index("chat_userId_isPinned_lastMessageAt_idx").on(table.userId, table.isPinned, table.lastMessageAt.desc()),
    // GIN index for Full-Text Search on chat title
    index("chat_title_fts_idx").using("gin", sql`to_tsvector('english', ${table.title})`),
  ]
);
