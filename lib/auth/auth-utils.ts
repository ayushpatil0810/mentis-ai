import { headers } from "next/headers";
import { auth } from "./auth";
import { UnauthorizedError } from "../utils/errors";

export async function requireAuth() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  
  if (!session || !session.user) {
    throw new UnauthorizedError("You must be logged in to access this resource");
  }
  
  return { user: session.user, session: session.session };
}
