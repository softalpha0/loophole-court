"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted">The court will be back in session in a moment.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-strong"
      >
        Try again
      </button>
    </main>
  );
}
