import PageHeader from "../components/shell/PageHeader";
import SkeletonRows from "../components/shell/SkeletonRows";
import { NEWS } from "../titles";

// The inbox's rows, waiting on Fantrax; the letter arrives with them. The bar says the plain word a signed-out
// reader gets, and grows the manager's name once the cookie and the league are read.

export default function Loading() {
  return (
    <div className="flex flex-col gap-2">
      <PageHeader title={NEWS} />
      <SkeletonRows count={5} height="2.75rem" />
    </div>
  );
}
