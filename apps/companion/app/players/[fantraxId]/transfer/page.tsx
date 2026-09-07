import { Suspense } from "react";
import { FANTRAX_PLAYER_BASE } from "@epl/core";
import { StackWaiting } from "../Waiting";
import Moves from "../Moves";
import NoProfile from "../NoProfile";
import Pedigree, { DraftLine } from "../Pedigree";
import PlayerShell from "../PlayerShell";
import { playerPedigree } from "../draft";
import { playerMoves } from "../dossier";
import { subject } from "../subject";
import OutLink from "../../../components/shell/OutLink";

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

export default async function PlayerTransfer({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

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

      {/* Last on the tab, under the business, in cyan — the Profile's position
          line in the same place doing the same job. */}
      <Suspense fallback={null}>
        <Origin fantraxId={fantraxId} />
      </Suspense>

      {/* **The way out, and this tab is the one that earns it.** Every other
          screen answers a question; this one ends in an ACT — a claim, a drop, a
          trade — and Fantrax is where all three happen. A screen that lists what
          a manager could do with a player and then leaves him to find the man
          again on another site is the dead end `fpl/page` names in its own
          words.

          One segment, and it was probed rather than guessed: their rows carry a
          `urlName` slug and their own anchors use it, but the bundle declares
          `player/:playerId` and a status code cannot tell you — the SPA serves
          its shell with a 200 for an id that does not exist. `scorerId` is our
          `fantraxId`, so this costs no read. PLATFORM_NOTES carries it. */}
      <OutLink href={`${FANTRAX_PLAYER_BASE}/${fantraxId}`}>Open on Fantrax</OutLink>

      {/* **The whole-of-Fantrax block is gone** (Craig, 4 Sep 2026: *"remove
          Across every Fantrax league / Drafted 100% / ADP 1.84 / Ros 100% /
          Start 100%"*). Four percentages about every league on the site, on a
          tab whose question is what happened to him in OURS — and the one of
          them that bears on our draft, how his cost compares to his ranking,
          is already the figure beside the pick. */}
    </PlayerShell>
  );
}

/** Where he was taken and what he has repaid, read behind the boundary above.
 *  `playerPedigree` never answers null — a failed pool read comes back as an
 *  `origin: "unknown"` pedigree, so the card always has something to draw. */
async function Draft({ fantraxId }: { fantraxId: string }) {
  const { pedigree } = await playerPedigree(fantraxId);
  return <Pedigree pedigree={pedigree} />;
}

/** His moves in this league, read behind the boundary above. */
async function Business({ fantraxId }: { fantraxId: string }) {
  return <Moves moves={await playerMoves(fantraxId)} />;
}

/** Where he came from, read behind its own boundary. It is the same cached pool
 *  read the Draft card makes, so the second call costs nothing. */
async function Origin({ fantraxId }: { fantraxId: string }) {
  const { pedigree, drafterName } = await playerPedigree(fantraxId);
  return <DraftLine pedigree={pedigree} drafterName={drafterName} />;
}
