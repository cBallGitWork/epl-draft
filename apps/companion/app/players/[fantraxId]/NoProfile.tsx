import Nothing from "../../components/shell/Nothing";
import { PANEL } from "@/app/desk";

// What every one of the four player views draws when Fantrax will not answer.
//
// Written out four times before this — once per tab — which is the count that
// earned it (CODE_RULES §1). The wording is the part that matters and the part
// that was drifting: three tabs had already been shortened by hand and said less
// than the first.
//
// **It does not guess at a 404.** A player id that is not a player and a Fantrax
// that is not answering come back identically, so the tell goes on screen
// instead, which is what makes a mistyped URL diagnosable rather than mysterious.

export default function NoProfile({ code }: { code: string }) {
  return (
    <section className={PANEL}>
      <Nothing title="No profile for that player" code={code}>
        Either Fantrax does not know that id or it is not answering. Both come back the same way, so
        this does not guess which.
      </Nothing>
    </section>
  );
}
