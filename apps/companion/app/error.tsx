"use client";

import { useEffect } from "react";
import { BUTTON } from "./components/shell/ButtonLink";

// What a reader sees when a read throws.
//
// There was nothing here, and the consequence was total: an unhandled error
// anywhere in a server component takes out the whole tree, the section rail
// included, so a single provider throwing left sixteen people looking at a blank
// page with no way to reach any of the other five sections. Every *expected* failure is
// already modelled — `Nothing` panels, `orRefusal`, the three states of a points
// table — so what reaches here is by definition the case nobody predicted, and
// the one thing it must not do is take the app with it.
//
// Deliberately not a `try/catch` swallowing a default (CODE_RULES §2). Nothing
// is guessed at and no number is invented: the section says it broke, names what
// broke, and offers the way back.
//
// **On a `.cm-panel`, for `not-found.tsx`'s reason.** This boundary replaces
// everything below the root layout, so it lands on the bare stadium photograph
// with nothing between — and `PhotoGround`'s rule, which `tools/ui/groundfit.mjs`
// measures on every desk route, is that nothing prints text on the bare ground.
// Neither of the app's two refusal pages was keeping it.

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server log is where a digest becomes a stack trace, and on Vercel that
    // is the only place the two are joined up.
    console.error("section failed", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="cm-panel flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight">This section broke</h1>
        <p className="mx-auto max-w-xs text-sm text-muted">
          Not something the app expected, so it is not pretending otherwise. The other tabs are
          still there, and the football half needs no league at all.
        </p>
        {/* The provider's own tell, kept on screen for the same reason `Nothing`
            keeps it: when a manager says "it's broken", the first useful question
            is which read failed, and this is the difference between a screenshot
            that answers it and one that does not. */}
        {error.digest ? (
          <p className="numeric pt-1 text-2xs text-faint">{error.digest}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={reset}
        className={BUTTON}
      >
        Try again
      </button>
    </div>
  );
}
