import UnreadBadge from "./UnreadBadge";

// The inbox's item ids, handed to the Mail tab's badge; the caller settles a failed read to none.

export default async function MailCount({ ids }: { ids: Promise<readonly string[]> }) {
  return <UnreadBadge ids={await ids} />;
}
