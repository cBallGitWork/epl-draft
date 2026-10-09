import { depthLines, londonMoment, squadOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import { intelDepth, intelDepthManifest } from "../../../../intel";
import ClubShell from "../Shell";
import { leagueOpinions } from "../../../leagueOpinions";
import { poolHref } from "../../../poolHref";
import { clubOr404 } from "../club";
import DepthList from "./DepthList";
import DepthPitch from "./DepthPitch";
import ListAndPitch from "../../../../components/league/ListAndPitch";
import { PANEL, PITCH_CAPTION } from "@/app/desk";

// Who is in line for each shirt at a club: the sister repo's depth chart (Craig, 25 Sep 2026),
// dealt for the round it names.

export const revalidate = 30;

export default async function DepthPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [{ club, snapshot }, league] = await Promise.all([clubOr404(code), leagueOpinions()]);
  const chart = intelDepth.get(club.shortName);
  const players = new Map(squadOf(snapshot, club.id).map((player) => [player.code, player]));
  const playerOf = (code: number) => players.get(code) ?? null;
  const hrefOf = (code: number) => poolHref(league, code);
  const lines = chart === undefined ? [] : depthLines(chart);

  return (
    <ClubShell club={club} current="depth" empty={lines.length === 0 ? ["depth"] : []}>
      {chart === undefined || lines.length === 0 ? (
        <TabEmpty>There is no depth chart for {club.name} yet.</TabEmpty>
      ) : (
        <section className={PANEL}>
          <p className={`cm-title ${PITCH_CAPTION}`}>
            Depth chart{intelDepthManifest.gameweek === null ? "" : ` for GW${intelDepthManifest.gameweek}`} · {chart.formation}{" "}
            (last updated {londonMoment(intelDepthManifest.exportedAt)})
          </p>
          <ListAndPitch
            opens="pitch"
            list={<DepthList lines={lines} playerOf={playerOf} hrefOf={hrefOf} />}
            pitch={<DepthPitch lines={lines} playerOf={playerOf} hrefOf={hrefOf} />}
          />
        </section>
      )}
    </ClubShell>
  );
}
