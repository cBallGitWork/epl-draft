import { Suspense } from "react";
import { clubById, seasonKey } from "@epl/core";
import type { FootballPlayer, PastSeason, PlayerMatch } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { LABEL, PANEL } from "@/app/desk";
import { footballNow, seasonFixtures } from "../../../football";
import { playerMarks } from "../../../ratings";
import { intelCareers, intelStats, intelStatsDay } from "../../../intel";
import { FPL_SILENT } from "../../../config";
import QuerySelect from "../../../components/shell/QuerySelect";
import { ALL_SEASONS, playerDataHref } from "../../routes";
import MatchLog from "../MatchLog";
import PastSeasons from "../PastSeasons";
import SeasonTable from "../SeasonTable";
import SeasonCounts from "./SeasonCounts";
import HeldNote from "../HeldNote";
import NoProfile from "../NoProfile";
import PlayerShell from "../PlayerShell";
import { TableWaiting } from "../Waiting";
import { pastSeasons } from "../grid";
import { joinMatches, totalsOf } from "../matchRows";
import type { MatchRow } from "../matchRows";
import { gameLog } from "../scouting";
import { subject } from "../subject";

// His record a season at a time (Craig, 25 Sep 2026): this season's table and every match by default, a past
// season's line, or every season with his club. The old History route sends a reader to "All seasons".

export const revalidate = 30;

export default async function PlayerData({
  params,
  searchParams,
}: {
  params: Promise<{ fantraxId: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const [{ fantraxId }, { season: chosen = "" }] = await Promise.all([params, searchParams]);
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  const { intel, football } = found;

  return (
    <PlayerShell subject={found} fantraxId={fantraxId} current="data">
      {football === null ? (
        <section className={PANEL}>
          <Nothing title="No record for this man">
            Every row is FPL&apos;s measurement of a Premier League match, and FPL has never listed him.
          </Nothing>
        </section>
      ) : (
        <Suspense fallback={<TableWaiting />}>
          <Record
            player={football.player}
            fantraxId={fantraxId}
            chosen={chosen}
            paid={intel.matches}
            season={intel.season}
          />
        </Suspense>
      )}
    </PlayerShell>
  );
}

/** The picker and the season it picks, behind one boundary: the reads are shared. */
async function Record({
  player,
  fantraxId,
  chosen,
  paid,
  season,
}: {
  player: FootballPlayer;
  fantraxId: string;
  chosen: string;
  paid: PlayerMatch[];
  season: string | null;
}) {
  const [past, log, snapshot, fixtures] = await Promise.all([pastSeasons(player), gameLog(player), footballNow(), seasonFixtures()]);
  // One FPL read feeds both; when it will not answer, say so rather than print half a career.
  if (past === null || log === null) {
    return <Nothing title={FPL_SILENT} code="element-summary">His seasons will be back when FPL answers.</Nothing>;
  }
  const joined = joinMatches(log.rows, paid, clubById(snapshot), playerMarks(player.code, fixtures));
  const clubs = intelCareers.get(player.code) ?? new Map<string, string>();
  const label = season ?? "This season";
  const options = [
    { value: "", label },
    ...past.map((row) => ({ value: row.season.replace("/", "-"), label: row.season })),
    { value: ALL_SEASONS, label: "All seasons" },
  ];
  const value = options.some((option) => option.value === chosen) ? chosen : "";
  const picked = past.find((row) => row.season.replace("/", "-") === value);

  return (
    <>
      <section className={`${PANEL} lg:flex-row lg:items-center`}>
        <span className={LABEL}>Season</span>
        <div className="lg:w-64">
          <QuerySelect name="season" label="Season" value={value} options={options} action={playerDataHref(fantraxId)} />
        </div>
      </section>
      {value === ALL_SEASONS ? (
        <PastSeasons seasons={past} current={thisSeason(joined, label)} clubs={clubs} />
      ) : picked ? (
        <PastSeasons seasons={[picked]} clubs={clubs} />
      ) : (
        <>
          <SeasonTable rows={joined} season={season} club={clubs.get(seasonKey(label) ?? "") ?? null} />
          {log.heldAt === null ? null : <HeldNote at={log.heldAt} />}
          <SeasonCounts row={intelStats.get(player.code)} day={intelStatsDay} />
          <MatchLog rows={joined} />
        </>
      )}
    </>
  );
}

/** This season as one line of the career table, or null before he has played. */
function thisSeason(rows: readonly MatchRow[], season: string): PastSeason | null {
  const t = totalsOf(rows);
  if (t.minutes === 0) return null;
  return {
    season,
    minutes: t.minutes,
    goals: t.goals,
    assists: t.assists,
    cleanSheets: t.cleanSheets,
    goalsConceded: t.conceded,
    yellowCards: t.yellowCards,
    redCards: t.redCards,
    saves: t.saves,
    fplPoints: t.fplPoints,
  };
}
