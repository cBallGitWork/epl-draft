import OfferStrip from "./OfferStrip";
import { MAIL } from "./sections";

// Awaits the reader's open offer on the server and hands it to `OfferStrip`, or draws nothing when there is none.

export default async function OfferNow({ offer }: { offer: Promise<{ id: string; with: string | null } | null> }) {
  const open = await offer;
  if (open === null) return null;
  return <OfferStrip with={open.with} href={`${MAIL}?item=${encodeURIComponent(open.id)}`} />;
}
