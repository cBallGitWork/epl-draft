import { LEAGUE_NAME } from "@epl/core";
import type { Silence as SilenceState } from "../../edition";
import { FANTRAX_SILENT } from "../../config";
import { STANDING_HEAD } from "./heads";
import StoryHead from "./StoryHead";

// The paper with nothing to print: which nothing it is decides the sentence, so the three never share a panel.

export default function Silence({ silence }: { silence: SilenceState }) {
  switch (silence.kind) {
    case "unavailable":
      return (
        <Quiet
          tell={silence.code}
          headline={FANTRAX_SILENT}
          deck="The league is there and the football is on the other tabs. We just cannot read Fantrax right now, so rather than guess at the week this says nothing."
        />
      );
    case "undrafted":
      return (
        <Quiet
          tell={`${LEAGUE_NAME} has not drafted`}
          headline="No news yet"
          deck="There is nothing to report until there are squads to report on. The football is on the other tabs in the meantime, and it needs nobody to have drafted."
        />
      );
    case "quiet":
      return (
        <Quiet
          tell={LEAGUE_NAME}
          headline="A quiet week"
          deck="Nobody has signed anybody, nobody is hurt, and no deadline is close enough to worry about. The football is still on the other tabs."
        />
      );
  }
}

/** A silence set as the sheet sets a story: the tell as a standing head, then a headline and its deck in the
 *  paper's faces; the desk's `shell/Nothing` is in the desk's. */
function Quiet({ tell, headline, deck }: { tell: string; headline: string; deck: string }) {
  return (
    <section className="flex flex-col">
      <p className={STANDING_HEAD}>{tell}</p>
      <StoryHead headline={headline} standfirst={deck} rank="front" />
    </section>
  );
}
