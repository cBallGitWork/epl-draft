import { Suspense } from "react";
import OutLink from "../../../components/shell/OutLink";
import { readerTeamId } from "../../../squads";
import { STATUS } from "../../status";
import { StackWaiting } from "../Waiting";
import Moves from "../Moves";
import NoProfile from "../NoProfile";
import { DraftLine } from "../Pedigree";
import PlayerShell from "../PlayerShell";
import TransferStatus from "../TransferStatus";
import { playerPedigree } from "../draft";
import { fantraxExit } from "../fantraxExit";
import { arrival, playerMoves } from "../dossier";
import { subject } from "../subject";
import type { Subject } from "../subject";

// Championship Manager's Transfer tab, for our league (Craig, 25 Sep 2026: "improve this page so
// its more CM like"): his transfer status, his business as a table, how he arrived in cyan at the
// foot, and the way out to Fantrax worded for what a reader can do with him.

export const revalidate = 30;

export default async function PlayerTransfer({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  return (
    <PlayerShell subject={found} fantraxId={fantraxId} current="transfer">
      {/* Streamed: the pedigree reads the pool and the moves the league's transaction feed. */}
      <Suspense fallback={<StackWaiting />}>
        <Business found={found} fantraxId={fantraxId} />
      </Suspense>
    </PlayerShell>
  );
}

/** Everything under the strip, behind one boundary: the panel needs both reads the table and the line do. */
async function Business({ found, fantraxId }: { found: Subject; fantraxId: string }) {
  const [{ pedigree, drafterName }, { moves, whole }, reader] = await Promise.all([
    playerPedigree(fantraxId),
    playerMoves(fantraxId),
    readerTeamId(),
  ]);
  const owner = found.intel.ownerTeamId;
  const status = found.intel.league.find((row) => row.label === "Status/Team")?.value?.trim() ?? "";
  const holder = found.ownerName ?? (STATUS[status] ?? (status || null));
  const exit = fantraxExit(fantraxId, owner, reader);

  return (
    <>
      <TransferStatus holder={holder} arrival={arrival(moves, owner, whole)} pedigree={pedigree} />
      <Moves moves={moves} />
      <DraftLine pedigree={pedigree} drafterName={drafterName} />
      <OutLink href={exit.href}>{exit.label}</OutLink>
    </>
  );
}
