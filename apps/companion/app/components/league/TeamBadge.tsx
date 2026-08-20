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
  badges,
}: {
  /** Null for a side nobody holds yet — a semi-final winner, a place in a table
   *  nobody occupies. Taken whole rather than as a name and a URL so the two
   *  call sites stop writing the same pair of null checks. */
  team: LeagueTeam | null;
  badges: Map<string, string>;
}) {
  const url = team === null ? undefined : badges.get(team.teamId);

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
