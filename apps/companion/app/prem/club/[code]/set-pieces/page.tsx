import Link from "next/link";
import { availabilityOf, clubColours, setPieceOrder, squadOf } from "@epl/core";
import type { IntelClubPieces } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import Section from "../../../../components/shell/Section";
import PlayerPortrait from "../../../../components/football/PlayerPortrait";
import StateBox from "../../../../components/football/StateBox";
import { intelSetPieces } from "../../../../intel";
import { PLAYER } from "../../../routes";
import ClubShell from "../Shell";
import { clubOr404 } from "../club";
import { PANEL, ROW_NAME } from "@/app/desk";

// Who steps up: corners, free kicks and penalties, in the order they take them.
//
// **This tab replaced Next Match** (Craig, 3 Sep 2026: "we can replace match
// (fixtures have it) with set piece takers"). He is right that it was a
// duplicate — the fixture run already opens on the next game and says who, when
// and where — and a set-piece order is the thing a fantasy manager actually
// cannot get anywhere else on this site.
//
// **It is the only screen here whose data FPL has no notion of.** Positions and
// numbers at least have a null field in the bootstrap; who takes a corner is
// not a question FPL asks. It comes across the bridge from the sister repo,
// which reads it off the season, and it covers about one man in five — so a
// club with nobody ranked says so rather than drawing an empty board.

// Must match `PAGE_REVALIDATE` in the app's config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

/** The three the source ranks, in the order they are worth to a manager: a
 *  penalty is a goal most of the time, a corner is a chance a dozen times a
 *  game. The key is the sister repo's own spelling. */
const PIECES = [
  { key: "penalties", label: "Penalties" },
  { key: "freeKicks", label: "Direct free kicks" },
  { key: "corners", label: "Corners" },
] as const satisfies readonly { key: keyof IntelClubPieces; label: string }[];

export default async function SetPiecesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot } = await clubOr404(code);
  const colours = clubColours(club.shortName);

  const byCode = new Map(squadOf(snapshot, club.id).map((p) => [p.code, p]));
  // **Takers filtered before they are numbered.** Six of the men the sister repo
  // ranks have since left the division — Woltemade among them, first choice on
  // Newcastle's penalties at a 0.57 share on 11 Sep — and the site rule drops
  // them. They come out before the rank is drawn rather than during the render,
  // so the order still counts 1, 2, 3: a first-choice taker who has gone makes
  // the man behind him first choice, and a list that opened on "2" reads as a
  // bug.
  const orders = setPieceOrder(intelSetPieces.clubs[club.shortName], PIECES)
    .map((order) => ({ ...order, takers: order.takers.filter((taker) => byCode.has(taker.code)) }))
    .filter((order) => order.takers.length > 0);

  return (
    <ClubShell
      club={club}
      current="setPieces"
      empty={orders.length === 0 ? ["setPieces"] : []}
    >
      {orders.length === 0 ? (
        <TabEmpty>
          Nobody at {club.name} has been ranked for a set piece yet. The order is read off the
          season, so it fills in as one is played.
        </TabEmpty>
      ) : (
        <section className={PANEL}>
          {orders.map((order) => (
            <Section key={order.piece} title={order.label}>
              <ul className="cm-rows flex flex-col">
                {order.takers.map((taker, at) => {
                  const player = byCode.get(taker.code);
                  if (player === undefined) return null;
                  const out = availabilityOf(player).out;
                  return (
                    <li key={taker.code} className="flex min-h-11 items-center gap-2 px-2 lg:min-h-9">
                      {/* The rank in CM's index block, in the club's own colour —
                          `ClubShell` has scoped it. First choice is the point of
                          the screen, so it is the first thing on the row. */}
                      <span className="cm-index numeric flex h-6 w-6 shrink-0 items-center justify-center">
                        {at + 1}
                      </span>
                      <PlayerPortrait
                        player={{ code: player.code, name: player.name }}
                        colours={colours}
                      />
                      <Link
                        href={`${PLAYER}/${player.code}`}
                        // The row's own floor, restated on the LINK. `tapfit`
                        // measures the link, and an 18px target inside a 44px
                        // row is a row you can miss. `self-stretch` was tried
                        // first and lands on 43 against a 44 floor — the row's
                        // min-height is not its content box — so the number is
                        // written out and matches the `<li>` above it exactly.
                        className={`flex min-h-11 min-w-0 flex-1 items-center truncate hover:underline lg:min-h-9 ${ROW_NAME} ${
                          out ? "text-faint" : "text-ink"
                        }`}
                      >
                        {player.fullName}
                      </Link>
                      <StateBox player={player} />
                    </li>
                  );
                })}
              </ul>
            </Section>
          ))}
        </section>
      )}
    </ClubShell>
  );
}
