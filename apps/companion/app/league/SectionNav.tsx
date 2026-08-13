import Link from "next/link";

// The League tab holds three views of the same competition, and this is how you
// get between them.
//
// A server component, unlike the tab bar: the tab bar has to work out where it is
// from the URL because any route in the app can render it, but there are exactly
// three pages here and each of them knows which one it is. Passing that in costs
// a prop and saves shipping another component to the phone.

const SECTIONS = [
  { href: "/league", label: "Table", key: "table" },
  { href: "/league/schedule", label: "Schedule", key: "schedule" },
  { href: "/league/matchups", label: "Matchups", key: "matchups" },
] as const;

type LeagueSection = (typeof SECTIONS)[number]["key"];

export default function SectionNav({ current }: { current: LeagueSection }) {
  return (
    <nav aria-label="League views" className="flex gap-1 px-3">
      {SECTIONS.map((section) => {
        const here = section.key === current;
        return (
          <Link
            key={section.key}
            href={section.href}
            aria-current={here ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-lg px-3 text-2xs font-bold uppercase tracking-widest ${
              here ? "bg-league text-cream" : "text-faint hover:bg-raised hover:text-muted"
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
