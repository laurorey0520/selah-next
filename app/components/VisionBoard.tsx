import type { Attachment } from "../lib/types";

/**
 * Read-only vision-board collage shown on an entry row. A single asset spans
 * full width; multiple assets lay out as a masonry collage that keeps each
 * image's aspect ratio inside the glass panel.
 */
export default function VisionBoard({
  attachments,
}: {
  attachments: Attachment[];
}) {
  if (attachments.length === 0) return null;

  if (attachments.length === 1) {
    const a = attachments[0];
    return (
      <figure className="mt-3 overflow-hidden rounded-xl border border-glass-edge bg-glass-pane/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.url}
          alt={a.caption ?? "Vision board asset"}
          className="max-h-72 w-full object-cover"
        />
        {a.caption && (
          <figcaption className="px-3 py-1.5 text-xs text-emerald-100/60">
            {a.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-glass-edge bg-glass-pane/40 p-2 backdrop-blur-sm">
      <div className="columns-2 gap-2 sm:columns-3 [&>figure]:mb-2">
        {attachments.map((a) => (
          <figure
            key={a.id}
            className="relative break-inside-avoid overflow-hidden rounded-lg border border-glass-edge"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.url}
              alt={a.caption ?? "Vision board asset"}
              className="w-full object-cover transition hover:brightness-110"
            />
            {a.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-emerald-50">
                {a.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
