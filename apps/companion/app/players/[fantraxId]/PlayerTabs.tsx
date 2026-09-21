import TabStrip from "../../components/shell/TabStrip";
import type { Tab } from "../../components/shell/TabStrip";
import { POOL } from "../routes";

// The four views of one player.
//
// **Five, which is Championship Manager's own count.** CM draws
// `Profile | Injuries & Bans | Contract | Transfer | History`
// (`cm9900/11.jpg`), and each of ours answers the same question under a name a
// manager would look for:
//
//   Profile   the man — his attributes, and what he actually plays
//   Data      this season in numbers, which is the modern addition
//   News      CM's `Injuries & Bans`: can he play, and what is being said
//   Transfer  CM's `Contract` and `Transfer` together — what he cost, what he
//             is worth, and when he signed. We hold one fact about a
//             footballer's employment, and a plate over one date is a tab that
//             opens on a sentence.
//   History   his record, season by season and match by match
//
// **Fitness folded into News** (Craig, 4 Sep 2026: "Fitness could be doubled in
// with news"). They were two tabs asking one question — whether he plays — with
// FPL's availability on one and Fantrax's line about him on the other, each
// half an answer.

export type PlayerTab = "profile" | "data" | "news" | "transfer" | "history";

const TABS = (fantraxId: string): readonly (Tab & { key: PlayerTab })[] => [
  { key: "profile", href: `${POOL}/${fantraxId}`, label: "Profile" },
  { key: "data", href: `${POOL}/${fantraxId}/data`, label: "Data" },
  { key: "news", href: `${POOL}/${fantraxId}/news`, label: "News" },
  { key: "transfer", href: `${POOL}/${fantraxId}/transfer`, label: "Transfer" },
  { key: "history", href: `${POOL}/${fantraxId}/history`, label: "History" },
];

export default function PlayerTabs({
  fantraxId,
  current,
  empty = [],
}: {
  fantraxId: string;
  current: PlayerTab;
  /** Views with nothing behind them for this man — a free agent has no transfer
   *  history in our league, and a player the bridge has never settled has no
   *  profile to draw. Greyed and still a link, never removed: a strip that loses
   *  a plate moves every plate after it. */
  empty?: readonly PlayerTab[];
}) {
  // `word`, not `phrase`: every label here is one word, which is the condition
  // TabStrip's docblock names for the denser of its two sizes.
  return (
    <TabStrip
      label="Player views"
      tabs={TABS(fantraxId)}
      current={current}
      dim={empty}
      labels="word"
    />
  );
}
