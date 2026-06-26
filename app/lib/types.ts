/**
 * Core domain shapes for the Sēlah journal.
 *
 * These are the contract between the data source (DB query / Express sync)
 * and the UI. Keep them source-agnostic: a Postgres row, a SQLite row, or an
 * Express JSON payload should all be mapped into these shapes at the seam
 * (see app/lib/entries.ts) so components never depend on where data came from.
 */

/** The author of a journal entry. */
export interface User {
  id: string;
  name: string;
  /** Optional avatar URL; UI falls back to initials when absent. */
  avatarUrl?: string;
}

/** Mood tags surfaced as a colored pip on each row. */
export type Mood = "still" | "grateful" | "heavy" | "hopeful" | "wrestling";

/** A vision-board asset attached to an entry (image / manifestation material). */
export interface Attachment {
  id: string;
  /** Image source URL. */
  url: string;
  /** Optional label shown beneath the image in the collage. */
  caption?: string;
}

/** A single journal entry — one glass row on the dashboard. */
export interface Entry {
  id: string;
  /** Short heading for the reflection. */
  title: string;
  /** The reflection body. */
  body: string;
  mood?: Mood;
  /** Vision-board collage assets, in display order. */
  attachments: Attachment[];
  author: User;
  /** ISO-8601 timestamp (UTC). Format at render time, never store formatted. */
  createdAt: string;
}
