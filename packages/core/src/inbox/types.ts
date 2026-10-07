import type { DoubtBand } from "../football/playerState";

// The manager's inbox, CM's news screen: what happened in our league, newest first. It reports, never advises,
// and makes no read of its own. Not `news/`, which is the BBC wire with its own `NewsItem`.

/** CM's own tabs in the game's words, less "All", which is no filter rather than a category. */
export type InboxCategory = "message" | "competition" | "injury";

/** One item in the inbox. */
export interface InboxItem {
  /** Stable across polls, so a refresh keeps the selection: the source's own key, never an index. */
  id: string;
  category: InboxCategory;
  /** When it happened, an ISO instant (a Fantrax stamp read by `fantraxInstant`); null for a
   *  standing fact, the round's own result. */
  at: string | null;
  /** The round it belongs to, for an item with no date of its own; with `at`, the "when" in CM's blue block. */
  gameweek: number | null;
  /** A fact, in the fewest words that carry it: no adjective, no opinion. */
  headline: string;
  /** One or two sentences. CM's is one. */
  body: string;
  /** Who the letter is from: the desk that would actually know (the physio, the governing body), never one with
   *  an opinion. */
  from: string;
  /** What it is about when `from` does not say, such as the squad a doubt belongs to; usually null. */
  about: string | null;
  /** Whose it is, or null for something the whole league was told. */
  teamId: string | null;
  /** CM's availability box for an item about a footballer: the football layer's word (`Inj`, `Dbt`) and whether
   *  he is certainly out. Null for business and for a round. */
  mark: { label: string; out: boolean; band: DoubtBand | null } | null;
  /** Drawn on CM's red ground: about you AND bad news, never merely yours. */
  urgent: boolean;
}
