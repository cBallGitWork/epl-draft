import { emphasise } from "./emphasise";

// Paragraphs, split on blank lines; one block filed whole costs the reader only the breaks.

export default function Paragraphs({
  text,
  className,
  /** Whether the first paragraph opens on a drop cap. The lead's does and a
   *  second story's does not: a drop cap says "the prose starts here", and a
   *  page that used it four times would be saying it four times. */
  dropcap = false,
  names = [],
}: {
  text: string;
  className?: string;
  dropcap?: boolean;
  /** Footballers to set in bold wherever they appear. Empty leaves the prose
   *  exactly as filed, which is every column but the Team Sheet's. */
  names?: readonly string[];
}) {
  const paragraphs = text.split(/\n\n+/).filter((paragraph) => paragraph.trim() !== "");
  if (paragraphs.length === 0) return null;

  return (
    <div className={className}>
      {paragraphs.map((paragraph, at) => (
        <p key={at} className={at > 0 ? "pt-2.5" : dropcap ? "paper-dropcap" : undefined}>
          {emphasise(paragraph.trim(), names)}
        </p>
      ))}
    </div>
  );
}
