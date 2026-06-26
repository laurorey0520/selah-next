import type { Entry } from "../lib/types";
import EntryRow from "./EntryRow";

/** Renders the entry rows, or a graceful empty state when there are none. */
export default function EntryList({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <span className="text-2xl">🌿</span>
        <p className="text-sm font-medium text-emerald-50">No entries yet</p>
        <p className="max-w-xs text-xs leading-5 text-emerald-100/50">
          Your reflections will appear here as gentle rows of glass.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-glass-edge">
      {entries.map((entry) => (
        <li key={entry.id}>
          <EntryRow entry={entry} />
        </li>
      ))}
    </ul>
  );
}
