import type {
  Club,
  Opposition,
  PlManMatch,
  PlSquadMan,
  PlTeamSheet,
  SquadPlayerDetail,
} from "@epl/core";
import PitchMarker from "../../../components/league/PitchMarker";
import PitchRows, {
  BENCH_KIT,
  FAR_INSET,
  GAP_CLASS,
  cardBasis,
  rowBudget,
  widestLine,
} from "../../../components/league/PitchRows";
import { PANEL_FLUSH } from "@/app/desk";
import { MaybeCard } from "./PlayerCardButton";
import { sheetName } from "./match";
import type { Match } from "./match";
import { joinOf, type Join } from "./sheetJoin";

// Both elevens in the shape their managers drew (`sheet.shape`), each man's face and score (Craig, 23 Sep 2026).

export default function MatchPitch({
  match,
  sheets,
  events,
  men,
  phoneSide,
}: {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  events: Map<number, PlManMatch>;
  /** Each man's card, which his tile opens. */
  men: ReadonlyMap<number, SquadPlayerDetail>;
  /** The one club a phone shows; a desk shows both. */
  phoneSide: "home" | "away";
}) {
  const join = joinOf(match);
  // One card size across both pitches, so the two elevens stand at one scale.
  const widest = Math.max(
    widestLine((sheets.home.shape ?? []).map((players) => ({ players }))),
    widestLine((sheets.away.shape ?? []).map((players) => ({ players }))),
  );
  const side = (
    key: "home" | "away",
    club: Club | undefined,
    other: Club | undefined,
    sheet: PlTeamSheet,
  ) => (
    <Side
      match={match}
      club={club}
      against={
        other === undefined
          ? undefined
          : [
              {
                club: other,
                home: key === "home",
                difficulty: null,
                fixture: match.fixture,
              },
            ]
      }
      sheet={sheet}
      events={events}
      join={join}
      widest={widest}
      men={men}
      phoneHidden={key !== phoneSide}
    />
  );

  return (
    <div className="grid min-w-0 gap-2 lg:grid-cols-2">
      {side("home", match.home, match.away, sheets.home)}
      {side("away", match.away, match.home, sheets.away)}
    </div>
  );
}

function Side({
  match,
  club,
  against,
  sheet,
  events,
  join,
  widest,
  men,
  phoneHidden,
}: {
  match: Match;
  men: ReadonlyMap<number, SquadPlayerDetail>;
  phoneHidden: boolean;
  club: Club | undefined;
  against: Opposition[] | undefined;
  sheet: PlTeamSheet;
  events: Map<number, PlManMatch>;
  join: Join;
  widest: number;
}) {
  if (sheet.shape === null) return null;
  const keeper = sheet.shape[0]?.[0];
  const cameOn = sheet.substitutes.filter(
    (man) => did(man, events)?.onAt != null,
  );
  const marker = (man: PlSquadMan) => (
    <MaybeCard
      player={man.code === null ? undefined : men.get(man.code)}
      className="block w-full text-left"
    >
      <PitchMarker
        // Null so today's injury doubt stays off a match already played; the kit comes off the club.
        player={null}
        label="?"
        name={sheetName(man, match.byCode)}
        keeper={man === keeper}
        club={club}
        opposition={against}
        points={join.points(man.code)}
        face={
          man.code === null ? undefined : { code: man.code, name: man.name }
        }
      />
    </MaybeCard>
  );

  return (
    // `pitch-match` budgets the grass so the used subs clear a phone's fold (Craig, 23 Sep 2026).
    <section
      className={`${PANEL_FLUSH} pitch-match min-w-0 ${phoneHidden ? "max-lg:hidden" : ""}`}
    >
      {/* No formation line over the grass: the shape is the picture (Craig, 23 Sep 2026: *"ditch the formation line to save space"*). */}
      <PitchRows
        rows={sheet.shape.map((players, n) => ({
          label: `Line ${n + 1}`,
          players,
        }))}
        keyOf={(man) => String(man.code ?? man.name)}
        widest={widest}
        inColumn
      >
        {(man) => (
          <Marked minute={did(man, events)?.offAt ?? null} off>
            {marker(man)}
          </Marked>
        )}
      </PitchRows>
      {/* The men who came on, under the grass at the same card width and a smaller kit. */}
      {cameOn.length === 0 ? null : (
        <ul
          aria-label="Substitutes used"
          className={`pitch-strip flex justify-center border-t border-line bg-surface py-1 ${GAP_CLASS}`}
          style={{
            paddingInline: `${FAR_INSET}%`,
            ...rowBudget(sheet.shape.length),
            ...BENCH_KIT,
          }}
        >
          {cameOn.map((man) => (
            <li
              key={man.code ?? man.name}
              className="min-w-0 shrink-0"
              style={{ flexBasis: cardBasis(Math.max(widest, cameOn.length)) }}
            >
              <Marked minute={did(man, events)?.onAt ?? null} off={false}>
                {marker(man)}
              </Marked>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function did(
  man: PlSquadMan,
  events: Map<number, PlManMatch>,
): PlManMatch | undefined {
  return man.code === null ? undefined : events.get(man.code);
}

/** A card with the minute he went off (or came on) pinned to its corner, in the sub note's amber. */
function Marked({
  minute,
  off,
  children,
}: {
  minute: number | null;
  off: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {minute === null ? null : (
        <span
          className="numeric absolute right-0 top-0 flex items-center gap-0.5 rounded-[1px] bg-bg/85 px-1 py-0.5 text-2xs font-bold leading-none text-mid"
          title={off ? `Subbed off ${minute}'` : `Came on ${minute}'`}
        >
          <svg viewBox="0 0 8 8" className="size-2 fill-current" aria-hidden>
            <path d={off ? "M0 2h8L4 7z" : "M0 6h8L4 1z"} />
          </svg>
          {minute}&prime;
        </span>
      )}
    </div>
  );
}
