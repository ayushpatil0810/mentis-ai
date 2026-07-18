import { RateLimitError } from "./utils/errors";
import { logger } from "./utils/logger";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key);
    }
  }
}, 60000);

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // default 1 minute
): Promise<void> {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record) {
    store.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  if (now > record.resetTime) {
    store.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return;
  }

  if (record.count >= limit) {
    logger.warn(`Rate limit exceeded for ${identifier}`);
    throw new RateLimitError();
  }

  record.count += 1;
}
