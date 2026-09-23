import { DASH } from "@epl/core";

/** A figure that is not there: the dash, quietly (DESIGN §7). */
export default function Absent() {
  return <span className="text-faint">{DASH}</span>;
}
