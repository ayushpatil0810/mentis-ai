import { createAuthClient } from "better-auth/react";

const authBaseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;

export const authClient = createAuthClient(
  authBaseURL ? { baseURL: authBaseURL } : {}
);
