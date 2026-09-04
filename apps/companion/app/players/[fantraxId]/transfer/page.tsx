import { Suspense } from "react";
import { StackWaiting } from "../Waiting";
import Facts from "../Facts";
import Foot from "../Foot";
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
//
// **No fantasy-points figure appears on this tab** (Craig, 4 Sep 2026: "Remove
// all unneeded info from transfer tab like stats"). Fantrax mixes his scoring
// into two of the blocks it hands over — `FPts` and `FP/G` in the league row, and
// those plus his positional rank among the whole-of-Fantrax numbers — and all of
// it is now Data's job, in Data's shape. A points total in two places on one
// screen is a reader checking whether they agree.

export const revalidate = 30;

/** The two whole-of-Fantrax rows that are about DEMAND rather than performance:
 *  how many leagues hold him, and how many start him. Kept by name rather than
 *  filtering the rank out, because the rank's label moves with his position. */
const DEMAND = ["Ros", "Start"];

export default async function PlayerTransfer({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  const { intel } = found;

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

      {/* How much of Fantrax wants him. Their whole userbase and not ours, which
          is what makes it a price rather than an opinion — and the two ownership
          percentages belong beside the draft numbers rather than under a heading
          of their own, because all four answer one question. */}
      {/* The heading is the whole explanation. It used to carry a note reading
          "Their whole userbase, not ours — which is what makes it a market
          price", which explains a heading that already says it — and PRODUCT.md
          asks for terse and never explanatory. */}
      <Facts
        title="Across every Fantrax league"
        rows={[...intel.market, ...intel.highlights.filter((row) => DEMAND.includes(row.label))]}
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
