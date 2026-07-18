import { headers } from "next/headers";
import { auth } from "./auth";
import { AuthError } from "../utils/errors";

export async function requireAuth() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  
  if (!session || !session.user) {
    throw new AuthError("You must be logged in to access this resource");
  }
  
  return { user: session.user, session: session.session };
}
