import TabStrip from "../../../components/shell/TabStrip";
import { MATCH_TABS, matchHref, type MatchTab } from "./matchRoutes";

export default function MatchTabs({ id, current }: { id: number; current: MatchTab }) {
  return (
    <TabStrip
      label="Match views"
      tabs={MATCH_TABS.map((tab) => ({ ...tab, href: matchHref(id, tab.key) }))}
      current={current}
      labels="word"
    />
  );
}
