import { clubById, isGoalkeeper, playerByCode, DASH, type FootballSnapshot, type PublishedStory, type StorySheetSide } from "@epl/core";
import PitchMarker from "../league/PitchMarker";
import PitchRows from "../league/PitchRows";
import { yoursInk } from "../../mine";

// Team news at the lock, a head-to-head at a time: each side's paragraph, then its eleven on the
// grass and its bench, as the BBC prints a side before kickoff. The names are printed, not written;
// where the two sides meet on the pitch is woven into the paragraphs.

/** The order a sheet reads down the grass, keeper first; the slot is Fantrax's, never his position. */
const LINES = ["G", "D", "M", "F"];

export default function Sheets({
  story,
  named,
  mine,
  snapshot,
}: {
  story: PublishedStory;
  named: (teamId: string) => string;
  mine: string | null;
  /** For each man's face and kit; without it every man stands in an empty slot. */
  snapshot: FootballSnapshot | null;
}) {
  const ties = story.extras?.sheets ?? [];
  if (ties.length === 0) return null;
  const players = snapshot === null ? new Map() : playerByCode(snapshot);
  const clubs = snapshot === null ? new Map() : clubById(snapshot);
  const side = (each: StorySheetSide) => <Side side={each} named={named} mine={mine} players={players} clubs={clubs} />;

  return (
    <div className="flex flex-col divide-y pt-4" style={{ borderColor: "var(--paper-rule)" }}>
      {ties.map((tie) => (
        <section key={`${tie.home.teamId}-${tie.away.teamId}`} className="py-4">
          <h3 className="paper-display text-xl leading-tight font-semibold text-ink">
            <span className={yoursInk(tie.home.teamId === mine)}>{named(tie.home.teamId)}</span>
            <span className="text-muted"> v </span>
            <span className={yoursInk(tie.away.teamId === mine)}>{named(tie.away.teamId)}</span>
          </h3>
          {/* Stacked on a phone; side by side at a desk, where one paragraph across the sheet is too long a line. */}
          <div className="grid @3xl:grid-cols-2 @3xl:gap-x-8">
            {side(tie.home)}
            {side(tie.away)}
          </div>
        </section>
      ))}
    </div>
  );
}

function Side({
  side,
  named,
  mine,
  players,
  clubs,
}: {
  side: StorySheetSide;
  named: (teamId: string) => string;
  mine: string | null;
  players: ReturnType<typeof playerByCode>;
  clubs: ReturnType<typeof clubById>;
}) {
  const rows = LINES.map((slot) => ({ label: slot, players: side.xi.filter((man) => man.slot === slot) })).filter((row) => row.players.length > 0);
  return (
    <div className="flex flex-col gap-2 pt-3">
      <p className="text-base leading-snug text-ink">{side.line}</p>
      <p className="font-sans text-2xs tracking-widest text-muted uppercase">
        <span className={yoursInk(side.teamId === mine)}>{named(side.teamId)}</span> XI{side.formation === null ? "" : ` · ${side.formation}`}
      </p>
      <PitchRows rows={rows} keyOf={(man) => String(man.code)} inColumn>
        {(man) => {
          const player = players.get(man.code) ?? null;
          return (
            <PitchMarker
              player={player}
              label={man.slot}
              name={man.name}
              keeper={isGoalkeeper(man.slot)}
              club={player === null ? undefined : clubs.get(player.clubId)}
              // His real match as it stood at the deadline, so an old sheet never shows next week's.
              band={man.against === null ? DASH : `v ${man.against}`}
              // His photograph, as the match pitch draws him; the kit stands in where there is none.
              face={player ?? undefined}
              // A sheet as it stood at the lock: today's INJ/DBT box is the desk's word, not the paper's.
              stateBox={false}
            />
          );
        }}
      </PitchRows>
      {side.bench.length === 0 ? null : (
        <p className="text-base leading-snug text-muted">
          <strong className="font-bold">Substitutes:</strong> {side.bench.map((man) => man.name).join(", ")}.
        </p>
      )}
    </div>
  );
}
