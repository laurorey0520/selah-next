import { NextResponse } from "next/server";
import { getEntries } from "../../lib/entries";
import { createEntry, type NewEntryInput } from "../../lib/api";
import { getSession } from "../../lib/dal";

/**
 * /api/entries — Next-side endpoint over the Sēlah Express backend.
 *
 * Lets the browser (and any client) talk to Next instead of hitting Express
 * directly, so the API URL/token stay server-side. Reads flow through the
 * shared `getEntries()` seam; writes proxy to the Express API.
 *
 * Entries are user-specific and mutable, so this route runs at request time.
 */
export const dynamic = "force-dynamic";

/** GET /api/entries → Entry[] (auth required) */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const entries = await getEntries();
    return NextResponse.json(entries);
  } catch (err) {
    console.error("GET /api/entries failed:", err);
    return NextResponse.json(
      { error: "Failed to load entries." },
      { status: 502 },
    );
  }
}

/** POST /api/entries  { title, body, mood?, attachments? } → Entry (201) */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: Partial<NewEntryInput>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.title?.trim() || !payload.body?.trim()) {
    return NextResponse.json(
      { error: "Both `title` and `body` are required." },
      { status: 422 },
    );
  }

  try {
    const created = await createEntry(
      {
        title: payload.title,
        body: payload.body,
        mood: payload.mood,
        attachments: payload.attachments,
      },
      session.token,
    );
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/entries failed:", err);
    return NextResponse.json(
      { error: "Failed to create entry." },
      { status: 502 },
    );
  }
}
