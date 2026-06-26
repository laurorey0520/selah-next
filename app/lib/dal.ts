import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt, SESSION_COOKIE } from "./session";
import type { SessionUser } from "./types";

/**
 * Data Access Layer: the single place auth state is read. `cache()` memoizes it
 * for the duration of a request so repeated calls (page + data fns) share one
 * decrypt. Returns null when unauthenticated — callers decide how to react.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await decrypt(token);
  if (!payload?.userId) return null;
  return {
    userId: String(payload.userId),
    name: payload.name ? String(payload.name) : "Friend",
    token: payload.token ? String(payload.token) : undefined,
  };
});

/** For pages/layouts: redirect to /login when there's no session. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
