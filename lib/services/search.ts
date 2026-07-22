import { and, eq, sql, desc } from "drizzle-orm";
import { db } from "../db";
import { chat, message } from "../db/schema";
import { AuthError } from "../utils/errors";

export interface SearchChatResult {
  id: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  isShared: boolean;
  parentChatId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  highlightedTitle: string;
}

export interface SearchMessageResult {
  id: string;
  chatId: string;
  role: "system" | "user" | "assistant" | "data" | "tool";
  content: string;
  createdAt: Date;
  chatTitle: string;
  chatIsPinned: boolean;
  chatIsArchived: boolean;
  chatIsShared: boolean;
  highlightedContent: string;
}

export interface SearchResult {
  conversations: SearchChatResult[];
  messages: SearchMessageResult[];
  shared: SearchChatResult[];
  branches: SearchChatResult[];
}

export async function searchAll(userId: string, searchTerm: string): Promise<SearchResult> {
  if (!userId) throw new AuthError();

  const trimmed = searchTerm.trim();

  if (!trimmed) {
    // Return recent conversations when search is empty
    const recentChats = await db.select({
      id: chat.id,
      title: chat.title,
      isPinned: chat.isPinned,
      isArchived: chat.isArchived,
      isShared: chat.isShared,
      parentChatId: chat.parentChatId,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      lastMessageAt: chat.lastMessageAt,
      highlightedTitle: chat.title, // No highlighting for recent list
    })
    .from(chat)
    .where(and(eq(chat.userId, userId), eq(chat.isArchived, false)))
    .orderBy(desc(chat.lastMessageAt))
    .limit(10);

    return {
      conversations: recentChats,
      messages: [],
      shared: [],
      branches: []
    };
  }

  // Format search query using websearch_to_tsquery
  const querySql = sql`websearch_to_tsquery('english', ${trimmed})`;

  const chatSelectFields = {
    id: chat.id,
    title: chat.title,
    isPinned: chat.isPinned,
    isArchived: chat.isArchived,
    isShared: chat.isShared,
    parentChatId: chat.parentChatId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    lastMessageAt: chat.lastMessageAt,
    highlightedTitle: sql<string>`ts_headline('english', ${chat.title}, ${querySql}, 'StartSel=<mark class="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-medium px-0.5 rounded">, StopSel=</mark>')`
  };

  // 1. Conversations: owned by user, non-branched, non-shared, matching title
  const conversations = await db.select(chatSelectFields)
  .from(chat)
  .where(
    and(
      eq(chat.userId, userId),
      eq(chat.isShared, false),
      sql`${chat.parentChatId} IS NULL`,
      sql`to_tsvector('english', ${chat.title}) @@ ${querySql}`
    )
  )
  .orderBy(desc(chat.lastMessageAt))
  .limit(20);

  // 2. Shared: owned by user, isShared = true, matching title
  const shared = await db.select(chatSelectFields)
  .from(chat)
  .where(
    and(
      eq(chat.userId, userId),
      eq(chat.isShared, true),
      sql`to_tsvector('english', ${chat.title}) @@ ${querySql}`
    )
  )
  .orderBy(desc(chat.lastMessageAt))
  .limit(20);

  // 3. Branches: owned by user, branched (parentChatId IS NOT NULL), matching title
  const branches = await db.select(chatSelectFields)
  .from(chat)
  .where(
    and(
      eq(chat.userId, userId),
      sql`${chat.parentChatId} IS NOT NULL`,
      sql`to_tsvector('english', ${chat.title}) @@ ${querySql}`
    )
  )
  .orderBy(desc(chat.lastMessageAt))
  .limit(20);

  // 4. Messages: messages matching query, owned by user
  const messages = await db.select({
    id: message.id,
    chatId: message.chatId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    chatTitle: chat.title,
    chatIsPinned: chat.isPinned,
    chatIsArchived: chat.isArchived,
    chatIsShared: chat.isShared,
    highlightedContent: sql<string>`ts_headline('english', ${message.content}, ${querySql}, 'StartSel=<mark class="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-medium px-0.5 rounded">, StopSel=</mark>, MaxWords=25, MinWords=10, ShortWord=3')`
  })
  .from(message)
  .innerJoin(chat, eq(message.chatId, chat.id))
  .where(
    and(
      eq(chat.userId, userId),
      sql`to_tsvector('english', ${message.content}) @@ ${querySql}`
    )
  )
  .orderBy(desc(message.createdAt))
  .limit(20);

  return {
    conversations,
    shared,
    branches,
    messages
  };
}
