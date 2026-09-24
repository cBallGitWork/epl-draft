"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Glyph from "./glyphs";
import { MORE, barTabs, moreOwns, owns, tabOwns, type GroupKey, type Section } from "./sections";

// The phone's navigation: CM's rail laid along the foot, a glyph over each word, and More opening a page.
// A group tab (Comps) flies out a column of squares above itself; the fly-out sits outside the tab nav.

const TAB = "relative grid min-h-14 min-w-0 grid-rows-[1.5rem_auto] content-center justify-items-center gap-y-1 px-0.5";

export default function ThumbRail({
  sections,
  pathname,
  live,
  mail,
}: {
  /** Already filtered for the round, so Live is absent between gameweeks. */
  sections: readonly Section[];
  pathname: string;
  /** Your live score, or the match clock, for the Live tab's glyph slot. */
  live: ReactNode;
  /** The unread badge, for the Mail tab's corner. */
  mail: ReactNode;
}) {
  // Open only on the page it was opened on, so any navigation closes it without an effect.
  const [opened, setOpened] = useState<{ key: GroupKey; at: string } | null>(null);
  const open = opened?.at === pathname ? opened.key : null;
  const tabs = barTabs(sections);
  const count = tabs.length + 1;
  const trigger = useRef<HTMLButtonElement>(null);
  const flyout = useRef<HTMLElement>(null);
  const fromKeyboard = useRef(false);

  useEffect(() => {
    if (open === null) return;
    if (fromKeyboard.current) {
      const links = flyout.current?.querySelectorAll<HTMLElement>("a");
      (flyout.current?.querySelector<HTMLElement>("[aria-current=page]") ?? links?.[0])?.focus();
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpened(null);
      trigger.current?.focus();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  const close = () => setOpened(null);

  return (
    <>
      <nav
        aria-label="Sections"
        className="cm-thumbrail fixed inset-x-0 bottom-0 z-50 grid auto-cols-fr grid-flow-col pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {tabs.map((tab) =>
          tab.kind === "group" ? (
            <button
              key={tab.key}
              ref={trigger}
              type="button"
              aria-expanded={open === tab.key}
              aria-controls={`flyout-${tab.key}`}
              aria-current={tabOwns(tab, pathname) ? "page" : undefined}
              className={TAB}
              onClick={(event: MouseEvent) => {
                fromKeyboard.current = event.detail === 0;
                setOpened(open === tab.key ? null : { key: tab.key, at: pathname });
              }}
            >
              <Face label={tab.label} figure={<Glyph name={tab.glyph} />} />
            </button>
          ) : (
            <Link
              key={tab.section.href}
              href={tab.section.href}
              aria-current={owns(tab.section.routes, pathname) ? "page" : undefined}
              className={TAB}
            >
              <Face
                label={tab.section.label}
                figure={tab.section.onlyDuringGameweek ? live : tab.section.glyph && <Glyph name={tab.section.glyph} />}
                badge={tab.section.glyph === "mail" ? mail : null}
                dot={tab.section.onlyDuringGameweek}
              />
            </Link>
          ),
        )}
        <Link href={MORE} aria-current={moreOwns(sections, pathname) ? "page" : undefined} className={TAB}>
          <Face label="More" figure={<Glyph name="more" />} />
        </Link>
      </nav>

      {tabs.map((tab, index) =>
        tab.kind === "group" ? (
          <nav
            key={tab.key}
            ref={open === tab.key ? flyout : undefined}
            id={`flyout-${tab.key}`}
            aria-label={tab.fullLabel}
            hidden={open !== tab.key}
            className="cm-flyout lg:hidden"
            style={{ left: `${((index + 0.5) / count) * 100}%` }}
          >
            {tab.members.map((member) => (
              <Link
                key={member.href}
                href={member.href}
                aria-current={owns(member.routes, pathname) ? "page" : undefined}
                onClick={close}
                className="cm-bevel cm-rail-plate grid size-16 content-center justify-items-center gap-y-1"
              >
                {member.glyph ? <Glyph name={member.glyph} /> : null}
                <span className="text-xs font-semibold leading-4">{member.label}</span>
              </Link>
            ))}
          </nav>
        ) : null,
      )}
      {open === null ? null : (
        <button type="button" tabIndex={-1} aria-label="Close" onClick={close} className="fixed inset-0 z-40 lg:hidden" />
      )}
    </>
  );
}

/** A tab's face: a 24px figure over a 12px word. `navfit` reads the word as the last span. */
function Face({
  label,
  figure,
  badge = null,
  dot = false,
}: {
  label: string;
  figure: ReactNode;
  badge?: ReactNode;
  dot?: boolean;
}) {
  return (
    <>
      <span className="relative flex h-6 items-center">
        {figure}
        {badge}
      </span>
      <span className="flex max-w-full items-center truncate text-xs font-semibold leading-4">
        {dot ? <span aria-hidden className="mr-1 size-[7px] shrink-0 rounded-full bg-live" /> : null}
        {label}
      </span>
    </>
  );
}
