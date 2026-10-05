import PhotoGround from "../../components/football/PhotoGround";
import { leagueInfo } from "../../round";
import { myTeamId } from "../../session";
import { venueOf } from "../../venues";
import { OWN } from "../routes";

// A team's five screens stand in front of its own venue, drawn here so it stays put across the tabs and their loading.
export default async function TeamLayout({
  params,
  children,
}: {
  params: Promise<{ teamId: string }>;
  children: React.ReactNode;
}) {
  const { teamId: slug } = await params;
  const teamId = slug === OWN ? await myTeamId((await leagueInfo())?.teams ?? []) : slug;

  return (
    <>
      <PhotoGround photo={teamId === null ? null : venueOf(teamId)} />
      {children}
    </>
  );
}
