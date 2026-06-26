import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

/**
 * Stateless session: a signed JWT in an httpOnly cookie (the canonical Next
 * pattern). The payload holds only the minimum — user id, display name, and the
 * backend-issued token — never passwords or PII.
 */
const secretKey =
  process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
const encodedKey = new TextEncoder().encode(secretKey);

export const SESSION_COOKIE = "selah_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function encrypt(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(
  token: string | undefined,
): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as Record<string, unknown>;
  } catch {
    // Tampered / expired / unsigned — treat as no session.
    return null;
  }
}

export async function createSession(user: SessionUser): Promise<void> {
  const expiresAt = new Date(Date.now() + MAX_AGE_MS);
  const session = await encrypt({ ...user, expiresAt: expiresAt.toISOString() });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    // Secure cookies require HTTPS — disable on http://localhost in dev.
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
