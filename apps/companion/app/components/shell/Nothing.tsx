import LeagueCrest from "./LeagueCrest";

// A page that cannot show what it exists to show, saying why; most are ordinary states, like a league not yet drafted.
// `code` is the provider's tell, kept on screen so a screenshot says which read failed.

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
        <span className="numeric border border-line px-2 py-1 text-2xs text-faint">
          {code}
        </span>
      ) : null}
    </div>
  );
}
