import Image from "next/image";
import {
  type Club,
  type PlayerMatchStats,
  type RosteredPlayer,
  type Unresolved,
  clubColours,
  crestUrl,
  initials,
  isResolved,
  portraitUrl,
} from "@epl/core";

// One player, drawn as a 1994/95 Merlin sticker: white card, black keyline, the
// head on a flat studio green, and the name in a yellow-to-green banner.
//
// A look, not a metaphor. A roster is the one screen a manager opens every week,
// and a face is quicker to find than a row of text — that is the whole argument
// for it. Density is unaffected: the card is 78px wide.

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
  clubs,
}: {
  rostered: RosteredPlayer;
  clubs: Map<number, Club>;
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
  const club = clubs.get(player.clubId);
  const colours = clubColours(club?.shortName ?? "");
  const t = tally(stats);
  const played = stats.length > 0;

  return (
    <div
      className={`@container w-full rounded-[3px] bg-sticker-card p-[2.5px] shadow-[0_1px_0_oklch(0_0_0/0.5),0_2px_5px_oklch(0_0_0/0.35)] ${
        played ? "" : "opacity-85"
      }`}
    >
      <div className="flex flex-col overflow-hidden rounded-[1px] border border-sticker-keyline">
        <div
          className="relative block aspect-square overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--color-sticker-backdrop-from), var(--color-sticker-backdrop-to))",
          }}
        >
          {/* The ground here is the sticker's constant studio green, never the
              club's shirt, so the ink is a constant too — `inkOn` would answer
              for a colour that is not on screen and come out backwards. */}
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center font-display text-lg font-bold text-sticker-keyline opacity-90"
          >
            {initials(player.name)}
          </span>
          <Image
            src={portraitUrl(player, "250x250")}
            alt=""
            width={78}
            height={78}
            sizes="78px"
            // Merlin's four-colour print was loud and a little flat. Matching it
            // is what stops a modern cut-out headshot reading as a stock photo.
            className={`relative h-full w-full object-cover object-[center_12%] saturate-[1.12] contrast-[1.04] ${
              played ? "" : "grayscale-[0.35]"
            }`}
          />
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
            className="w-full truncate text-center font-display text-[clamp(7px,14cqw,11px)] font-bold uppercase leading-tight tracking-tight text-sticker-keyline"
          >
            {player.name}
          </span>
        </div>

        <div className="flex items-center gap-px bg-sticker-keyline px-1 py-px">
          <span className="flex gap-px">
            {t.goals > 0 ? <Chip label={t.goals > 1 ? `G×${t.goals}` : "G"} tone="goal" /> : null}
            {t.assists > 0 ? <Chip label={t.assists > 1 ? `A×${t.assists}` : "A"} tone="assist" /> : null}
            {t.cleanSheet ? <Chip label="CS" tone="assist" /> : null}
            {t.saves >= 3 ? <Chip label={`${t.saves}sv`} tone="note" /> : null}
            {t.redCards > 0 ? <Chip label="RC" tone="bad" /> : null}
            {t.redCards === 0 && t.yellowCards > 0 ? <Chip label="YC" tone="note" /> : null}
          </span>
          <span className="numeric ml-auto text-2xs font-bold text-white/80">
            {played ? `${t.minutes}'` : (club?.shortName ?? "—")}
          </span>
        </div>
      </div>
    </div>
  );
}
