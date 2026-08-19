import Image from "next/image";
import {
  type Club,
  type Opposition,
  type PlayerMatchStats,
  type RosteredPlayer,
  type Unresolved,
  clubColours,
  crestUrl,
  isResolved,
  NOTABLE_SAVES,
} from "@epl/core";
import FixtureChip from "../football/FixtureChip";
import StickerFace from "./StickerFace";

// One player, drawn as a 1994/95 Merlin sticker: white card, black keyline, the
// head on a flat studio green, and the name in a yellow-to-green banner.
//
// A look, not a metaphor. A roster is the one screen a manager opens every week,
// and a face is quicker to find than a row of text — that is the whole argument
// for it. Density is unaffected: the card is 56px wide on the squad pitch and
// 74px on the matchday one, both set by the caller.

/** What the player has actually done this gameweek. Fantrax's own points are NOT
 *  here: `getTeamRosters` does not carry them and we do not recompute their
 *  scoring (PLAN.md — their live numbers are authoritative). So the strip shows
 *  the countable events and the minutes, which is what we genuinely know. */
function tally(stats: PlayerMatchStats[]) {
  const sum = (pick: (s: PlayerMatchStats) => number) => stats.reduce((n, s) => n + pick(s), 0);
  return {
    minutes: sum((s) => s.minutes),
    goals: sum((s) => s.goals),
    assists: sum((s) => s.assists),
    yellowCards: sum((s) => s.yellowCards),
    redCards: sum((s) => s.redCards),
    saves: sum((s) => s.saves),
    cleanSheet: stats.length > 0 && stats.every((s) => s.cleanSheet),
  };
}

/** How big the name may be, given how long it is.
 *
 *  The card is 56px wide and some of these men are called João Pedro. Truncating
 *  is the wrong trade on a squad screen — "JOÃO PE…" is two players on some
 *  rosters — so the type steps down instead and the whole name survives. Sized
 *  in container-query units so it tracks the sticker rather than the viewport. */
function nameSize(name: string): string {
  if (name.length <= 7) return "text-[clamp(8px,17cqw,13px)]";
  if (name.length <= 10) return "text-[clamp(7px,13cqw,11px)]";
  return "text-[clamp(5.5px,10cqw,9px)]";
}

/** Why there is no footballer behind the slot, in words a manager can act on. */
const WHY: Record<Unresolved, string> = {
  unmapped: "not in FPL",
  unbridged: "not mapped yet",
  absent: "dropped by FPL",
};

function Chip({ label, tone }: { label: string; tone: "goal" | "assist" | "note" | "bad" }) {
  const tones = {
    goal: "bg-accent text-bg",
    assist: "bg-info text-bg",
    note: "bg-white/15 text-white",
    bad: "bg-bad text-bg",
  } as const;
  return <span className={`numeric rounded-[2px] px-1 text-2xs font-bold ${tones[tone]}`}>{label}</span>;
}

export default function PlayerSticker({
  rostered,
  club,
  opposition,
}: {
  rostered: RosteredPlayer;
  /** His club, already looked up. The sticker draws one crest and one set of
   *  colours; handing it every club in the league so it can find them made two
   *  callers do the same lookup and a third do it twice. */
  club: Club | undefined;
  /** His club's match this round. The strip prints it while there is nothing to
   *  report, which is most of every week — and the crest in the corner already
   *  says which club he is, so repeating it there was three characters spent on
   *  something already on the card. */
  opposition?: Opposition[];
}) {
  // A slot the bridge could not settle is still a slot the manager holds, and the
  // three reasons are three different things to do about it — so it says which.
  if (!isResolved(rostered)) {
    return (
      <div className="flex aspect-[0.78] w-full flex-col items-center justify-center gap-1 rounded-[3px] border border-dashed border-white/35 bg-white/5 px-1 text-center">
        <span className="numeric text-2xs font-bold text-white/70">
          {rostered.slot.position ?? "?"}
        </span>
        <span className="text-[9px] leading-tight text-white/55">{WHY[rostered.unresolved]}</span>
      </div>
    );
  }

  const { player, stats } = rostered;
  const colours = clubColours(club?.shortName ?? "");
  const t = tally(stats);
  const played = stats.length > 0;
  // Whether anything sits to the left of the value in the strip below.
  const chips =
    t.goals > 0 ||
    t.assists > 0 ||
    t.cleanSheet ||
    t.saves >= NOTABLE_SAVES ||
    t.yellowCards > 0 ||
    t.redCards > 0;

  return (
    <div
      className={`@container w-full rounded-[3px] bg-sticker-card p-[2.5px] shadow-[0_1px_0_oklch(0_0_0/0.5),0_2px_5px_oklch(0_0_0/0.35)] ${
        played ? "" : "opacity-85"
      }`}
    >
      <div className="flex flex-col overflow-hidden rounded-[1px] border border-sticker-keyline">
        <div className="relative">
          <StickerFace player={player} club={club} played={played} />
          {club ? (
            <span
              className="absolute left-[2px] top-[2px] block h-4 w-4 rounded-[2px] p-[1px] ring-1 ring-black/40"
              style={{ backgroundColor: colours.primary }}
            >
              <Image src={crestUrl(club)} alt={club.shortName} width={14} height={14} className="h-full w-full" />
            </span>
          ) : null}
        </div>

        <div
          className="flex min-h-4 items-center justify-center px-1 py-px"
          style={{
            backgroundImage:
              "linear-gradient(100deg, var(--color-sticker-banner-from), var(--color-sticker-banner-to))",
            borderTop: "1px solid var(--color-sticker-keyline)",
          }}
        >
          <span
            className={`w-full overflow-hidden text-center font-display font-bold uppercase leading-tight tracking-[-0.02em] text-sticker-keyline ${nameSize(
              player.name,
            )}`}
          >
            {player.name}
          </span>
        </div>

        <div
          className={`flex items-center gap-px ${
            // The FDR colour is the row itself once there is nothing to report.
            // Chips and minutes need the black keyline behind them; a fixture
            // does not, and a badge on a strip this short read as a mistake.
            played ? "bg-sticker-keyline px-0.5 py-[1px]" : "bg-sticker-keyline"
          }`}
        >
          <span className="flex gap-px">
            {t.goals > 0 ? <Chip label={t.goals > 1 ? `G×${t.goals}` : "G"} tone="goal" /> : null}
            {t.assists > 0 ? <Chip label={t.assists > 1 ? `A×${t.assists}` : "A"} tone="assist" /> : null}
            {t.cleanSheet ? <Chip label="CS" tone="assist" /> : null}
            {t.saves >= NOTABLE_SAVES ? <Chip label={`${t.saves}sv`} tone="note" /> : null}
            {t.redCards > 0 ? <Chip label="RC" tone="bad" /> : null}
            {t.redCards === 0 && t.yellowCards > 0 ? <Chip label="YC" tone="note" /> : null}
          </span>
          {/* Minutes once he is on, his fixture until then. A blank gameweek has
              no fixture to name and falls back to the club code, which is at
              least true — an empty strip would read as a rendering fault.

              Centred when it is the only thing in the strip, which is its state
              all week, and pushed right once chips arrive beside it. */}
          {played ? (
            <span className={`numeric text-[0.5rem] font-bold text-white/80 ${chips ? "ml-auto" : "mx-auto"}`}>
              {t.minutes}&apos;
            </span>
          ) : (
            <FixtureChip opposition={opposition} blank={club?.shortName ?? "—"} />
          )}
        </div>
      </div>
    </div>
  );
}
