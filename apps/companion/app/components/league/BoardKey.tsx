import { LABEL } from "@/app/desk";

/** A board's column key, shut under it on a phone, where a head's hover-only `title` never shows. */
export default function BoardKey({
  entries,
}: {
  entries: readonly { label: string; title: string }[];
}) {
  return (
    <details className="group lg:hidden">
      <summary
        className={`flex min-h-11 cursor-pointer list-none items-center gap-1 px-1.5 ${LABEL}`}
      >
        Key
        <span aria-hidden className="group-open:rotate-90">
          ▸
        </span>
      </summary>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-1.5 pb-2 text-2xs">
        {entries.map((entry) => (
          <div key={entry.title} className="contents">
            <dt className="numeric font-bold text-ink">{entry.label}</dt>
            <dd className="text-muted">{entry.title}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
