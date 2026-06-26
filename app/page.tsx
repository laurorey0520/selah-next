import CreateEntryForm from "./components/CreateEntryForm";
import EntryList from "./components/EntryList";
import { getEntries } from "./lib/entries";

export default async function Home() {
  const entries = await getEntries();

  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center overflow-hidden bg-selah-abyss px-6 py-16 sm:py-24">
      {/* Ambient emerald glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial from-selah-emerald via-selah-abyss to-selah-abyss opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-selah-jade/30 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col gap-8">
        {/* Masthead */}
        <header className="flex flex-col gap-2 text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-selah-mint/70">
            A daily pause
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sēlah
          </h1>
          <p className="max-w-md text-sm leading-6 text-emerald-100/60">
            Your journal entries, gathered quietly in one place. Pause, reflect,
            and let each line settle.
          </p>
        </header>

        {/* Compose a new reflection */}
        <CreateEntryForm />

        {/* Ultra-thin glass container — SQL/Express entry rows render here */}
        <section
          aria-label="Journal entries"
          className="rounded-2xl border border-glass-edge bg-glass-pane shadow-2xl shadow-black/40 backdrop-blur-xl ring-1 ring-inset ring-glass-sheen"
        >
          <div className="flex items-center justify-between border-b border-glass-edge px-6 py-4">
            <h2 className="text-sm font-medium text-emerald-50">Recent entries</h2>
            <span className="rounded-full border border-glass-edge px-2.5 py-0.5 text-xs text-selah-mint/70">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          <EntryList entries={entries} />
        </section>
      </div>
    </main>
  );
}
