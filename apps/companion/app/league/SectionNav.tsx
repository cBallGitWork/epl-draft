import Link from "next/link";

// The League tab holds three views of the same competition, and this is how you
// get between them.
//
// A server component, unlike the tab bar: the tab bar has to work out where it is
// from the URL because any route in the app can render it, but there are exactly
// three pages here and each of them knows which one it is. Passing that in costs
// a prop and saves shipping another component to the phone.
//
// **CM's tabs, which are bevelled and butt against each other.** They were
// rounded pills with a gap between them, which is a modern web tab and reads as
// one wherever it appears. The active one is drawn PRESSED with the accent on
// its label — the same object saying both "this is a control" and "this is the
// one you are on", which is how the game said it and is why there is no separate
// active border to keep the strip from shifting.

const SECTIONS = [
  { href: "/league", label: "Table", key: "table" },
  { href: "/league/schedule", label: "Schedule", key: "schedule" },
  { href: "/league/matchups", label: "Matchups", key: "matchups" },
] as const;

export type LeagueSection = (typeof SECTIONS)[number]["key"];

export default function SectionNav({ current }: { current: LeagueSection }) {
  return (
    <nav aria-label="League views" className="flex">
      {SECTIONS.map((section) => {
        const here = section.key === current;
        return (
          <Link
            key={section.key}
            href={section.href}
            aria-current={here ? "page" : undefined}
            // Red is the brand and the live signal and never a statement about
            // where you are, which is why the accent carries this and the
            // league's own colour does not.
            className="cm-tab flex min-h-11 items-center px-3 text-2xs font-bold uppercase tracking-wide lg:min-h-9"
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
