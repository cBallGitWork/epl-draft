import Nothing from "../../components/shell/Nothing";
import { PANEL } from "@/app/desk";

// What every player view draws when Fantrax will not answer; an unknown id and a silent Fantrax look the same, so the
// tell goes on screen rather than a guessed 404.

export default function NoProfile({ code }: { code: string }) {
  return (
    <section className={PANEL}>
      <Nothing title="No profile for that player" code={code}>
        Either Fantrax does not know that id or it is not answering. Both come back the same way, so
        this does not guess which.
      </Nothing>
    </section>
  );
}
