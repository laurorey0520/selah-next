"use server";

import { redirect } from "next/navigation";
import { loginToBackend } from "./api";
import { createSession, deleteSession } from "./session";

export type LoginState = { error?: string };

/**
 * Log in: verify credentials against the Express backend, then mint a session
 * cookie. Shaped for `useActionState` — returns `{ error }` on failure; on
 * success it redirects (which throws control-flow, so it sits after the catch).
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  try {
    const user = await loginToBackend(username, password);
    await createSession(user);
  } catch (err) {
    console.error("login failed:", err);
    return { error: "Invalid email or password." };
  }

  redirect("/");
}

/** Log out: clear the session cookie and return to the login page. */
export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
