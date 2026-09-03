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

/** The slot, read from `--row-badge` in `desk.css` so it can shrink with the row
 *  it heads. It was a JS constant applied as an inline style, which has no
 *  breakpoint: a 26px badge with 4px of padding round it cannot fit the 28px row
 *  a mouse gets, and no `lg:` utility could reach an attribute.
 *
 *  `BADGE_PX` stays, and is the LARGER of the two, because it is what `next/image`
 *  is told to fetch — asking for the desk's 20px and drawing 26 on a phone is a
 *  soft badge nobody thinks to blame the CSS for. */
const BADGE_PX = 26;
const BADGE_SLOT = { width: "var(--row-badge)", height: "var(--row-badge)" };

export default function TeamBadge({
  team,
  url,
}: {
  /** Null for a side nobody holds yet — a semi-final winner, a place in a table
   *  nobody occupies. Taken whole rather than as a name so this owns the letter
   *  and the dashed placeholder, and no caller draws either. */
  team: LeagueTeam | null;
  /** His badge, already looked up.
   *
   *  A URL rather than the league's map, because one of the five callers is a
   *  client component and a `Map` does not survive the serialisation. The other
   *  four hold one and index it themselves, and the two of those that can pass a
   *  null team spell that check out again on the way — which an earlier version
   *  of this docblock claimed they did not have to. They do: this owns what to
   *  DRAW when there is no team, not how to look one up. */
  url: string | undefined;
}) {
  if (team !== null && url !== undefined) {
    // Decorative: the name is right beside it, and a screen reader hearing the
    // team twice learns nothing the second time.
    return <Image src={url} alt="" width={BADGE_PX} height={BADGE_PX} style={BADGE_SLOT} className="shrink-0 rounded-full" />;
  }

  return (
    <span
      aria-hidden
      style={BADGE_SLOT}
      className={`grid shrink-0 place-items-center rounded-full font-display text-2xs font-bold ${
        team === null ? "border border-dashed border-line" : "bg-raised text-faint"
      }`}
    >
      {team === null ? "" : team.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
