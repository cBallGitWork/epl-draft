import { LEAGUE_NAME } from "@epl/core";
import Nothing from "../shell/Nothing";
import type { Silence as SilenceState } from "../../edition";
import FantraxSilent from "../shell/FantraxSilent";

// Nothing to print is a real state, not an empty page — our own league is in it
// every day until draft night, and this is the first thing sixteen people open.
//
// **Which nothing it is decides the sentence.** Only one of the three is about
// the league not existing yet, and telling a drafted league it has not drafted
// is the confident wrong statement `squads.ts` keeps these apart to prevent. The
// three must never be collapsed into one panel for that reason, which is what
// `docs/ui/gazetta.md` records about them.
//
// Its own file since 16 Sep 2026, when `(paper)/page.tsx` crossed CODE_RULES §4's
// hard 300-line ceiling. It is a `switch` and not three ternaries because the
// state is a discriminated union and exhaustiveness is then the compiler's job.

export default function Silence({ silence }: { silence: SilenceState }) {
  switch (silence.kind) {
    case "unavailable":
      return (
        <FantraxSilent code={silence.code}>
          The league is there and the football is on the other tabs. We just
          cannot read Fantrax right now, so rather than guess at the week this
          says nothing.
        </FantraxSilent>
      );
    case "undrafted":
      return (
        <Nothing title="No news yet" code={`${LEAGUE_NAME} has not drafted`}>
          There is nothing to report until there are squads to report on. The
          football is on the other tabs in the meantime, and it needs nobody to
          have drafted.
        </Nothing>
      );
    case "quiet":
      return (
        <Nothing title="A quiet week" code={LEAGUE_NAME}>
          Nobody has signed anybody, nobody is hurt, and no deadline is close
          enough to worry about. The football is still on the other tabs.
        </Nothing>
      );
  }
}
