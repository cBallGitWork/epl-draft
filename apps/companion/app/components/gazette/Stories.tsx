import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  type Club,
  type Story,
  type StoryResult,
  clubColours,
  crestUrl,
  isGoalkeeper,
} from "@epl/core";
import PlayerImage from "../league/PlayerImage";

// The paper's stories: the lead, and the headlines that run under it.
//
// The lead is the only thing on the page set to be read from across a room. The
// others are headlines and nothing else — a kicker and a line, no picture, no
// standfirst — because a front page that gave every story a photograph would be
// a page with no lead on it.
//
// It carries a picture, because a front page without one is a memo. Which
// picture depends on what the story is, and only one of the four has a
// photograph in it honestly: a man his own manager left out is a man, and we
// have his face. A result is not a face — the picture there is the scoreline
// itself, set as large as a phone allows, which is what a paper does with a
// score too. Nothing is borrowed to fill the space; a portrait of the winner's
// best player would be a picture of a story we are not telling.
//
// The words are here and the facts are in `gazette/stories.ts`, on the split the
// rest of the paper keeps. Nothing below decides which story is the biggest —
// it decides how to say the one that is.
//
// Unmarked when it is about the reader's own team, and that is a choice: the
// accent is a reading aid for scanning a list of sixteen, and there is nothing
// to scan here. A manager knows his own name in a headline.

export default function Lead({
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
  const { kicker, headline, standfirst } = written(lead, who);

  return (
    <section className="flex flex-col">
      <Figure lead={lead} who={who} clubs={clubs} />
      <p className="mt-3 border-b border-league/40 pb-1 font-display text-xs font-bold uppercase tracking-widest text-cream">
        {kicker}
      </p>
      <h2 className="text-balance pt-2.5 font-display text-3xl font-bold leading-[1.02] tracking-tight text-cream">
        {headline}
      </h2>
      <p className="pt-1.5 text-sm leading-snug text-muted">{standfirst}</p>
    </section>
  );
}

/** The picture, full-bleed. One band, three fillings, so the four kinds share a
 *  rhythm rather than each arriving as its own layout.
 *
 *  Exported because the picture and the words come apart on the one week they
 *  disagree about who should say it: when a columnist has filed, HIS headline
 *  leads and the desk's is dropped, but the story is the same story and it keeps
 *  its photograph. */
export function Figure({
  lead,
  who,
  clubs,
}: {
  lead: Story;
  who: (teamId: string | null) => string;
  clubs: Map<number, Club>;
}) {
  if (lead.kind === "bench") {
    const club = clubs.get(lead.pick.clubId);
    const colours = clubColours(club?.shortName ?? "");
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
        <div className="flex w-full flex-col items-center divide-y divide-league/30 px-4">
          {lead.deal.inbound.map((player) => (
            <p key={player.playerName} className="w-full py-1.5 text-center">
              <span className="block truncate font-display text-xl font-bold leading-tight text-cream">
                {player.playerName}
              </span>
              <span className="text-2xs uppercase tracking-widest text-cream/55">
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

/** A result, as the picture. Winner's total in cream and the loser's dimmed —
 *  the same grammar the head-to-head boards use, at the size a front page gives
 *  the one score that mattered. */
function Scoreline({ result }: { result: StoryResult }) {
  return (
    <Band>
      <div className="flex w-full items-center justify-center gap-4 px-4">
        <Total name={result.winner.name} points={result.winner.points} won />
        <span className="font-display text-3xl font-bold text-cream/25">–</span>
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
          won ? "text-cream" : "text-cream/45"
        }`}
      >
        {points}
      </span>
      <span className="w-full truncate text-center text-2xs uppercase tracking-widest text-cream/60">
        {name}
      </span>
    </span>
  );
}

/** The band every lead picture stands in. Full-bleed on the same rule the pitch
 *  uses: the widest thing on the page is the one that gains from every pixel. */
function Band({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="bleed relative flex h-[8.5rem] items-center justify-center overflow-hidden bg-raised"
      style={style}
    >
      {children}
    </div>
  );
}

/** The paper's words for one story.
 *
 *  Every sentence below is true of every story of its kind, which is the whole
 *  constraint: a standfirst is written once and printed over thirty-eight weeks
 *  of facts nobody has seen yet, so it may not claim anything the fact does not
 *  carry. The scoreline is not repeated here — the picture above is the
 *  scoreline, and a standfirst that says it again is a caption, not a line. */
function written(lead: Story, who: (teamId: string | null) => string) {
  switch (lead.kind) {
    case "squeaker":
      return {
        kicker: "Down to the wire",
        headline: `${lead.result.winner.name} edged ${lead.result.loser.name}`,
        standfirst: `Decided by ${points(lead.result.margin)}.`,
      };
    case "bench":
      return {
        kicker: "Left out",
        headline: `${lead.pick.ownerName} left ${lead.pick.playerName} out`,
        // The owner is named once, off the pick, so the headline and the line
        // under it cannot end up calling one manager two things: his name
        // reaches `lost.loser` through `getLeagueInfo` and reaches the pick
        // through the roster, and those are two reads of one team.
        standfirst:
          lead.lost === null
            ? "He is in the week's eleven, picked by everybody except his own manager."
            : `He is in the week's eleven. ${lead.pick.ownerName} lost ` +
              `${lead.lost.loser.points}–${lead.lost.winner.points} to ${lead.lost.winner.name}.`,
      };
    case "rout":
      return {
        kicker: "No contest",
        headline: `${lead.result.winner.name} took ${lead.result.loser.name} apart`,
        standfirst: `${points(lead.result.margin)} between them.`,
      };
    case "trade":
      return {
        kicker: "Business",
        headline: `${lead.sides.map(who).join(" and ")} have traded`,
        // Counted off the deal, and it has to be. This used to read "Two
        // managers did business this week. Nobody else did any." — two claims
        // the fact does not carry: `sides` is only guaranteed to be two OR MORE,
        // so a three-way trade ran that line under a headline naming three; and
        // `traded` takes the newest of however many, so a second trade in the
        // same week made the second sentence false with the first one printed
        // right underneath it in the business column.
        standfirst: `${players(lead.deal.inbound.length)} changed hands.`,
      };
  }
}

function players(count: number): string {
  return `${count} player${count === 1 ? "" : "s"}`;
}

function points(margin: number): string {
  return `${margin} point${margin === 1 ? "" : "s"}`;
}

/** A story that is not the lead: kicker, one line, and a rule under it.
 *
 *  Same facts, same words, a tenth of the room. The hierarchy IS the design —
 *  a newspaper's second story is recognisable as the second story before you
 *  have read a word of it. */
export function Headline({
  story,
  who,
}: {
  story: Story;
  who: (teamId: string | null) => string;
}) {
  const { kicker, headline } = written(story, who);

  return (
    <li className="border-b border-line py-2.5 last:border-b-0">
      {/* `faint` and not the league register: `league-dark` is a ground colour
          and sits at about 2:1 on the page, which is under the 4.5:1 PRODUCT.md
          sets for text. The red belongs to rules and chrome here, not to type
          this small. */}
      <p className="font-display text-2xs font-bold uppercase tracking-widest text-faint">
        {kicker}
      </p>
      <p className="text-balance pt-0.5 font-display text-base font-semibold leading-tight text-cream">
        {headline}
      </p>
    </li>
  );
}
