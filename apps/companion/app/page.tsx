import { redirect } from "next/navigation";
import { duringGameweek, getFootballSnapshot } from "@epl/core";

// A placeholder for the Gazetta, which will live here and lead with whatever the
// day deserves. Until it lands, the front door opens on whichever section a
// reader most likely came for: the football while it is on, the league when it
// is not. Ten lines, deleted the day the newspaper arrives.

// Must match `PAGE_REVALIDATE` in core config — see the note on /matchday.
export const revalidate = 30;

export default async function HomePage() {
  const snapshot = await getFootballSnapshot();
  redirect(duringGameweek(snapshot, new Date().toISOString()) ? "/matchday" : "/league");
}
