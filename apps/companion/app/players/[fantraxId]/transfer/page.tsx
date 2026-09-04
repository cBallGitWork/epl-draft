import { Suspense } from "react";
import { StackWaiting } from "../Waiting";
import Facts from "../Facts";
import Foot from "../Foot";
import Joined from "../Joined";
import Moves from "../Moves";
import NoProfile from "../NoProfile";
import Pedigree from "../Pedigree";
import PlayerShell from "../PlayerShell";
import { playerPedigree } from "../draft";
import { playerMoves } from "../dossier";
import { subject } from "../subject";

// Championship Manager's `Transfer` tab: what he cost and what he is worth.
//
// CM's is a fee and a valuation. Ours is a draft pick, an average draft position
// across every Fantrax league, and how many of them have him — which is the same
// question a draft league asks instead. `Contract` is folded in here rather than
// given a fifth plate: we hold one fact about his employment and it is a date.

export const revalidate = 30;

export default async function PlayerTransfer({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  const { intel, football } = found;

  return (
    <PlayerShell
      subject={found}
      fantraxId={fantraxId}
      current="transfer"
    >
      {/* Streamed, because the ranking behind "four picks better than he cost"
          is every drafted man's — the pool table, and the largest read in the
          app. A league whose draft has not run prints nothing here, so the
          fallback is nothing rather than a shape the page cannot fill. */}
      <Suspense fallback={<StackWaiting />}>
        <Draft fantraxId={fantraxId} />
      </Suspense>

      {/* Every claim, drop and trade this league has made with him. Streamed
          for the same reason the draft is: it reads the league-wide transaction
          feed, which is cached but not free on a cold window. */}
      <Suspense fallback={<StackWaiting />}>
        <Business fantraxId={fantraxId} />
      </Suspense>

      {/* Championship Manager's Contract tab, folded in as one row — we hold one
          fact about his employment and Fantrax's service time is unreachable. */}
      <Joined date={football?.player.joinedClub ?? null} />

      {/* **The season is named or the heading does not pretend to one.**
          `PlayerIntel.season` is nullable and its own docblock says the UI must
          say so rather than letting figures stand undated — this rendered
          `In this league · ` with a trailing separator for one commit. */}
      <Facts
        title={intel.season ? `In this league · ${intel.season}` : "In this league"}
        note={
          intel.season
            ? undefined
            : "Fantrax did not say which season these describe, so read them with care."
        }
        rows={intel.league}
      />
      {/* Fantrax's own scoring and rankings — his position rank, his points, how
          much of the site holds him. Theirs, and never recomputed from football
          facts: that decision is permanent (PLATFORM_NOTES). */}
      <Facts title={intel.season ? `Fantrax · ${intel.season}` : "Fantrax"} rows={intel.highlights} />
      <Facts
        title="Across every Fantrax league"
        note="Their whole userbase, not ours — which is what makes it a market price."
        rows={intel.market}
      />

      <Foot ownerTeamId={intel.ownerTeamId} />
    </PlayerShell>
  );
}

/** Where he was taken and what he has repaid, read behind the boundary above.
 *  `playerPedigree` never answers null — a failed pool read comes back as an
 *  `origin: "unknown"` pedigree, so the card always has something to draw. */
async function Draft({ fantraxId }: { fantraxId: string }) {
  const { pedigree, drafterName } = await playerPedigree(fantraxId);
  return <Pedigree pedigree={pedigree} drafterName={drafterName} />;
}

/** His moves in this league, read behind the boundary above. */
async function Business({ fantraxId }: { fantraxId: string }) {
  return <Moves moves={await playerMoves(fantraxId)} />;
}
