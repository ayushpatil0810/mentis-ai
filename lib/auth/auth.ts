import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../db/schema";
import { db } from "../db";

function normalizeBaseURL(url?: string) {
  const trimmedURL = url?.trim();

  if (!trimmedURL) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmedURL)) {
    return trimmedURL;
  }

  return `https://${trimmedURL}`;
}

const authBaseURL =
  normalizeBaseURL(process.env.BETTER_AUTH_URL) ??
  normalizeBaseURL(process.env.NEXT_PUBLIC_BETTER_AUTH_URL) ??
  normalizeBaseURL(process.env.NEXT_PUBLIC_APP_URL) ??
  normalizeBaseURL(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeBaseURL(process.env.VERCEL_URL) ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  ...(authBaseURL ? { baseURL: authBaseURL } : {}),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
