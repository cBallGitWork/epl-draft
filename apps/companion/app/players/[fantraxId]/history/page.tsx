import { redirect } from "next/navigation";
import { ALL_SEASONS, playerDataHref } from "../../routes";

// History folded into Data on 25 Sep 2026; an old link lands on every season with its club.
export default async function PlayerHistory({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  redirect(playerDataHref(fantraxId, ALL_SEASONS));
}
