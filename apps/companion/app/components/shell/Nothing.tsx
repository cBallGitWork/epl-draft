import LeagueCrest from "./LeagueCrest";

// A page that cannot show what it exists to show, saying why.
//
// Five of these now: two on /squad, two on the table, one on the pool. Nearly all
// of them are ordinary states rather than faults — a league that has not drafted
// answers with no teams, no rows and no owners, and that is the state our real
// league is in until 10 Oct. They are the empty states the app is designed
// around rather than defaulted into, so they get a real panel.
//
// `code` is the provider's own tell, kept on screen deliberately: when a manager
// says "it's broken", the first useful question is which read failed and what it
// answered, and this is the difference between a screenshot that answers it and
// one that does not.

export default function Nothing({
  title,
  code,
  children,
}: {
  title: string;
  code?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <LeagueCrest variant="full" height={104} />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mx-auto max-w-xs text-sm text-muted">{children}</p>
      </div>
      {code ? (
        <span className="numeric rounded border border-line px-2 py-1 text-2xs tracking-widest text-faint">
          {code}
        </span>
      ) : null}
    </div>
  );
}
