import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Attachment, Entry, Mood } from "./types";

/**
 * Thin client for the existing Sēlah Express backend (hosted on Render).
 *
 * Config is read from env AT REQUEST TIME (not module load) so the values the
 * Render runtime injects are always picked up:
 *   SELAH_API_URL    e.g. https://selah-api.onrender.com   (no trailing slash needed)
 *   SELAH_API_TOKEN  bearer token / service key, if the API requires auth
 *
 * Next loads `.env*` into process.env automatically. Because these are NOT
 * prefixed with NEXT_PUBLIC_, they stay server-only and never reach the
 * browser. In production, set them in the Render/host dashboard, not a file.
 */
function getApiConfig() {
  return {
    baseUrl: process.env.SELAH_API_URL?.replace(/\/+$/, ""),
    token: process.env.SELAH_API_TOKEN,
  };
}

/**
 * Raw entry as it may arrive from the Express API. Kept permissive because the
 * exact casing/keys vary — `toEntry()` normalizes both snake_case and camelCase.
 *
 * ⚠️ TO CONFIRM against a real /entries payload, then tighten this type.
 */
type RawEntry = Record<string, unknown>;

function asString(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** Pick the first defined value across candidate keys (snake/camel tolerant). */
function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (obj[k] != null) return obj[k];
  return undefined;
}

/** Map one raw asset (string URL or object) onto an `Attachment`. */
function toAttachment(raw: unknown, i: number): Attachment {
  if (typeof raw === "string") return { id: String(i), url: raw };
  const o = asRecord(raw);
  return {
    id: asString(pick(o, "id", "_id"), String(i)),
    url: asString(pick(o, "url", "src", "uri")),
    caption: pick(o, "caption", "alt", "label") as string | undefined,
  };
}

/** Map a raw Express payload onto the source-agnostic UI `Entry`. */
function toEntry(raw: RawEntry): Entry {
  const author = asRecord(pick(raw, "author", "user"));
  const rawAttachments = pick(raw, "attachments", "assets", "media", "images");
  return {
    id: asString(pick(raw, "id", "_id", "uuid")),
    title: asString(pick(raw, "title")),
    body: asString(pick(raw, "body", "content", "text")),
    mood: pick(raw, "mood") as Mood | undefined,
    attachments: Array.isArray(rawAttachments)
      ? rawAttachments.map(toAttachment).filter((a) => a.url)
      : [],
    createdAt: asString(pick(raw, "createdAt", "created_at", "created")),
    author: {
      id: asString(
        pick(author, "id", "_id") ?? pick(raw, "author_id", "user_id"),
        "unknown",
      ),
      name: asString(pick(author, "name", "displayName", "display_name"), "Unknown"),
      avatarUrl: pick(author, "avatarUrl", "avatar_url") as string | undefined,
    },
  };
}

/**
 * Unwrap the list payload. Handles both a bare array and a "mobile sync"
 * envelope like `{ data: [...] }` / `{ entries: [...] }`.
 *
 * ⚠️ TO CONFIRM: if your envelope nests differently (e.g. `{ result: { items }}`),
 * adjust the candidate keys below.
 */
function unwrapList(json: unknown): RawEntry[] {
  if (Array.isArray(json)) return json as RawEntry[];
  const obj = asRecord(json);
  const list = pick(obj, "data", "entries", "items", "results");
  if (Array.isArray(list)) return list as RawEntry[];
  throw new Error(
    "Unexpected /entries shape — expected an array or { data: [...] }.",
  );
}

/** Unwrap a single item from `{ data: {...} }` or a bare object. */
function unwrapItem(json: unknown): RawEntry {
  const obj = asRecord(json);
  const inner = pick(obj, "data", "entry", "result");
  return asRecord(inner ?? obj);
}

async function selahFetch(path: string, init?: RequestInit): Promise<unknown> {
  const { baseUrl, token } = getApiConfig();
  if (!baseUrl) {
    throw new Error(
      "SELAH_API_URL is not set. Add it to .env.local (see .env.example).",
    );
  }

  const headers = new Headers(init?.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (init?.body) headers.set("content-type", "application/json");

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    // Entries change as the user journals — don't serve stale data.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Sēlah API ${res.status} ${res.statusText} on ${path}`);
  }

  // DELETE and some PATCH endpoints reply 204 / empty body — tolerate it.
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** GET /entries — newest first (adjust the path/params to your API). */
export async function fetchEntries(): Promise<Entry[]> {
  const json = await selahFetch("/entries");
  return unwrapList(json).map(toEntry);
}

/** Fields accepted when creating an entry. Author/timestamp are set server-side. */
export interface NewEntryInput {
  title: string;
  body: string;
  mood?: Mood;
  attachments?: { url: string; caption?: string }[];
}

/** Serialize create/update fields to the Express API's key casing (TO CONFIRM). */
function toApiBody(input: Partial<NewEntryInput>) {
  return {
    title: input.title,
    body: input.body,
    mood: input.mood,
    attachments: input.attachments,
  };
}

/** POST /entries — create a new entry (adjust the field names to your API). */
export async function createEntry(input: NewEntryInput): Promise<Entry> {
  const json = await selahFetch("/entries", {
    method: "POST",
    body: JSON.stringify(toApiBody(input)),
  });
  return toEntry(unwrapItem(json));
}

/** PATCH /entries/:id — update an existing entry. */
export async function updateEntry(
  id: string,
  input: Partial<NewEntryInput>,
): Promise<Entry> {
  const json = await selahFetch(`/entries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(toApiBody(input)),
  });
  return toEntry(unwrapItem(json));
}

/** DELETE /entries/:id — remove an entry. */
export async function deleteEntry(id: string): Promise<void> {
  await selahFetch(`/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Store an uploaded image and return its public URL.
 *
 * Primary path: stream the binary to the Sēlah Express backend's upload
 * endpoint (fetch streams the multipart body — the file is never buffered
 * whole in memory here). ⚠️ TO CONFIRM: the route is `POST /uploads`, the
 * field is `file`, and the response carries the URL under `url`/`location`/`src`.
 *
 * Dev fallback (no SELAH_API_URL): stream the file to `public/uploads/` so
 * the feature works locally without the backend. Not for production — most
 * hosts (Render/Vercel) have an ephemeral filesystem; point at the API there.
 */
export async function uploadAsset(file: File): Promise<{ url: string }> {
  const { baseUrl, token } = getApiConfig();

  if (baseUrl) {
    const body = new FormData();
    body.append("file", file, file.name);
    const res = await fetch(`${baseUrl}/uploads`, {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      body,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Sēlah API ${res.status} ${res.statusText} on /uploads`);
    }
    const json = asRecord(await res.json());
    const url = asString(pick(json, "url", "location", "src", "uri"));
    if (!url) throw new Error("Upload response had no URL.");
    return { url };
  }

  return saveToPublicUploads(file);
}

/** Dev-only: stream a File to public/uploads and return its served path. */
async function saveToPublicUploads(file: File): Promise<{ url: string }> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "asset";
  const fileName = `${randomUUID()}-${safeName}`;
  const dest = path.join(dir, fileName);

  // Stream the web ReadableStream straight to disk — no full-file buffering.
  await pipeline(
    Readable.fromWeb(
      file.stream() as unknown as Parameters<typeof Readable.fromWeb>[0],
    ),
    createWriteStream(dest),
  );

  return { url: `/uploads/${fileName}` };
}
