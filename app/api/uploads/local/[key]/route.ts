import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextResponse } from "next/server";
import { isCloudConfigured } from "../../../../lib/storage";

/**
 * PUT /api/uploads/local/[key] — DEV ONLY.
 *
 * Stand-in for the bucket when no S3 creds are set: receives the same direct
 * PUT the browser would send to a presigned URL and streams it to
 * public/uploads. Disabled (404) the moment real cloud storage is configured.
 */
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/uploads/local/[key]">,
) {
  if (isCloudConfigured()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!request.body) {
    return NextResponse.json({ error: "Empty body." }, { status: 400 });
  }

  const { key } = await ctx.params;
  // Defend against path traversal; keys we mint have no separators anyway.
  const safe = key.replace(/[/\\]/g, "_").replace(/\.\./g, "_");

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, safe);

  // Stream the request body straight to disk — no full-file buffering.
  await pipeline(
    Readable.fromWeb(
      request.body as unknown as Parameters<typeof Readable.fromWeb>[0],
    ),
    createWriteStream(dest),
  );

  return NextResponse.json({ ok: true, key: safe }, { status: 201 });
}
