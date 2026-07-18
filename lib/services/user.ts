import { eq } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";
import { NotFoundError, AuthError } from "../utils/errors";

export async function getUserSettings(userId: string) {
  if (!userId) throw new AuthError();
  
  const [userRecord] = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    defaultProvider: user.defaultProvider,
  })
  .from(user)
  .where(eq(user.id, userId));
  
  if (!userRecord) throw new NotFoundError("User not found");
  
  return userRecord;
}

export async function updateUserSettings(userId: string, data: { name?: string, defaultProvider?: string | null }) {
  if (!userId) throw new AuthError();
  
  const [updated] = await db.update(user)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.defaultProvider !== undefined && { defaultProvider: data.defaultProvider }),
    })
    .where(eq(user.id, userId))
    .returning({
      id: user.id,
      name: user.name,
      defaultProvider: user.defaultProvider,
    });
    
  if (!updated) throw new NotFoundError("User not found");
  
  return updated;
}

export async function deleteUserAccount(userId: string) {
  if (!userId) throw new AuthError();
  
  const [deleted] = await db.delete(user)
    .where(eq(user.id, userId))
    .returning({ id: user.id });
    
  if (!deleted) throw new NotFoundError("User not found");
  
  return deleted;
}
