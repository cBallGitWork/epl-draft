import TabStrip from "../../components/shell/TabStrip";
import type { Tab } from "../../components/shell/TabStrip";
import { playerDataHref, playerHref, playerNewsHref } from "../routes";

// The four views of one player: Profile, Data (his record, a season at a time), News and Transfer.

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
  /** Views with nothing behind them for this man: greyed and still a link, so no plate moves. */
  empty?: readonly PlayerTab[];
}) {
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
