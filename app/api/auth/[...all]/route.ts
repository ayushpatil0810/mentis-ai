import { auth } from "../../../../lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { rateLimit } from "../../../../lib/rate-limit";
import { logger } from "../../../../lib/utils/logger";

const handler = toNextJsHandler(auth.handler);

export async function GET(req: Request) {
  return handler.GET(req);
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  try {
    // IP-based rate limiting for Auth routes (10 requests per minute)
    // In production we would use true IP, here we use simple fallback
    await rateLimit(`auth:${ip}`, 10, 60000);
    
    return handler.POST(req);
  } catch (error: any) {
    if (error.name === "RateLimitError") {
      logger.warn("Auth rate limit exceeded", { ip });
      return new Response("Too many requests", { status: 429 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}

