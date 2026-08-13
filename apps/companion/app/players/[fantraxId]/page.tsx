import { FANTRAX_LEAGUE_ID, FantraxError, fetchPlayerProfile, mapPlayerProfile } from "@epl/core";
import type { LabelledValue, PlayerIntel } from "@epl/core";
import ButtonLink from "../../components/shell/ButtonLink";
import Nothing from "../../components/shell/Nothing";
import { orRefusal, tell } from "../../refusals";
import type { Unavailable } from "../../refusals";
import Availability from "./Availability";
import Breakdown from "./Breakdown";
import { footballSelf, playerSeason } from "./season";

// One player, as Fantrax sees him. Reached by tapping a name in the pool, and
// that is the whole politeness policy: one profile per tap, never a sweep of the
// 697.

// Must match `PAGE_REVALIDATE` in core config — see the note on the home route.
export const revalidate = 30;

/** A player id that is not a player and a Fantrax that is not answering arrive as
 *  the same refusal, so this does not pretend to tell them apart with a 404. The
 *  tell goes on screen instead, which is what makes a mistyped URL diagnosable
 *  rather than mysterious. */
async function profile(fantraxId: string): Promise<PlayerIntel | Unavailable> {
  const raw = await orRefusal(fetchPlayerProfile(FANTRAX_LEAGUE_ID, fantraxId));
  return raw instanceof FantraxError ? { unavailable: tell(raw) } : mapPlayerProfile(raw);
}

/** One block of name-and-value rows. Renders nothing when the block is empty —
 *  a heading over no rows is a claim that something is missing. */
function Facts({ title, note, rows }: { title: string; note?: string; rows: LabelledValue[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h2 className="font-display text-2xs font-bold uppercase tracking-widest text-faint">
        {title}
      </h2>
      {note ? <p className="text-2xs text-faint">{note}</p> : null}
      <dl className="flex flex-col gap-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex min-h-11 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2"
          >
            {/* Fantrax's short label, with their own longer wording behind it.
                The long form is a full sentence on some rows and would wrap to
                three lines on a phone. */}
            <dt className="min-w-0 flex-1 truncate text-sm text-muted" title={row.description ?? undefined}>
              {row.label}
            </dt>
            <dd className="numeric font-bold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function PlayerPage({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const intel = await profile(fantraxId);

  if ("unavailable" in intel) {
    return (
      <Nothing title="No profile for that player" code={intel.unavailable}>
        Either Fantrax does not know that id or it is not answering. Both come back the same way,
        so this does not guess which.
      </Nothing>
    );
  }

  // Both are extras on a page that already has something to say, so both are
  // fetched after the profile has succeeded and neither can fail it.
  const [season, football] = await Promise.all([
    playerSeason(fantraxId, intel.ownerTeamId),
    footballSelf(fantraxId),
  ]);

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-0.5 pt-1">
        <h1 className="text-xl font-bold tracking-tight">{intel.name || fantraxId}</h1>
        <p className="numeric text-2xs tracking-widest text-faint">
          {[intel.clubShortName, intel.defaultPosition, intel.squadNumber && `#${intel.squadNumber}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <Availability player={football} />

      <Breakdown season={season} />

      {/* The season is named here for the same reason it is named above it: this
          block and the one this page opens with both print an FPts, and until
          the label went on they were 196 and 0 with nothing to say why. These
          are the profile's numbers, and the profile answers about a projection
          unless told otherwise. */}
      <Facts
        title={intel.season ? `In this league · ${intel.season}` : "In this league"}
        rows={intel.league}
      />

      <Facts
        title={intel.season ? `Fantrax · ${intel.season}` : "Fantrax"}
        note={
          intel.season
            ? undefined
            : "Fantrax did not say which season these describe, so read them with care."
        }
        rows={intel.highlights}
      />

      {/* The one block on this page that is not about our competition, said in
          the heading rather than in a footnote: these percentages are every
          league on Fantrax, and they sit two rows below ours. */}
      <Facts title="Across every Fantrax league" rows={intel.market} />

      <Facts title="Player" rows={intel.personal} />

      <div className="flex flex-col gap-1.5">
        {intel.ownerTeamId ? (
          <ButtonLink href={`/squad/${intel.ownerTeamId}`}>The squad he is in</ButtonLink>
        ) : null}
        <ButtonLink href="/players">Every player</ButtonLink>
      </div>
    </div>
  );
}
