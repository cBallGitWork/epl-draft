import Link from "next/link";
import { BUTTON } from "../components/shell/ButtonLink";
import { PANEL_FLUSH } from "@/app/desk";

// An inbox's frame: the list beside the open letter on a desk, keeping its own scroll. A phone shows one at a time:
// the whole list, or the letter the URL chose under a way back to the list.

export default function Mailbox({
  letter,
  back,
  children,
}: {
  letter: React.ReactNode;
  /** The list's own URL and its name, when the URL chose a letter; null shows a phone the list. */
  back: { href: string; label: string } | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:items-start lg:gap-3">
      {back === null ? null : (
        <Link href={back.href} className={`${BUTTON} gap-2 lg:hidden`}>
          <span aria-hidden>←</span>
          {back.label}
        </Link>
      )}
      <ul
        className={`${PANEL_FLUSH} cm-rows cm-scroll cm-scroll-y lg:max-h-[calc(100svh-9rem)] lg:overflow-y-auto ${
          back === null ? "" : "max-lg:hidden"
        }`}
      >
        {children}
      </ul>
      <div className={back === null ? "max-lg:hidden" : undefined}>{letter}</div>
    </div>
  );
}
