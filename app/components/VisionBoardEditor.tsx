"use client";

import { useRef, useState } from "react";
import type { Attachment } from "../lib/types";
import { labelBase } from "./field";

const MAX_ASSETS = 12;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB — mirrors the /api/uploads cap

type Item = {
  id: string;
  status: "uploading" | "done" | "error";
  /** Object URL shown while uploading. */
  previewUrl?: string;
  /** Final stored URL once uploaded. */
  url?: string;
  caption: string;
  error?: string;
};

/**
 * Vision-board uploader: a drag-and-drop / click-to-browse zone that uploads
 * each image to /api/uploads, shows live previews with per-asset status, and
 * mirrors finished assets into hidden `attachments` inputs so the Server Action
 * receives them via FormData.
 */
export default function VisionBoardEditor({
  defaultAttachments = [],
}: {
  defaultAttachments?: Attachment[];
}) {
  const [items, setItems] = useState<Item[]>(() =>
    defaultAttachments.map((a) => ({
      id: a.id,
      status: "done" as const,
      url: a.url,
      caption: a.caption ?? "",
    })),
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const localId = useRef(0);

  const liveCount = items.filter((i) => i.status !== "error").length;
  const atLimit = liveCount >= MAX_ASSETS;

  function addFiles(fileList: FileList | File[]) {
    let remaining = MAX_ASSETS - items.filter((i) => i.status !== "error").length;
    for (const file of Array.from(fileList)) {
      if (remaining <= 0) break;
      const id = `local-${localId.current++}`;

      if (!file.type.startsWith("image/")) {
        setItems((p) => [
          ...p,
          { id, status: "error", caption: "", error: `${file.name}: not an image` },
        ]);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setItems((p) => [
          ...p,
          { id, status: "error", caption: "", error: `${file.name}: over 8MB` },
        ]);
        continue;
      }

      remaining--;
      const previewUrl = URL.createObjectURL(file);
      setItems((p) => [...p, { id, status: "uploading", previewUrl, caption: "" }]);
      void uploadOne(id, file, previewUrl);
    }
  }

  async function uploadOne(id: string, file: File, previewUrl: string) {
    try {
      // 1. Ask Next for a short-lived presigned upload plan (no bytes sent).
      const planRes = await fetch("/api/uploads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      if (!planRes.ok) {
        const j = await planRes.json().catch(() => ({}));
        throw new Error(j.error ?? `Sign failed (${planRes.status})`);
      }
      const plan = await planRes.json();

      // 2. Stream the file straight to the bucket (or dev receiver).
      const putRes = await fetch(plan.uploadUrl, {
        method: plan.method ?? "PUT",
        headers: plan.headers,
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);

      // 3. Record the asset's public URL.
      const url = plan.publicUrl as string;
      setItems((p) =>
        p.map((it) => (it.id === id ? { ...it, status: "done", url } : it)),
      );
    } catch (e) {
      setItems((p) =>
        p.map((it) =>
          it.id === id
            ? {
                ...it,
                status: "error",
                error: e instanceof Error ? e.message : "Upload failed",
              }
            : it,
        ),
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }

  function remove(id: string) {
    setItems((p) => p.filter((it) => it.id !== id));
  }

  function setCaption(id: string, caption: string) {
    setItems((p) => p.map((it) => (it.id === id ? { ...it, caption } : it)));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className={labelBase}>Vision board</span>
        <span className="mb-1.5 text-[11px] text-emerald-100/40">
          {liveCount}/{MAX_ASSETS}
        </span>
      </div>

      {/* Hidden inputs carry finished assets into FormData */}
      {items
        .filter((i) => i.status === "done" && i.url)
        .map((i) => (
          <input
            key={i.id}
            type="hidden"
            name="attachments"
            value={JSON.stringify({ url: i.url, caption: i.caption || undefined })}
          />
        ))}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Drop zone / collage */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!atLimit) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border bg-glass-pane/40 p-2 backdrop-blur-sm transition ${
          dragging
            ? "border-selah-mint/50 bg-selah-jade/20 ring-2 ring-selah-mint/20"
            : "border-glass-edge"
        }`}
      >
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-1">
              <figure className="group relative aspect-square overflow-hidden rounded-lg border border-glass-edge bg-glass-pane">
                {item.status !== "error" && (item.url || item.previewUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url ?? item.previewUrl}
                    alt={item.caption || "Vision board asset"}
                    className={`size-full object-cover transition ${
                      item.status === "uploading"
                        ? "opacity-50 blur-[1px]"
                        : "group-hover:brightness-110"
                    }`}
                  />
                )}

                {item.status === "uploading" && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="size-5 animate-spin rounded-full border-2 border-emerald-100/30 border-t-selah-mint" />
                  </span>
                )}

                {item.status === "error" && (
                  <span className="flex size-full items-center justify-center p-2 text-center text-[10px] leading-tight text-rose-300/90">
                    {item.error}
                  </span>
                )}

                <button
                  type="button"
                  aria-label="Remove asset"
                  onClick={() => remove(item.id)}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full border border-glass-edge bg-black/50 text-xs text-emerald-50 opacity-0 backdrop-blur-sm transition hover:bg-rose-500/60 group-hover:opacity-100"
                >
                  ×
                </button>
              </figure>

              {item.status === "done" && (
                <input
                  type="text"
                  value={item.caption}
                  onChange={(e) => setCaption(item.id, e.target.value)}
                  placeholder="Caption…"
                  className="w-full rounded-md border border-glass-edge bg-glass-pane px-2 py-1 text-[11px] text-emerald-50 outline-none placeholder:text-emerald-100/30 focus:ring-1 focus:ring-selah-mint/20"
                />
              )}
            </div>
          ))}

          {/* Add tile */}
          {!atLimit && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-glass-edge bg-glass-pane/40 text-emerald-100/50 transition hover:border-selah-mint/40 hover:text-selah-mint"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-[10px]">Add</span>
            </button>
          )}
        </div>

        <p className="mt-2 px-1 text-center text-[11px] text-emerald-100/40">
          {atLimit
            ? `Vision board is full (${MAX_ASSETS} assets).`
            : "Drag images here, or click + to browse. Up to 8MB each."}
        </p>
      </div>
    </div>
  );
}
