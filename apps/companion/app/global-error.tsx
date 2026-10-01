"use client";

import { useEffect } from "react";
import { BUTTON } from "./components/shell/ButtonLink";
import Nothing from "./components/shell/Nothing";
import "./globals.css";

// The root layout threw, so this replaces it: its own html, body and stylesheet, no rail, no
// photograph, and `Nothing` on a plate with the digest the server log joins to a stack trace.

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("layout failed", error.digest ?? "", error.message);
  }, [error]);

  return (
    <html lang="en-GB">
      <body className="flex min-h-dvh items-center justify-center p-4 antialiased">
        <title>The app broke</title>
        <main className="cm-panel flex max-w-sm flex-col items-center px-6 pb-10">
          <Nothing title="The app broke" code={error.digest}>
            Not something it expected, so it is not pretending otherwise.
          </Nothing>
          <button type="button" onClick={() => unstable_retry()} className={BUTTON}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
