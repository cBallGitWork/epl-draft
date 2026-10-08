"use client";

import { useEffect } from "react";
import { BUTTON } from "./components/shell/ButtonLink";

// What a reader sees when a read throws: the section says it broke and offers the way back, on a `.cm-panel`
// because nothing prints on the bare ground (`tools/ui/groundfit.mjs`).

export default function SectionError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // The server log is where a digest becomes a stack trace, and on Vercel that
    // is the only place the two are joined up.
    console.error("section failed", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="cm-panel flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-chrome text-2xl font-bold tracking-tight">This section broke</h1>
        <p className="mx-auto max-w-xs text-sm text-muted">
          Not something the app expected, so it is not pretending otherwise. The other tabs are
          still there, and the football half needs no league at all.
        </p>
        {/* The digest, so a screenshot says which read failed. */}
        {error.digest ? (
          <p className="numeric pt-1 text-2xs text-faint">{error.digest}</p>
        ) : null}
      </div>
      {/* Fetches the section again; `reset` only re-rendered the payload that failed. */}
      <button
        type="button"
        onClick={() => unstable_retry()}
        className={BUTTON}
      >
        Try again
      </button>
    </div>
  );
}
