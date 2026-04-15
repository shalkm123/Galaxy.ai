import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
        <h1 className="text-4xl font-semibold">Krea Workflow Builder</h1>
        <p className="mt-3 text-white/60">
          Phase 2 UI flow setup
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 font-medium text-black"
        >
          Open Login
        </Link>
      </div>
    </main>
  );
}