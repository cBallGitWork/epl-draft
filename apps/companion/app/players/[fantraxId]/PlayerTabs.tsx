import TabStrip from "../../components/shell/TabStrip";
import type { Tab } from "../../components/shell/TabStrip";
import { playerDataHref, playerHref, playerNewsHref } from "../routes";

// The four views of one player: Profile (the man), Data (his record, a season at a time), News
// (CM's Injuries & Bans) and Transfer (CM's Contract and Transfer). History folded into Data on
// 25 Sep 2026 (Craig: "maybe we merge data and history together").

export type PlayerTab = "profile" | "data" | "news" | "transfer";

const TABS = (fantraxId: string): readonly (Tab & { key: PlayerTab })[] => [
  { key: "profile", href: playerHref(fantraxId), label: "Profile" },
  { key: "data", href: playerDataHref(fantraxId), label: "Data" },
  { key: "news", href: playerNewsHref(fantraxId), label: "News" },
  { key: "transfer", href: `${playerHref(fantraxId)}/transfer`, label: "Transfer" },
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
