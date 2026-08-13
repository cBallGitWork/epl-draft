import Link from "next/link";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import { getLeaguePool } from "./pool";

// Every player Fantrax knows, and what our league has decided about him: what he
// may be played as, whether anyone can sign him, and whose team he is on.
//
// Filtering happens in the URL rather than in browser state. A server component
// stays a server component, the whole pool never crosses to the phone as data,
// and a manager can send someone a link to exactly what he is looking at.

// Must match `PAGE_REVALIDATE` in core config — see the note on the home route.
export const revalidate = 30;

/** Fantrax's status codes in the manager's words. Theirs is the vocabulary, so
 *  anything we have not seen shows as the raw code rather than as a guess — an
 *  undrafted league marks all 697 "WW", and a fourth letter would appear here
 *  before it appeared in this file. */
const STATUS: Record<string, string> = {
  FA: "Free agent",
  WW: "Waivers",
  T: "Rostered",
};

function chip(active: boolean): string {
  return `flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium ${
    active ? "border-accent text-ink" : "border-line text-muted hover:bg-raised"
  }`;
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pos?: string; status?: string }>;
}) {
  const [pool, query] = await Promise.all([getLeaguePool(), searchParams]);

  if ("unavailable" in pool) {
    return (
      <Nothing title="Fantrax is not answering" code={pool.unavailable}>
        The player pool is Fantrax&apos;s and we cannot read it right now. Ownership is the part
        that would go stale first, so this shows nothing rather than yesterday&apos;s.
      </Nothing>
    );
  }

  const q = (query.q ?? "").trim();
  const needle = q.toLowerCase();
  const shown = pool.players.filter(
    (entry) =>
      (!query.status || entry.status === query.status) &&
      (!query.pos || entry.eligiblePositions.includes(query.pos)) &&
      (!needle || entry.player.displayName.toLowerCase().includes(needle)),
  );

  const counted = new Map<string, number>();
  for (const entry of pool.players) {
    // Skipped rather than counted under a blank label: a player our league has
    // said nothing about is still listed, he simply has no status to filter by.
    if (entry.status) counted.set(entry.status, (counted.get(entry.status) ?? 0) + 1);
  }

  const current = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) current.set(key, value);

  /** Tapping the filter you are already on clears it, so every chip is its own
   *  way back and the page needs no "all" button to undo itself. */
  function toggle(key: string, value: string): string {
    const next = new URLSearchParams(current);
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    const search = next.toString();
    return search ? `/players?${search}` : "/players";
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Players"
        sub={
          <>
            {shown.length} of {pool.players.length}
          </>
        }
      />

      <form action="/players" className="flex gap-1.5">
        {/* The chips and the box filter the same list, so each has to carry the
            other's state — a GET form posts only its own fields. */}
        {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
        {query.pos ? <input type="hidden" name="pos" value={query.pos} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Find a player"
          aria-label="Find a player"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-base"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg border border-line px-3 text-sm font-medium hover:bg-raised"
        >
          Find
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {[...counted.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([code, count]) => (
            <Link
              key={code}
              href={toggle("status", code)}
              aria-current={query.status === code ? "true" : undefined}
              className={chip(query.status === code)}
            >
              {STATUS[code] ?? code}
              <span className="numeric text-2xs text-faint">{count}</span>
            </Link>
          ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pool.positions.map((position) => (
          <Link
            key={position}
            href={toggle("pos", position)}
            aria-current={query.pos === position ? "true" : undefined}
            className={chip(query.pos === position)}
          >
            {position}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-muted">
          Nobody in the pool matches that. Tap a filter again to clear it.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {shown.map((entry) => {
            const owner = entry.ownerTeamId
              ? (pool.teamNames.get(entry.ownerTeamId) ?? entry.ownerTeamId)
              : null;
            return (
              <li key={entry.player.fantraxId}>
                <Link
                  href={`/players/${entry.player.fantraxId}`}
                  className="flex min-h-11 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 hover:bg-raised"
                >
                  {/* The league's eligibility, not the pool's single position:
                      "F/M" is what the commissioner set and what the planner
                      obeys, and the global pool's letter is a different league's
                      answer. */}
                  <span className="numeric w-9 text-2xs tracking-widest text-faint">
                    {entry.eligiblePositions.join("/") || "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {entry.player.displayName}
                  </span>
                  <span className="numeric text-2xs tracking-widest text-faint">
                    {entry.player.clubCode ?? "—"}
                  </span>
                  {owner ? (
                    <span className="max-w-28 truncate rounded bg-raised px-1.5 py-0.5 text-2xs font-bold text-mid">
                      {owner}
                    </span>
                  ) : (
                    <span className="text-2xs text-faint">
                      {STATUS[entry.status] ?? entry.status}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
