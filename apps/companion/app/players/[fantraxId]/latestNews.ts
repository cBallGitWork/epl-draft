"use server";

import { isFantraxPlayerId } from "@epl/core";
import { now } from "../../clock";
import { playerStories } from "./dossier";
import { inbox, type NewsItem } from "./newsItems";

/** The newest story on his News tab, for the card that opens over a squad; the same cached read, one per tap. */
export async function latestNews(fantraxId: string): Promise<NewsItem | null> {
  if (!isFantraxPlayerId(fantraxId)) return null;
  return inbox(await playerStories(fantraxId, now()))[0] ?? null;
}
