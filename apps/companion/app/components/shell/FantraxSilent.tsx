import Nothing from "./Nothing";
import { FANTRAX_SILENT } from "../../config";

/** Fantrax refused or did not answer: say so, with its tell, and draw nothing stale. */
export default function FantraxSilent({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  return (
    <Nothing title={FANTRAX_SILENT} code={code}>
      {children}
    </Nothing>
  );
}
