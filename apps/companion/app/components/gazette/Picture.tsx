import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  type Club,
  type Story,
  type StoryResult,
  clubColoursOf,
  crestUrl,
  isGoalkeeper,
} from "@epl/core";
import PlayerImage from "../league/PlayerImage";

// The lead's picture, because a front page without one is a memo.
//
// Which picture depends on what the story is, and only one of the four has a
// photograph in it honestly: a man his own manager left out is a man, and we
// have his face. A result is not a face — the picture there is the scoreline
// itself, set as large as a phone allows, which is what a paper does with a
// score too. Nothing is borrowed to fill the space; a portrait of the winner's
// best player would be a picture of a story we are not telling.
//
// It is its own file rather than the lead's, because the picture and the words
// come apart on the one week they disagree about who should say it: when a
// columnist has filed, HIS headline leads and the desk's is dropped, but the
// story is the same story and it keeps the photograph the desk chose for it.

export default function Picture({
  lead,
  who,
  clubs,
}: {
  lead: Story;
  who: (teamId: string | null) => string;
  /** The round's clubs, keyed by FPL id, for the one story that has a face in
   *  it. Empty is ordinary and costs the cut-out its kit, not the lead. */
  clubs: Map<number, Club>;
}) {
  if (lead.kind === "bench") {
    const club = clubs.get(lead.pick.clubId);
    const colours = clubColoursOf(club);
    return (
      <Band style={{ background: `linear-gradient(150deg, ${colours.primary} 0%, ${colours.secondary} 100%)` }}>
        {club ? (
          // The crest behind him, oversized and half out of frame. A watermark,
          // not a label — the club is already on his shirt.
          <Image
            src={crestUrl(club)}
            alt=""
            width={208}
            height={208}
            className="absolute -right-4 top-1/2 h-[13rem] w-[13rem] -translate-y-1/2 opacity-15"
          />
        ) : null}
        <div className="relative w-[11rem] shrink-0 pt-3">
          <PlayerImage
            player={{ code: lead.pick.playerCode, name: lead.pick.playerName }}
            club={club}
            keeper={isGoalkeeper(lead.pick.position)}
            kickedOff
            sizes="352px"
          />
        </div>
      </Band>
    );
  }

  if (lead.kind === "trade") {
    return (
      <Band>
        {/* The players are the story a trade tells; the managers are in the
            headline. Set big and stacked, with the rule between them doing the
            work the word "for" would. */}
        <div className="flex w-full flex-col items-center divide-y divide-bg/25 px-4">
          {lead.deal.inbound.map((player) => (
            <p key={player.playerName} className="w-full py-1.5 text-center">
              <span className="paper-display block truncate text-xl font-bold leading-tight text-bg">
                {player.playerName}
              </span>
              <span className="font-sans text-3xs uppercase tracking-[0.15em] text-bg/60">
                to {who(player.teamId)}
              </span>
            </p>
          ))}
        </div>
      </Band>
    );
  }

  return <Scoreline result={lead.result} />;
}

/** A result, as the picture. Winner's total in the stock and the loser's dimmed
 *  to 3.9:1 — the same grammar the head-to-head boards use, at the size a front
 *  page gives the one score that mattered. Large text, so the 3:1 floor is the
 *  one that applies to the dimmed half; the names beside them are small and sit
 *  at 5.9:1. */
function Scoreline({ result }: { result: StoryResult }) {
  return (
    <Band>
      <div className="flex w-full items-center justify-center gap-4 px-4">
        <Total name={result.winner.name} points={result.winner.points} won />
        <span className="font-display text-3xl font-bold text-bg/45">–</span>
        <Total name={result.loser.name} points={result.loser.points} won={false} />
      </div>
    </Band>
  );
}

function Total({ name, points, won }: { name: string; points: number; won: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
      <span
        className={`numeric font-display text-6xl font-bold leading-none ${
          won ? "text-bg" : "text-bg/45"
        }`}
      >
        {points}
      </span>
      <span className="w-full truncate text-center font-sans text-3xs uppercase tracking-[0.15em] text-bg/60">
        {name}
      </span>
    </span>
  );
}

/** The band every lead picture stands in. One band, three fillings, so the four
 *  kinds share a rhythm rather than each arriving as its own layout.
 *
 *  Full-bleed on the same rule the pitch is: the widest thing on the page is the
 *  one that gains from every pixel.
 *
 *  Inked, not raised. It stood on the paper's own light surface, which made the
 *  loudest picture on the page the palest thing on it. Ink ground and stock
 *  letters is what a paper does with a reversed block, and it is drawn in the
 *  two colours the sheet already has — so unlike the pitch and the crest it is
 *  furniture rather than a colour plate, and nothing inside it wants the desk's
 *  tokens back. The bench story overrides the ground with the club's own
 *  colours, which are data and belong to the club. */
function Band({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="bleed relative flex h-[8.5rem] items-center justify-center overflow-hidden bg-ink @xl:h-[12rem]"
      style={style}
    >
      {children}
    </div>
  );
}
