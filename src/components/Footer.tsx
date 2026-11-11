export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-2xl space-y-2 px-4 pb-10 pt-4 text-center text-xs text-muted sm:px-6">
      <p>
        No accounts. Briefs are sent to an AI model to run the trial and aren&apos;t stored by Loophole Court. Loophole Court never writes assignments.
      </p>
      <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <a href="https://github.com/softalpha0/loophole-court" className="underline-offset-2 hover:underline">
          Source code
        </a>
        <span>Built solo at IceHacks 2026</span>
      </p>
    </footer>
  );
}
