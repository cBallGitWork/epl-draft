import { LEAGUE_NAME } from "@epl/core";
import Nothing from "../shell/Nothing";
import type { Silence as SilenceState } from "../../edition";
import FantraxSilent from "../shell/FantraxSilent";

// The paper with nothing to print: which nothing it is decides the sentence, so the three never share a panel.

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
