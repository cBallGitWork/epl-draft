// CM's blue index block holding a date, set on two lines so the fold lands in the same place on every row.

export default function DateChip({
  day,
  time,
  className = "",
}: {
  /** The date as the caller spells it, or "GW5" where the source has no date. */
  day: string;
  /** The clock, on its own line; null for a date without one. */
  time?: string | null;
  /** The width, which only the caller can judge against the rest of its row. */
  className?: string;
}) {
  return (
    <span
      className={`cm-index numeric flex shrink-0 flex-col items-center justify-center px-1 text-center leading-tight ${className}`}
    >
      <span>{day}</span>
      {time === null || time === undefined ? null : <span>{time}</span>}
    </span>
  );
}
