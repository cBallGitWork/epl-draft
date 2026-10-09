import { clubById } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import PremShell from "../../Shell";
import { clubPlaces } from "../../places";
import Rounds, { byRound } from "../../Rounds";
import { footballNow, seasonFixtures } from "../../../football";

// Every upcoming fixture by round, soonest first; a match in play is on Live, not here or Results.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export default async function FixturesPage() {
  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);

  const places = clubPlaces(fixtures, snapshot.clubs);

  const ahead = byRound(fixtures.filter((fixture) => fixture.status === "upcoming"));

  if (ahead.length === 0) {
    return (
      <PremShell current="fixtures">
        <Nothing title="Nothing left to play" code="no upcoming fixture">
          Every match FPL has published has been played. Next season&apos;s fixtures arrive when
          they are drawn.
        </Nothing>
      </PremShell>
    );
  }

  return (
    <PremShell current="fixtures">
      <Rounds rounds={ahead} clubs={clubById(snapshot)} places={places} />
    </PremShell>
  );
}

