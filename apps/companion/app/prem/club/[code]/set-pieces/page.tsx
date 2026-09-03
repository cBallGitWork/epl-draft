import Link from "next/link";
import { availabilityOf, clubColours, setPieceOrder } from "@epl/core";
import type { IntelPlayer } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import Section from "../../../../components/shell/Section";
import PlayerPortrait from "../../../../components/football/PlayerPortrait";
import StateBox from "../../../../components/football/StateBox";
import { intelSquads } from "../../../../intel";
import { PLAYER } from "../../../PremNav";
import ClubShell from "../Shell";
import { clubOr404 } from "../club";

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

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — `scripts/revalidate.test.ts` holds the two together.
export const revalidate = 30;

/** The three the source ranks, in the order they are worth to a manager: a
 *  penalty is a goal most of the time, a corner is a chance a dozen times a
 *  game. The key is the sister repo's own spelling. */
const PIECES: readonly { key: string; label: string }[] = [
  { key: "penalties", label: "Penalties" },
  { key: "fk_direct", label: "Direct free kicks" },
  { key: "corners", label: "Corners" },
];

export default async function SetPiecesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot } = await clubOr404(code);
  const colours = clubColours(club.shortName);

  const squad = snapshot.players.filter((player) => player.clubId === club.id);
  const byCode = new Map(squad.map((player) => [player.code, player]));
  // His club's men, as the intel has them — the ranks live there and the
  // footballer lives in the snapshot, so the two meet on the code.
  const ranked = squad
    .map((player) => intelSquads.get(player.code))
    .filter((entry): entry is IntelPlayer => entry !== undefined);

  const orders = setPieceOrder(ranked, PIECES.map((piece) => piece.key)).filter(
    (order) => order.takers.length > 0,
  );

  return (
    <ClubShell
      club={club}
      title="Set Pieces"
      current="setPieces"
      empty={orders.length === 0 ? ["setPieces"] : []}
    >
      {orders.length === 0 ? (
        <TabEmpty>
          Nobody at {club.name} has been ranked for a set piece yet. The order is read off the
          season, so it fills in as one is played.
        </TabEmpty>
      ) : (
        <section className="cm-panel flex flex-col gap-3 p-2">
          {orders.map((order) => (
            <Section
              key={order.piece}
              title={PIECES.find((piece) => piece.key === order.piece)?.label ?? order.piece}
            >
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
                      <span className="cm-index numeric flex h-6 w-6 shrink-0 items-center justify-center text-2xs font-bold">
                        {at + 1}
                      </span>
                      <PlayerPortrait
                        player={{ code: player.code, name: player.name }}
                        colours={colours}
                      />
                      <Link
                        href={`${PLAYER}/${player.code}`}
                        className={`min-w-0 flex-1 truncate text-sm font-bold hover:underline ${
                          out ? "text-faint" : "text-info"
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
          <p className="text-2xs text-faint">
            Read off the season by the intel feed, not published by FPL. About one man in five is
            ranked, so a name missing here is one nobody has seen take one.
          </p>
        </section>
      )}
    </ClubShell>
  );
}
