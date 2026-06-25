export default function Home() {
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

        {/* Ultra-thin glass container — ready for SQL entry rows */}
        <section
          aria-label="Journal entries"
          className="rounded-2xl border border-glass-edge bg-glass-pane shadow-2xl shadow-black/40 backdrop-blur-xl ring-1 ring-inset ring-glass-sheen"
        >
          <div className="flex items-center justify-between border-b border-glass-edge px-6 py-4">
            <h2 className="text-sm font-medium text-emerald-50">Recent entries</h2>
            <span className="rounded-full border border-glass-edge px-2.5 py-0.5 text-xs text-selah-mint/70">
              0 entries
            </span>
          </div>

          {/* Entry rows render here — one <article> per row from the database */}
          <ul className="divide-y divide-glass-edge">
            {/* Empty state until the first SQL row arrives */}
            <li className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <span className="text-2xl">🌿</span>
              <p className="text-sm font-medium text-emerald-50">
                No entries yet
              </p>
              <p className="max-w-xs text-xs leading-5 text-emerald-100/50">
                Once you connect the database, your reflections will appear here
                as gentle rows of glass.
              </p>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
