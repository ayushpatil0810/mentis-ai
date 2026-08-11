import { and, eq, sql, desc, or, ilike } from "drizzle-orm";
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
      highlightedTitle: chat.title,
    })
    .from(chat)
    .where(and(eq(chat.userId, userId), eq(chat.isArchived, false)))
    .orderBy(desc(chat.lastMessageAt))
    .limit(10);

    return { conversations: recentChats, messages: [], shared: [], branches: [] };
  }

  const useIlike = trimmed.length <= 2;
  const ilikePattern = `%${trimmed}%`;

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
    highlightedTitle: chat.title,
  };

  const msgSelectBase = {
    id: message.id,
    chatId: message.chatId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    chatTitle: chat.title,
    chatIsPinned: chat.isPinned,
    chatIsArchived: chat.isArchived,
    chatIsShared: chat.isShared,
    highlightedContent: message.content,
  };

  const ilikeSearch = async () => {
    const [conversations, shared, branches, messages] = await Promise.all([
      db.select(chatSelectFields).from(chat)
        .where(and(eq(chat.userId, userId), eq(chat.isShared, false), sql`${chat.parentChatId} IS NULL`, ilike(chat.title, ilikePattern)))
        .orderBy(desc(chat.lastMessageAt)).limit(20),
      db.select(chatSelectFields).from(chat)
        .where(and(eq(chat.userId, userId), eq(chat.isShared, true), ilike(chat.title, ilikePattern)))
        .orderBy(desc(chat.lastMessageAt)).limit(20),
      db.select(chatSelectFields).from(chat)
        .where(and(eq(chat.userId, userId), sql`${chat.parentChatId} IS NOT NULL`, ilike(chat.title, ilikePattern)))
        .orderBy(desc(chat.lastMessageAt)).limit(20),
      db.select(msgSelectBase).from(message).innerJoin(chat, eq(message.chatId, chat.id))
        .where(and(eq(chat.userId, userId), or(ilike(message.content, ilikePattern), sql`${message.parts}::text ILIKE ${ilikePattern}`)))
        .orderBy(desc(message.createdAt)).limit(20),
    ]);
    return { conversations, shared, branches, messages };
  };

  if (useIlike) return ilikeSearch();

  try {
    const querySql = sql`websearch_to_tsquery('english', ${trimmed})`;
    const ftsFields = {
      ...chatSelectFields,
      highlightedTitle: sql<string>`ts_headline('english', ${chat.title}, ${querySql}, 'StartSel=<mark class="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-medium px-0.5 rounded">, StopSel=</mark>')`,
    };

    const [conversations, shared, branches, messages] = await Promise.all([
      db.select(ftsFields).from(chat)
        .where(and(eq(chat.userId, userId), eq(chat.isShared, false), sql`${chat.parentChatId} IS NULL`, sql`to_tsvector('english', ${chat.title}) @@ ${querySql}`))
        .orderBy(desc(chat.lastMessageAt)).limit(20),
      db.select(ftsFields).from(chat)
        .where(and(eq(chat.userId, userId), eq(chat.isShared, true), sql`to_tsvector('english', ${chat.title}) @@ ${querySql}`))
        .orderBy(desc(chat.lastMessageAt)).limit(20),
      db.select(ftsFields).from(chat)
        .where(and(eq(chat.userId, userId), sql`${chat.parentChatId} IS NOT NULL`, sql`to_tsvector('english', ${chat.title}) @@ ${querySql}`))
        .orderBy(desc(chat.lastMessageAt)).limit(20),
      db.select({
        ...msgSelectBase,
        highlightedContent: sql<string>`ts_headline('english', COALESCE(NULLIF(${message.content}, ''), ${message.parts}::text, ''), ${querySql}, 'StartSel=<mark class="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-medium px-0.5 rounded">, StopSel=</mark>, MaxWords=25, MinWords=10, ShortWord=3')`,
      }).from(message).innerJoin(chat, eq(message.chatId, chat.id))
        .where(and(
          eq(chat.userId, userId),
          or(
            sql`to_tsvector('english', ${message.content}) @@ ${querySql}`,
            sql`to_tsvector('english', COALESCE(${message.parts}::text, '')) @@ ${querySql}`
          )
        ))
        .orderBy(desc(message.createdAt)).limit(20),
    ]);

    return { conversations, shared, branches, messages };
  } catch {
    return ilikeSearch();
  }
}
