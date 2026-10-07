import { availabilityOf, clubColours, fullFootballerName, setPieceOrder, squadOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import Section from "../../../../components/shell/Section";
import PlayerPortrait from "../../../../components/football/PlayerPortrait";
import StateBox from "../../../../components/football/StateBox";
import PlayerName from "../../../../components/shell/PlayerName";
import { doubtRow } from "../../../../components/football/doubtRow";
import { SET_PIECES, intelSetPieces } from "../../../../intel";
import { leagueOpinions } from "../../../leagueOpinions";
import { poolHref } from "../../../poolHref";
import NameLink from "../NameLink";
import ClubShell from "../Shell";
import { clubOr404 } from "../club";
import { PANEL, ROW_NAME } from "@/app/desk";

// Who steps up: corners, free kicks and penalties, in the order they take them.
// Replaced Next Match, which Fixtures duplicates (Craig, 3 Sep 2026).
// FPL has no set-piece data: it comes from the sister repo and covers about one man in five.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export default async function SetPiecesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot } = await clubOr404(code);
  const colours = clubColours(club.shortName);
  const league = await leagueOpinions();

  const byCode = new Map(squadOf(snapshot, club.id).map((p) => [p.code, p]));
  // Departed takers drop before numbering, so the order still counts from 1.
  const orders = setPieceOrder(intelSetPieces.clubs[club.shortName], SET_PIECES)
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
                    <li key={taker.code} className={`flex min-h-11 items-center gap-2 px-2 lg:min-h-9 ${out ? "cm-out" : ""} ${doubtRow(player)}`}>
                      {/* The rank in CM's index block, in the club's colour (`ClubShell` scopes it). */}
                      <span className="cm-index numeric flex h-6 w-6 shrink-0 items-center justify-center">
                        {at + 1}
                      </span>
                      <PlayerPortrait
                        player={{ code: player.code, name: player.name }}
                        colours={colours}
                      />
                      <NameLink
                        href={poolHref(league, player.code)}
                        // The row's floor restated on the link, which `tapfit` measures; `self-stretch` lands one short.
                        className={`flex min-h-11 min-w-0 flex-1 items-center truncate text-ink lg:min-h-9 ${ROW_NAME}`}
                      >
                        <PlayerName name={player.fullName} short={fullFootballerName(player)} />
                      </NameLink>
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
