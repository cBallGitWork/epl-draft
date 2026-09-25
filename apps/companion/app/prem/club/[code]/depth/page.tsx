import { depthLines, londonDayAndDate, squadOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import { intelDepth, intelDepthManifest } from "../../../../intel";
import ClubShell from "../Shell";
import { clubOr404 } from "../club";
import DepthList from "./DepthList";
import DepthPitch from "./DepthPitch";
import DepthViews from "./DepthViews";

// Who is in line for each shirt at a club: the sister repo's depth chart (Craig, 25 Sep 2026: "new
// section - depth chart, use the depth chart from sister repo"), dealt for the round it names.

export const revalidate = 30;

export default async function DepthPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot } = await clubOr404(code);
  const chart = intelDepth.get(club.shortName);
  const players = new Map(squadOf(snapshot, club.id).map((player) => [player.code, player]));
  const playerOf = (code: number) => players.get(code) ?? null;
  const lines = chart === undefined ? [] : depthLines(chart);

  return (
    <ClubShell club={club} current="depth" empty={lines.length === 0 ? ["depth"] : []}>
      {chart === undefined || lines.length === 0 ? (
        <TabEmpty>There is no depth chart for {club.name} yet.</TabEmpty>
      ) : (
        <section className="cm-panel flex flex-col gap-2 p-2">
          <p className="cm-title text-center font-chrome text-2xs font-bold text-accent lg:text-sm">
            Depth chart{intelDepthManifest.gameweek === null ? "" : ` for GW${intelDepthManifest.gameweek}`} · {chart.formation}{" "}
            (last updated {londonDayAndDate(intelDepthManifest.exportedAt)})
          </p>
          <DepthViews list={<DepthList lines={lines} playerOf={playerOf} />} pitch={<DepthPitch lines={lines} playerOf={playerOf} />} />
        </section>
      )}
    </ClubShell>
  );
}
