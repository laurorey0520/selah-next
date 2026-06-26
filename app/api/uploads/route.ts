import { NextResponse } from "next/server";
import { uploadAsset } from "../../lib/api";

/**
 * /api/uploads — binary ingest for the Vision Board.
 *
 * Accepts a multipart form with one or more `files`, validates each as an
 * image under the size cap, then streams it to storage via `uploadAsset()`.
 * Returns the stored asset URLs for the client to attach to an entry.
 *
 * Lives as a Route Handler (not a Server Action) on purpose: Server Actions
 * cap request bodies at 1MB, which images routinely exceed. Route Handlers
 * have no such limit and read multipart bodies as a stream.
 */
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB per file

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart form upload." },
      { status: 400 },
    );
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  const assets: { url: string; name: string }[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: `"${file.name}" is not an image.` },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds the 8MB limit.` },
        { status: 413 },
      );
    }

    try {
      const { url } = await uploadAsset(file);
      assets.push({ url, name: file.name });
    } catch (err) {
      console.error("POST /api/uploads failed:", err);
      return NextResponse.json(
        { error: `Couldn't store "${file.name}".` },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ assets }, { status: 201 });
}
