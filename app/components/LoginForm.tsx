"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../lib/auth-actions";
import { fieldBase, labelBase, primaryButton } from "./field";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    initialState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className={labelBase}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={fieldBase}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelBase}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={fieldBase}
        />
      </div>

      {state.error && (
        <p className="text-xs text-rose-300/80">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${primaryButton} w-full`}
      >
        {pending && (
          <span className="size-3.5 animate-spin rounded-full border-2 border-emerald-100/30 border-t-selah-mint" />
        )}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
