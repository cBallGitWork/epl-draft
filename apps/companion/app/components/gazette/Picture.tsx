import type { ReactNode } from "react";
import type { Club, Story, StoryResult } from "@epl/core";
import Face from "./Face";

// The desk lead's picture: the benched man's face, a trade's players, or a result's scoreline.
// Nothing is borrowed: the winner's best player would picture a story we are not telling.

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
    const { pick } = lead;
    return (
      <Face
        face={{ code: pick.playerCode, name: pick.playerName, clubId: pick.clubId, position: pick.position }}
        clubs={clubs}
        rank="splash"
      />
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

/** The frame the two typographic leads stand in: ink ground and stock letters, a paper's reversed
 *  block, full-bleed on a phone and the front page's one picture ratio everywhere. */
function Band({ children }: { children: ReactNode }) {
  return <div className="bleed paper-frame flex items-center justify-center bg-ink">{children}</div>;
}
