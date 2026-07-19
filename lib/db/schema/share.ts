import { pgTable, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { chat } from "./chat";
import { timestamps } from "./utils";

export const share = pgTable("share", {
  id: text("id").primaryKey(), // ULID
  chatId: text("chat_id")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").notNull(), // Immutable JSON snapshot: { chat: Chat, messages: Message[] }
  viewCount: integer("view_count").default(0).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  ...timestamps,
});
