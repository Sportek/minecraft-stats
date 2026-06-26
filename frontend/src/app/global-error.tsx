"use client";

// Last-resort boundary for errors thrown in the root layout itself. It replaces
// the whole document, so it must render its own <html>/<body> and cannot rely on
// the locale provider — keep the copy static.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="rounded-md border px-4 py-2">
          Try again
        </button>
      </body>
    </html>
  );
}
