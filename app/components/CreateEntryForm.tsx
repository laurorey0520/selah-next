"use client";

import { useActionState, useState } from "react";
import { createEntryAction, type CreateEntryState } from "../lib/actions";
import {
  fieldBase,
  labelBase,
  MOOD_OPTIONS,
  primaryButton,
  selectExtra,
} from "./field";
import VisionBoardEditor from "./VisionBoardEditor";

const initialState: CreateEntryState = { status: "idle" };

export default function CreateEntryForm() {
  const [state, action, pending] = useActionState<CreateEntryState, FormData>(
    createEntryAction,
    initialState,
  );
  // Remount (clear) the whole form — native fields and vision board — after a
  // successful save. Render-phase guarded setState is the sanctioned pattern
  // for reacting to changed values without an effect.
  const [prevState, setPrevState] = useState(state);
  const [formKey, setFormKey] = useState(0);
  if (state !== prevState) {
    setPrevState(state);
    if (state.status === "success") setFormKey((k) => k + 1);
  }

  return (
    <section
      aria-label="New entry"
      className="rounded-2xl border border-glass-edge bg-glass-pane shadow-2xl shadow-black/40 backdrop-blur-xl ring-1 ring-inset ring-glass-sheen"
    >
      <div className="border-b border-glass-edge px-6 py-4">
        <h2 className="text-sm font-medium text-emerald-50">New reflection</h2>
        <p className="mt-0.5 text-xs text-emerald-100/50">
          A title and a few honest lines. Pause when you need to.
        </p>
      </div>

      <form key={formKey} action={action} className="flex flex-col gap-4 p-6">
        <div>
          <label htmlFor="title" className={labelBase}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Be still"
            aria-invalid={!!state.fieldErrors?.title}
            className={fieldBase}
          />
          {state.fieldErrors?.title && (
            <p className="mt-1.5 text-xs text-rose-300/80">
              {state.fieldErrors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="body" className={labelBase}>
            Reflection
          </label>
          <textarea
            id="body"
            name="body"
            rows={4}
            placeholder="What settled on you today…"
            aria-invalid={!!state.fieldErrors?.body}
            className={`${fieldBase} resize-y`}
          />
          {state.fieldErrors?.body && (
            <p className="mt-1.5 text-xs text-rose-300/80">
              {state.fieldErrors.body}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="mood" className={labelBase}>
            Mood
          </label>
          <select
            id="mood"
            name="mood"
            defaultValue=""
            className={`${fieldBase} ${selectExtra}`}
          >
            {MOOD_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <VisionBoardEditor />

        <div className="flex items-center justify-between gap-3 pt-1">
          <p
            aria-live="polite"
            className={`text-xs ${
              state.status === "success"
                ? "text-selah-mint/80"
                : state.status === "error"
                  ? "text-rose-300/80"
                  : "text-transparent"
            }`}
          >
            {state.message ?? "placeholder"}
          </p>

          <button type="submit" disabled={pending} className={primaryButton}>
            {pending && (
              <span className="size-3.5 animate-spin rounded-full border-2 border-emerald-100/30 border-t-selah-mint" />
            )}
            {pending ? "Saving…" : "Save entry"}
          </button>
        </div>
      </form>
    </section>
  );
}
