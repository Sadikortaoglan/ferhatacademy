import { createAuthClient } from "better-auth/react";

// Use relative URL so auth requests are always same-origin.
// An absolute NEXT_PUBLIC_APP_URL is only needed for server-side auth (BETTER_AUTH_URL)
// and for email links. The client must never cross origins.
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
});

export const { signIn, signOut, signUp, useSession } = authClient;
