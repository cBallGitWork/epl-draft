import NextLink from "next/link";
import type { ComponentProps } from "react";

// Next's Link with its viewport prefetch off, the app's only Link (ESLint holds it). With no loading frames a
// prefetch fetches nothing a tap can use, and every live refresh repeats each visible one; `AutoRefresh` fetches the
// rail's tabs ahead instead. A caller can still pass `prefetch` to opt one in.

export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}
