import { filed } from "../../../paper";
import { PAPER_NAME } from "../../../config";
import { SHARE_CARD, shareCard } from "../../../shareCard";

// The card a shared article link previews with.

export const size = SHARE_CARD;
export const contentType = "image/png";
export const alt = PAPER_NAME;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const story = filed.find((each) => each.slug === slug);
  return shareCard(story ?? { headline: PAPER_NAME, edition: "", image: null });
}
