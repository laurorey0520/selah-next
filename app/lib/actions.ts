"use server";

import { revalidatePath } from "next/cache";
import { createEntry, updateEntry, deleteEntry } from "./api";
import type { Mood } from "./types";

const MOODS: Mood[] = ["still", "grateful", "heavy", "hopeful", "wrestling"];

export type EntryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: { title?: string; body?: string };
};

/** Back-compat alias — the create form imports this name. */
export type CreateEntryState = EntryFormState;

// NOTE: do not export non-function values from this "use server" file — every
// export becomes a server reference. The initial form state lives client-side.

/** Parse the vision-board assets — each is a JSON-encoded { url, caption? }. */
function parseAttachments(formData: FormData) {
  return formData
    .getAll("attachments")
    .map((raw) => {
      try {
        const o = JSON.parse(String(raw));
        const url = String(o?.url ?? "").trim();
        if (!url) return null;
        const caption = String(o?.caption ?? "").trim();
        return { url, caption: caption || undefined };
      } catch {
        return null;
      }
    })
    .filter((a): a is { url: string; caption: string | undefined } => a !== null);
}

/** Pull + validate the shared entry fields from FormData. */
function parseEntryForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const moodRaw = String(formData.get("mood") ?? "").trim();

  const fieldErrors: NonNullable<EntryFormState["fieldErrors"]> = {};
  if (!title) fieldErrors.title = "Give your reflection a title.";
  if (!body) fieldErrors.body = "Write a little something.";

  const mood = MOODS.includes(moodRaw as Mood) ? (moodRaw as Mood) : undefined;

  return {
    fields: { title, body, mood, attachments: parseAttachments(formData) },
    fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : null,
  };
}

/**
 * Create a journal entry via the Sēlah Express backend.
 *
 * SECURITY: Server Actions are reachable via direct POST, not just this form.
 * When auth lands, verify the session/ownership HERE before writing.
 */
export async function createEntryAction(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const { fields, fieldErrors } = parseEntryForm(formData);
  if (fieldErrors) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    await createEntry(fields);
  } catch (err) {
    console.error("createEntryAction failed:", err);
    return {
      status: "error",
      message:
        "Couldn't save your entry — check the Sēlah API connection and try again.",
    };
  }

  revalidatePath("/");
  return { status: "success", message: "Saved. Selah." };
}

/**
 * Update an existing entry. `id` is bound at the call site
 * (`updateEntryAction.bind(null, entry.id)`) so the form signature stays
 * `(prevState, formData)` for `useActionState`.
 *
 * SECURITY: verify the caller owns `id` once auth lands.
 */
export async function updateEntryAction(
  id: string,
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const { fields, fieldErrors } = parseEntryForm(formData);
  if (fieldErrors) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    await updateEntry(id, fields);
  } catch (err) {
    console.error("updateEntryAction failed:", err);
    return {
      status: "error",
      message: "Couldn't update this entry — check the connection and retry.",
    };
  }

  revalidatePath("/");
  return { status: "success", message: "Updated." };
}

/**
 * Delete an entry. Called directly from a client transition with the id, so it
 * returns a small result object instead of throwing.
 *
 * SECURITY: verify the caller owns `id` once auth lands.
 */
export async function deleteEntryAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await deleteEntry(id);
  } catch (err) {
    console.error("deleteEntryAction failed:", err);
    return { ok: false, error: "Couldn't delete this entry." };
  }

  revalidatePath("/");
  return { ok: true };
}
