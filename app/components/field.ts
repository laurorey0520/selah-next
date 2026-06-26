/** Shared liquid-glass form styling, reused by the create form and inline edit. */

export const fieldBase =
  "w-full rounded-xl border border-glass-edge bg-glass-pane px-3.5 py-2.5 text-sm text-emerald-50 shadow-inner shadow-black/20 outline-none backdrop-blur-sm transition placeholder:text-emerald-100/30 focus:border-selah-mint/40 focus:ring-2 focus:ring-selah-mint/20";

export const labelBase =
  "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-selah-mint/60";

/** Native <select> tweaks to keep options on-theme in dark mode. */
export const selectExtra =
  "appearance-none [&>option]:bg-selah-abyss [&>option]:text-emerald-50";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-selah-mint/20 bg-selah-jade/40 px-5 py-2.5 text-sm font-medium text-emerald-50 shadow-lg shadow-black/30 backdrop-blur-sm transition hover:bg-selah-jade/60 focus:ring-2 focus:ring-selah-mint/30 disabled:cursor-not-allowed disabled:opacity-50";

export const ghostButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-glass-edge bg-glass-pane px-4 py-2.5 text-sm font-medium text-emerald-100/70 backdrop-blur-sm transition hover:bg-glass-sheen hover:text-emerald-50 focus:ring-2 focus:ring-selah-mint/20 disabled:cursor-not-allowed disabled:opacity-50";

export const MOOD_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Mood — optional" },
  { value: "still", label: "Still" },
  { value: "grateful", label: "Grateful" },
  { value: "hopeful", label: "Hopeful" },
  { value: "heavy", label: "Heavy" },
  { value: "wrestling", label: "Wrestling" },
];
