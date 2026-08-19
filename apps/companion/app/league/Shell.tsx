import PageHeader from "../components/shell/PageHeader";
import SectionNav from "./SectionNav";
import type { LeagueSection } from "./SectionNav";

// The frame every league section wears, including when it has nothing to show.
//
// The header and the nav are not decoration on an empty state: without them a
// reader who lands on the table during a Fantrax outage has no way to reach
// Schedule or Matchups, so the section becomes a dead end rather than a section
// with nothing in it. Schedule already knew this and the other two did not, which
// is exactly the kind of divergence a shared frame stops happening again.

export default function LeagueShell({
  title,
  current,
  sub,
  children,
}: {
  title: string;
  current: LeagueSection;
  sub?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <PageHeader title={title} sub={sub} />
      <SectionNav current={current} />
      {children}
    </div>
  );
}
