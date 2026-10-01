import PremShell from "../../Shell";
import SkeletonRows from "../../../components/shell/SkeletonRows";

// The lists' own frame while FPL and Fantrax answer, so the strip already marks Data rather than the table.

export default function Loading() {
  return (
    <PremShell current="data">
      <SkeletonRows count={10} height="2.75rem" />
    </PremShell>
  );
}
