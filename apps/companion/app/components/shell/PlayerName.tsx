import { initialled } from "@epl/core";

/** A player's name in a list: the forename as an initial under a thumb (Craig, 7 Oct 2026), `name` in full on a desk.
 *  `short` is the form to initial when `name` is FPL's whole birth name. */
export default function PlayerName({ name, short = name }: { name: string; short?: string }) {
  return (
    <>
      <span className="lg:hidden">{initialled(short)}</span>
      <span className="hidden lg:inline">{name}</span>
    </>
  );
}
