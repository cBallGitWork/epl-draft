import Measures from "./Measures";
import type { Found } from "./overWindow";
import { playerGrid } from "../[fantraxId]/grid";

/** The two attribute grids, read behind the page's Suspense boundary. */
export default async function Grids({ left, right, names }: { left: Found; right: Found | null; names: { a: string; b: string | null } }) {
  const [gridA, gridB] = await Promise.all([
    left.football ? playerGrid(left.football.player).then((grid) => grid.attributes) : Promise.resolve([]),
    right?.football ? playerGrid(right.football.player).then((grid) => grid.attributes) : Promise.resolve([]),
  ]);
  return <Measures a={gridA} b={gridB} names={names} />;
}
