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
import { PANEL_FLUSH, phoneShows } from "@/app/desk";
import { MaybeCard } from "./PlayerCardButton";
import { sheetName } from "./match";
import type { Match } from "./match";
import { joinOf, type Join } from "./sheetJoin";
import SubMarker from "../../../components/football/SubMarker";

// Both elevens in the shape their managers drew (`sheet.shape`), each man's kit and score (Craig, 26 Sep 2026).

export default function MatchPitch({
  match,
  sheets,
  events,
  cards,
  phoneSide,
}: {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  events: Map<number, PlManMatch>;
  /** Each man's card, which his tile opens. */
  cards: ReadonlyMap<number, SquadPlayerDetail>;
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
      cards={cards}
      phonePicked={key === phoneSide}
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
  cards,
  phonePicked,
}: {
  match: Match;
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  phonePicked: boolean;
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
      player={man.code === null ? undefined : cards.get(man.code)}
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
      />
    </MaybeCard>
  );

  return (
    // `pitch-match` budgets the grass so the used subs clear a phone's fold (Craig, 23 Sep 2026).
    <section
      className={`${PANEL_FLUSH} pitch-match min-w-0 ${phoneShows(phonePicked)}`}
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
          <SubMarker minute={did(man, events)?.offAt ?? null} off>
            {marker(man)}
          </SubMarker>
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
              <SubMarker minute={did(man, events)?.onAt ?? null} off={false}>
                {marker(man)}
              </SubMarker>
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
