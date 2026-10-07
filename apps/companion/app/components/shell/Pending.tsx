"use client";

import { useLinkStatus } from "next/link";

// A tapped link whose page is still on its way. No route draws a loading frame, so the old page holds until the new
// one lands; this marks the tap, and desk.css presses the plate it sits in. It must sit inside a `<Link>`.

export default function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <span hidden data-pending /> : null;
}
