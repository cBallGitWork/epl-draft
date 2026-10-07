import Link from "next/link";
import { GROUPS, type GroupKey } from "@epl/core";
import { TAB } from "@/app/desk";
import Pending from "../shell/Pending";

// CM's second foot row: the stat groups, as a row of blue plates under a board.
// Navigation, so `TAB` blue rather than a grey button plate; it wraps rather than run off a narrow phone.

export default function GroupNav({
  group,
  href,
  omit = [],
}: {
  group: GroupKey;
  /** Where a group leads; each board keeps its own route. */
  href: (group: GroupKey) => string;
  /** Groups this board has no categories for, whose plates would lead nowhere. */
  omit?: readonly GroupKey[];
}) {
  return (
    <nav aria-label="Stat groups" className="flex flex-wrap">
      {GROUPS.filter((entry) => !omit.includes(entry.key)).map((entry) => (
        <Link
          key={entry.key}
          href={href(entry.key)}
          aria-current={entry.key === group ? "page" : undefined}
          className={`${TAB} cm-tab-quiet px-2 text-2xs`}
        >
          {/* The short words keep five plates on one row at 390. */}
          <span className="lg:hidden">{entry.short}</span>
          <span className="max-lg:hidden">{entry.label}</span>
          <Pending />
        </Link>
      ))}
    </nav>
  );
}
