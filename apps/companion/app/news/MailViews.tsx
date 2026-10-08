import TabStrip from "../components/shell/TabStrip";
import { MAIL } from "../components/shell/sections";
import { LEAGUE_TRANSFERS } from "./routes";

// Mail's two views: the manager's own inbox, and every move in the league (Craig, 7 Oct 2026: "a league wide page
// for quick reference").

const VIEWS = [
  { href: MAIL, label: "Inbox", key: "inbox" },
  { href: LEAGUE_TRANSFERS, label: "Transfers", key: "transfers" },
] as const;

export default function MailViews({ current }: { current: (typeof VIEWS)[number]["key"] }) {
  return <TabStrip label="Mail views" tabs={VIEWS} current={current} />;
}
