// Paragraphs, split on blank lines. The writer is told to file them that way
// and a model that files one block instead costs the reader nothing but the
// breaks — so this splits rather than validates. Extracted at its third
// consumer: the written lead, an article below it, and the columns to come.

export default function Paragraphs({
  text,
  className,
  /** Whether the first paragraph opens on a drop cap. The lead's does and a
   *  second story's does not: a drop cap says "the prose starts here", and a
   *  page that used it four times would be saying it four times. */
  dropcap = false,
}: {
  text: string;
  className?: string;
  dropcap?: boolean;
}) {
  const paragraphs = text.split(/\n\n+/).filter((paragraph) => paragraph.trim() !== "");
  if (paragraphs.length === 0) return null;

  return (
    <div className={className}>
      {paragraphs.map((paragraph, at) => (
        <p key={at} className={at > 0 ? "pt-2.5" : dropcap ? "paper-dropcap" : undefined}>
          {paragraph.trim()}
        </p>
      ))}
    </div>
  );
}
