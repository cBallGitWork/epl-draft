import { londonDayAndDate } from "@epl/core";
import Note from "../../components/league/Note";
import { FPL_SILENT } from "../../config";

// His season off the sister repo's copy rather than FPL's own answer: said, with when the copy was taken.

export default function HeldNote({ at }: { at: string }) {
  return <Note>{`${FPL_SILENT}; his season as of ${londonDayAndDate(at)}.`}</Note>;
}
