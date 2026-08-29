// The table's column heads, in one place because two files print them: the page
// and the skeleton it waits behind. They were written out twice, and on 29 Aug
// only one of the two copies stopped saying W-L-T — so a reader saw the old
// heading over the new numbers for as long as Fantrax took to answer.
//
// The heads are the page's own words about what the columns MEAN, which is why
// the skeleton prints them at all: they are not part of the answer.

export default function Columns() {
  return (
    <div className="flex items-center gap-2 px-3 text-2xs font-bold uppercase tracking-widest text-faint">
      <span className="w-6">#</span>
      <span className="flex-1">Team</span>
      {/* W-D-L, in Fantrax's own column order — their header names them Win,
          Draw, Loss. The app printed "W-L-T" over the same three numbers for as
          long as every sample was "0-0-0", which is the one table where the two
          orders cannot be told apart: read on 29 Aug, a beaten side shows 0-0-1
          and not 0-1-0. */}
      <span className="numeric w-16 text-right">W-D-L</span>
      {/* FP is fantasy points scored — Fantrax's FPtsF, and the first tiebreak.
          It headed this table on its own until 29 Aug, which read as a league
          ordered by it. */}
      <span className="numeric w-12 text-right">FP</span>
      {/* And Pts is the league's own, three for a win, read off Fantrax's table
          rather than counted here. */}
      <span className="numeric w-8 text-right">Pts</span>
    </div>
  );
}
