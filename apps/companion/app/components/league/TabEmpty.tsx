import type { ReactNode } from "react";

// A team tab with nothing in it, saying so without becoming a dead end.
//
// **Not `shell/Nothing`**, which is a whole-page state: a 104px crest, an h1 and
// a provider code, for a screen that cannot show what it exists to show. This
// lives INSIDE `TeamShell`, beneath the tab strip — which is the point. A
// manager whose side has made no transfers must still be able to reach his
// fixtures, and a full-page empty state under a strip would be two competing
// answers to "what is this screen".
//
// Extracted at four call sites — the transfers, match, fixtures and stats tabs —
// where the markup was character-identical and only the prose differed
// (CODE_RULES §1). `ReactNode` and not `string`: the match tab hands it a
// ternary, because Fantrax refusing to describe the league is a different
// absence from a side simply having no fixture this period.

export default function TabEmpty({ children }: { children: ReactNode }) {
  return (
    <section className="cm-panel px-3 py-6">
      <p className="text-center text-2xs text-muted">{children}</p>
    </section>
  );
}
