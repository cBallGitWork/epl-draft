import ButtonLink from "../../components/shell/ButtonLink";

// Championship Manager's foot: a pair of bevelled buttons across the bottom of
// every screen (`cm9900/11.jpg` — `Back` and `Next`).
//
// Ours are named for where they GO rather than for a direction. CM's `Next` is
// the next man in whatever list you arrived from, which is a thing the game
// knows and a stateless page does not; a `Next` that guessed would be worse than
// no `Next` at all. The rail's `←` `→` steppers already carry history on the
// desk, and a phone has the browser's own gesture.
//
// **The reference has a second foot row we still do not draw** — CM runs a strip
// of related screens (`Tactics ▸ Training ▸ Last Match ▸`) above the pair, and
// `docs/ui/reference/README.md` lists it as one of the two things every CM
// screen has and ours has none of. The tabs above carry that job here.

export default function Foot({
  ownerTeamId,
}: {
  /** Null for a free agent, and then there is no squad to go back to — the
   *  button is dropped rather than pointed at a page that would 404. */
  ownerTeamId: string | null;
}) {
  return (
    <div className="flex gap-2 pt-1">
      {ownerTeamId === null ? null : (
        <ButtonLink href={`/squad/${ownerTeamId}`} fill>
          His squad
        </ButtonLink>
      )}
      <ButtonLink href="/players" fill>
        Back to the pool
      </ButtonLink>
    </div>
  );
}
