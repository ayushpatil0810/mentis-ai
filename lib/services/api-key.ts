import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { apiKey } from "../db/schema";
import { ulid } from "ulid";
import { z } from "zod";
import { encrypt, decrypt } from "../utils/encryption";
import { NotFoundError, AuthError } from "../utils/errors";

const upsertApiKeySchema = z.object({
  provider: z.string(),
  key: z.string().min(1),
});

export async function upsertApiKey(userId: string, data: z.infer<typeof upsertApiKeySchema>) {
  if (!userId) throw new AuthError();
  
  const parsed = upsertApiKeySchema.parse(data);
  const encryptedKey = encrypt(parsed.key);
  
  const existing = await getApiKeyMetadata(userId, parsed.provider);
  
  if (existing) {
    const [updated] = await db.update(apiKey)
      .set({ encryptedKey })
      .where(and(eq(apiKey.userId, userId), eq(apiKey.provider, parsed.provider)))
      .returning({ id: apiKey.id, provider: apiKey.provider, updatedAt: apiKey.updatedAt });
    return updated;
  } else {
    const id = ulid();
    const [created] = await db.insert(apiKey)
      .values({
        id,
        userId,
        provider: parsed.provider,
        encryptedKey,
      })
      .returning({ id: apiKey.id, provider: apiKey.provider, updatedAt: apiKey.updatedAt });
    return created;
  }
}

async function getApiKeyMetadata(userId: string, provider: string) {
  if (!userId) throw new AuthError();
  
  const [key] = await db.select({
    id: apiKey.id,
    provider: apiKey.provider,
    isEnabled: apiKey.isEnabled,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
  })
  .from(apiKey)
  .where(and(eq(apiKey.userId, userId), eq(apiKey.provider, provider)));
  
  return key || null;
}

export async function getApiKeys(userId: string) {
  if (!userId) throw new AuthError();
  
  return await db.select({
    id: apiKey.id,
    provider: apiKey.provider,
    isEnabled: apiKey.isEnabled,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
  })
  .from(apiKey)
  .where(eq(apiKey.userId, userId));
}

export async function getDecryptedApiKey(userId: string, provider: string) {
  if (!userId) throw new AuthError();
  
  const [keyRecord] = await db.select()
    .from(apiKey)
    .where(and(eq(apiKey.userId, userId), eq(apiKey.provider, provider)));
    
  if (!keyRecord) return null;
  
  try {
    return decrypt(keyRecord.encryptedKey);
  } catch {
    throw new Error("Failed to decrypt API key");
  }
}

export async function deleteApiKey(userId: string, provider: string) {
  if (!userId) throw new AuthError();
  
  const [deleted] = await db.delete(apiKey)
    .where(and(eq(apiKey.userId, userId), eq(apiKey.provider, provider)))
    .returning({ id: apiKey.id, provider: apiKey.provider });
    
  if (!deleted) throw new NotFoundError("API Key not found");
  
  return deleted;
}

export async function toggleApiKey(userId: string, provider: string, isEnabled: boolean) {
  if (!userId) throw new AuthError();
  
  const [updated] = await db.update(apiKey)
    .set({ isEnabled })
    .where(and(eq(apiKey.userId, userId), eq(apiKey.provider, provider)))
    .returning({ id: apiKey.id, provider: apiKey.provider, isEnabled: apiKey.isEnabled });
    
  if (!updated) throw new NotFoundError("API Key not found");
  
  return updated;
}
