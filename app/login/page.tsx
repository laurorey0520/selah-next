import { redirect } from "next/navigation";
import { getSession } from "../lib/dal";
import LoginForm from "../components/LoginForm";

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-selah-abyss px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial from-selah-emerald via-selah-abyss to-selah-abyss opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-selah-jade/30 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-glass-edge bg-glass-pane shadow-2xl shadow-black/40 backdrop-blur-xl ring-1 ring-inset ring-glass-sheen">
        <div className="border-b border-glass-edge px-6 py-5 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-selah-mint/70">
            Welcome back
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            Sēlah
          </h1>
        </div>
        <div className="p-6">
          <LoginForm />
          <p className="mt-4 text-center text-[11px] text-emerald-100/40">
            Pause, reflect, return to yourself.
          </p>
        </div>
      </div>
    </main>
  );
}
