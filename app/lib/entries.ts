import { cache } from "react";
import type { Entry } from "./types";
import { fetchEntries } from "./api";

/**
 * The single data seam for journal entries.
 *
 * Sourced from the existing Sēlah Express backend (see app/lib/api.ts).
 * Until SELAH_API_URL is configured in .env.local, this falls back to seed
 * data so the dashboard still renders during local development.
 *
 * Wrapped in React.cache so multiple components in one request share a single
 * fetch with no prop drilling.
 */
export const getEntries = cache(async (): Promise<Entry[]> => {
  if (!process.env.SELAH_API_URL) {
    return SEED_ENTRIES;
  }
  return fetchEntries();
});

const author = {
  id: "u_1",
  name: "Laura",
};

const SEED_ENTRIES: Entry[] = [
  {
    id: "e_3",
    title: "Be still",
    body: "Caught myself rushing through the morning. Stopped, breathed, and let the quiet do its work.",
    mood: "still",
    attachments: [
      { id: "a_31", url: "https://picsum.photos/seed/selah-quiet/600/800", caption: "Morning light" },
      { id: "a_32", url: "https://picsum.photos/seed/selah-water/600/400", caption: "Still water" },
      { id: "a_33", url: "https://picsum.photos/seed/selah-trees/600/600" },
    ],
    author,
    createdAt: "2026-06-24T07:12:00.000Z",
  },
  {
    id: "e_2",
    title: "Gratitude, unforced",
    body: "A list of small mercies: warm coffee, an unhurried call, light through the kitchen window.",
    mood: "grateful",
    attachments: [
      { id: "a_21", url: "https://picsum.photos/seed/selah-coffee/800/500", caption: "Warm coffee" },
    ],
    author,
    createdAt: "2026-06-23T21:40:00.000Z",
  },
  {
    id: "e_1",
    title: "Holding the question",
    body: "No tidy answer today, and that's okay. Sitting with the tension instead of forcing resolution.",
    mood: "wrestling",
    attachments: [],
    author,
    createdAt: "2026-06-22T23:05:00.000Z",
  },
];
