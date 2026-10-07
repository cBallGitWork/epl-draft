import Link from "@/app/components/shell/Link";
import BackPlate from "../shell/BackPlate";
import ButtonLink from "../shell/ButtonLink";
import {
  LEAGUE_NAME,
  type FootballPlayer,
  type FootballSnapshot,
  type PlayerOwner,
  adjacentGameweeks,
  isMatchdayLive,
  londonDayAndTime,
  londonTime,
} from "@epl/core";
import { speaksForNow } from "../../football";
import LeagueCrest from "../shell/LeagueCrest";
import { GAMEWEEK, LIVE } from "../shell/sections";
import MatchList from "./MatchList";
import { GAMEWEEK_HEAD, GAMEWEEK_TITLE } from "@/app/desk";
import { SQUAD } from "../../squad/routes";

// One round of football: the /gw/[gameweek] page.

export default function GameweekView({
  snapshot,
  mine,
  owners,
}: {
  snapshot: FootballSnapshot;
  /** Which of the reader's players are in each fixture; absent with no league to ask. */
  mine?: Map<number, FootballPlayer[]>;
  /** Who holds each rostered footballer, independent of `mine`: a reader who owns nobody still reads them. */
  owners?: Map<number, PlayerOwner>;
}) {
  // A match in play AND a copy fresh enough to say so: a cached snapshot keeps a fixture marked live.
  const live = isMatchdayLive(snapshot) && speaksForNow(snapshot);
  const { previous, next } = adjacentGameweeks(snapshot);
  // The deadline prints only while ahead, by the snapshot's own instant; between kickoffs the slot is empty.
  const ahead =
    snapshot.deadline !== null && Date.parse(snapshot.deadline) > Date.parse(snapshot.fetchedAt);

  return (
    <div className="flex flex-col gap-4">
      <header className={GAMEWEEK_HEAD}>
        <div className="flex items-stretch gap-2.5">
          <BackPlate fallback={LIVE} />
          <div className="flex items-center gap-2.5">
            {/* On a phone the plate takes the crest's place: plate, crest and title overflow a 390 row. */}
            <span className="flex max-lg:hidden">
              <LeagueCrest height={26} />
            </span>
            <div>
              <h1 className={GAMEWEEK_TITLE}>{LEAGUE_NAME}</h1>
              <p className="text-sm text-muted">Gameweek {snapshot.gameweek}</p>
            </div>
          </div>
        </div>
        {live ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-live">
            <span className="live-dot" />
            Live
          </span>
        ) : ahead && snapshot.deadline ? (
          /* FPL's `deadline_time`, named as FPL's: the league's own lock is later and lives in the league layer. */
          <span className="text-right text-xs text-faint">
            FPL deadline
            <br />
            <span className="numeric text-sm text-muted">
              {londonDayAndTime(snapshot.deadline)}
            </span>
          </span>
        ) : null}
      </header>

      <MatchList snapshot={snapshot} mine={mine} owners={owners} now={speaksForNow(snapshot)} />

      <nav className="flex items-center justify-between gap-3 text-sm">
        <GameweekLink gameweek={previous} label="Previous" />
        <GameweekLink gameweek={next} label="Next" align="end" />
      </nav>

      <ButtonLink href={SQUAD}>Squads</ButtonLink>

      {/* Missing stats are said, or a scoreline with no scorers reads as nobody having done anything. */}
      <p className="pt-1 text-center text-2xs text-faint">
        {snapshot.statsUnavailable
          ? "The Premier League is not serving player stats right now, so the goals and assists below are missing rather than nil."
          : `Live data from the Premier League. Updated ${londonTime(snapshot.fetchedAt)}.`}
      </p>
    </div>
  );
}

/** A round's link, or an inert placeholder at either end of the season so the other keeps its place. */
function GameweekLink({
  gameweek,
  label,
  align = "start",
}: {
  gameweek: number | null;
  label: string;
  align?: "start" | "end";
}) {
  const classes = `min-h-11 flex-1 px-3 py-2.5 lg:min-h-9 ${
    align === "end" ? "text-right" : ""
  }`;

  // A flat outline, not a plate: only a round you can reach looks pressable.
  if (gameweek === null) {
    return (
      <span className={`${classes} border border-line text-faint opacity-40`}>{label}</span>
    );
  }

  // The bevel owns its ink, so no `text-*` here: `--muted` on the grey plate is 1.5:1.
  return (
    <Link
      href={`${GAMEWEEK}/${gameweek}`}
      className={`cm-bevel ${classes} font-medium hover:brightness-110`}
    >
      {label}
      <span className="numeric"> · GW{gameweek}</span>
    </Link>
  );
}

