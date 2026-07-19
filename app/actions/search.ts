"use server";

import { requireAuth } from "@/lib/auth/auth-utils";
import * as searchService from "@/lib/services/search";
import { safeAction } from "@/lib/utils/action";

export async function globalSearchAction(query: string) {
  return safeAction("globalSearch", async () => {
    const { user } = await requireAuth();
    return await searchService.searchAll(user.id, query);
  });
}
