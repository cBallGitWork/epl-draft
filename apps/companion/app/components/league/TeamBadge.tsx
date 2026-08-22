import Image from "next/image";
import type { LeagueTeam } from "@epl/core";

// The badge a manager picked for his own team on Fantrax — a shirt or a pair of
// keeper's gloves in his colours. Sixteen of these fit inside our one league
// crest, which is what `LeagueCrest` is and this is not.
//
// Three states, and the slot is the same size in all three so a column of names
// stays a column. A team with no badge gets its initial rather than a stand-in
// picture, for the reason the portraits give: a wrong image is worse than none,
// because only one of the two looks like an answer. A side that is not a team
// yet — a semi-final winner, a place in a table nobody holds — gets neither,
// because there is nobody to letter.

const SIZE = 26;
const SLOT = { width: SIZE, height: SIZE };

export default function TeamBadge({
  team,
  url,
}: {
  /** Null for a side nobody holds yet — a semi-final winner, a place in a table
   *  nobody occupies. Taken whole rather than as a name so this owns both null
   *  checks and no caller repeats them. */
  team: LeagueTeam | null;
  /** His badge, already looked up. A URL rather than the league's map, because
   *  one of the four callers is a client component and a `Map` does not survive
   *  the serialisation — and because looking a key up is the caller's business
   *  in the three that hold one. */
  url: string | undefined;
}) {
  if (team !== null && url !== undefined) {
    // Decorative: the name is right beside it, and a screen reader hearing the
    // team twice learns nothing the second time.
    return <Image src={url} alt="" width={SIZE} height={SIZE} style={SLOT} className="shrink-0 rounded-full" />;
  }

  return (
    <span
      aria-hidden
      style={SLOT}
      className={`grid shrink-0 place-items-center rounded-full font-display text-2xs font-bold ${
        team === null ? "border border-dashed border-line" : "bg-raised text-faint"
      }`}
    >
      {team === null ? "" : team.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
