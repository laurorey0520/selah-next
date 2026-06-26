"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { Entry, Mood } from "../lib/types";
import {
  deleteEntryAction,
  updateEntryAction,
  type CreateEntryState,
} from "../lib/actions";
import {
  fieldBase,
  ghostButton,
  labelBase,
  MOOD_OPTIONS,
  primaryButton,
  selectExtra,
} from "./field";
import VisionBoard from "./VisionBoard";
import VisionBoardEditor from "./VisionBoardEditor";

const initialState: CreateEntryState = { status: "idle" };

/** Mood → pip color. Tailwind v4 ships these emerald-adjacent palettes. */
const MOOD_STYLES: Record<Mood, { dot: string; label: string }> = {
  still: { dot: "bg-selah-mint", label: "Still" },
  grateful: { dot: "bg-amber-300", label: "Grateful" },
  heavy: { dot: "bg-slate-400", label: "Heavy" },
  hopeful: { dot: "bg-sky-300", label: "Hopeful" },
  wrestling: { dot: "bg-rose-300", label: "Wrestling" },
};

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const iconButton =
  "flex size-7 items-center justify-center rounded-lg border border-glass-edge bg-glass-pane text-emerald-100/70 backdrop-blur-sm transition hover:bg-glass-sheen hover:text-emerald-50 focus:ring-2 focus:ring-selah-mint/20";

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

/** One journal entry: view mode with hover controls, or inline edit. */
export default function EntryRow({ entry }: { entry: Entry }) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  if (mode === "edit") {
    return <EditForm entry={entry} onDone={() => setMode("view")} />;
  }
  return <ViewRow entry={entry} onEdit={() => setMode("edit")} />;
}

function ViewRow({ entry, onEdit }: { entry: Entry; onEdit: () => void }) {
  const mood = entry.mood ? MOOD_STYLES[entry.mood] : null;
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  function handleDelete() {
    setDeleteError(null);
    startDelete(async () => {
      const res = await deleteEntryAction(entry.id);
      if (!res.ok) {
        setDeleteError(res.error ?? "Couldn't delete this entry.");
        setConfirming(false);
      }
      // On success, revalidation removes this row from the list entirely.
    });
  }

  return (
    <article className="group relative flex gap-4 px-6 py-5 transition-colors hover:bg-glass-sheen">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-glass-edge bg-glass-pane text-xs font-medium text-selah-mint">
        {entry.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.author.avatarUrl}
            alt={entry.author.name}
            className="size-full rounded-full object-cover"
          />
        ) : (
          initials(entry.author.name)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3 pr-16">
          <h3 className="truncate text-sm font-medium text-emerald-50">
            {entry.title}
          </h3>
          <time
            dateTime={entry.createdAt}
            className="shrink-0 text-xs text-emerald-100/40"
          >
            {dateFmt.format(new Date(entry.createdAt))}
          </time>
        </div>

        <p className="mt-1 line-clamp-2 text-sm leading-6 text-emerald-100/60">
          {entry.body}
        </p>

        {mood && (
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-100/50">
              <span className={`size-1.5 rounded-full ${mood.dot}`} />
              {mood.label}
            </span>
          </div>
        )}

        <VisionBoard attachments={entry.attachments} />

        {deleteError && (
          <p className="mt-2 text-xs text-rose-300/80">{deleteError}</p>
        )}
      </div>

      {/* Hover/focus toolbar */}
      <div
        className={`absolute right-4 top-4 flex items-center gap-1.5 transition ${
          confirming
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
        }`}
      >
        {!confirming ? (
          <>
            <button
              type="button"
              aria-label="Edit entry"
              onClick={onEdit}
              className={iconButton}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              aria-label="Delete entry"
              onClick={() => setConfirming(true)}
              className={`${iconButton} hover:border-rose-300/30 hover:text-rose-200`}
            >
              <TrashIcon />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-emerald-100/60">Delete?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-2 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50"
            >
              {deleting ? "…" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded-lg border border-glass-edge bg-glass-pane px-2 py-1 text-xs text-emerald-100/70 transition hover:bg-glass-sheen disabled:opacity-50"
            >
              No
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function EditForm({ entry, onDone }: { entry: Entry; onDone: () => void }) {
  const boundUpdate = updateEntryAction.bind(null, entry.id);
  const [state, action, saving] = useActionState<CreateEntryState, FormData>(
    boundUpdate,
    initialState,
  );

  // Leave edit mode once the update succeeds (the row re-renders with new data).
  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  const tid = `title-${entry.id}`;
  const bid = `body-${entry.id}`;

  return (
    <form action={action} className="flex flex-col gap-3 px-6 py-5">
      <div>
        <label htmlFor={tid} className={labelBase}>
          Title
        </label>
        <input
          id={tid}
          name="title"
          type="text"
          defaultValue={entry.title}
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
        <label htmlFor={bid} className={labelBase}>
          Reflection
        </label>
        <textarea
          id={bid}
          name="body"
          rows={3}
          defaultValue={entry.body}
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
        <label htmlFor={`mood-${entry.id}`} className={labelBase}>
          Mood
        </label>
        <select
          id={`mood-${entry.id}`}
          name="mood"
          defaultValue={entry.mood ?? ""}
          className={`${fieldBase} ${selectExtra}`}
        >
          {MOOD_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <VisionBoardEditor defaultAttachments={entry.attachments} />

      <div className="flex items-center justify-between gap-3 pt-1">
        <p
          aria-live="polite"
          className={`text-xs ${
            state.status === "error" ? "text-rose-300/80" : "text-transparent"
          }`}
        >
          {state.message ?? "placeholder"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDone}
            disabled={saving}
            className={ghostButton}
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving && (
              <span className="size-3.5 animate-spin rounded-full border-2 border-emerald-100/30 border-t-selah-mint" />
            )}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
