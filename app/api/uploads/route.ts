import { NextResponse } from "next/server";
import { createSignedUpload } from "../../lib/storage";
import { getSession } from "../../lib/dal";

/**
 * POST /api/uploads — issue a presigned upload plan for one image.
 *
 * Takes JSON metadata (no bytes) and returns a short-lived signed PUT URL plus
 * the asset's eventual public URL. The browser then streams the file straight
 * to the bucket, so neither Next nor the Render backend handles the binary.
 *
 * A signing endpoint is an upload grant, so it requires an authenticated
 * session.
 */
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB per file

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let meta: { filename?: unknown; contentType?: unknown; size?: unknown };
  try {
    meta = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const filename = String(meta.filename ?? "").trim();
  const contentType = String(meta.contentType ?? "");
  const size = Number(meta.size ?? 0);

  if (!filename) {
    return NextResponse.json({ error: "filename is required." }, { status: 400 });
  }
  if (!contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image uploads are allowed." },
      { status: 415 },
    );
  }
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "Invalid file size." }, { status: 400 });
  }
  if (size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 8MB limit." },
      { status: 413 },
    );
  }

  try {
    const plan = await createSignedUpload({ filename, contentType });
    return NextResponse.json(plan, { status: 200 });
  } catch (err) {
    console.error("POST /api/uploads (sign) failed:", err);
    return NextResponse.json(
      { error: "Couldn't prepare the upload." },
      { status: 502 },
    );
  }
}
