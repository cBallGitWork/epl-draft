import { shortName } from "@/app/teamNames";

/** A fantasy team's name: the league's short name under a thumb, the whole name on the desk. Both render and CSS
 *  picks, as `ClubLabel` does; size, ink and truncation are the caller's. */
export default function TeamName({ teamId, name }: { teamId: string; name: string }) {
  return (
    <>
      <span className="lg:hidden">{shortName(teamId, name)}</span>
      <span className="hidden lg:inline">{name}</span>
    </>
  );
}
