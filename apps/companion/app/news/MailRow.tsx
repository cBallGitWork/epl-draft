import Link from "next/link";
import DateChip from "../components/shell/DateChip";
import { ROW_NAME } from "@/app/desk";

// One line of an inbox, Mail's and a player's News tab alike: the date in CM's blue block, the headline, and
// whatever the row says after it. The open row is on CM's red ground.

export default function MailRow({
  href,
  open,
  day,
  time,
  headline,
  wash = "",
  ink = "text-ink",
  children,
}: {
  href: string;
  /** Whether this is the item being read. */
  open: boolean;
  day: string;
  time: string | null;
  headline: string;
  /** The row's ground when it is not open (a doubt's wash). */
  wash?: string;
  /** The headline's ink. */
  ink?: string;
  /** What follows the headline: a state box, whose item it is. */
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={open ? "true" : undefined}
      className={`cm-row flex min-h-11 items-stretch gap-1.5 ${open ? "bg-league-deep" : `hover:bg-surface ${wash}`}`}
    >
      <DateChip day={day} time={time} className="w-[5.5rem] lg:w-28" />
      <span className={`flex min-w-0 flex-1 items-center py-1 pr-1.5 ${ROW_NAME} ${ink}`}>
        <span className="line-clamp-2">{headline}</span>
      </span>
      {children}
    </Link>
  );
}
