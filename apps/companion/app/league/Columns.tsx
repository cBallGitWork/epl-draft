// The table's column heads, in one place because two files print them: the page
// and the skeleton it waits behind. They were written out twice, and on 29 Aug
// only one of the two copies stopped saying W-L-T — so a reader saw the old
// heading over the new numbers for as long as Fantrax took to answer.
//
// The heads are the page's own words about what the columns MEAN, which is why
// the skeleton prints them at all: they are not part of the answer.
//
// **They head the row's first line and nothing else.** The record, games back,
// the win fraction and fantasy points moved onto a second line inside the row
// when they stopped fitting beside a name, and each carries its own word down
// there. A head over a figure that is not under it is worse than no head.

export default function Columns() {
  return (
    <div className="flex items-center gap-2 px-3 text-2xs font-bold uppercase tracking-widest text-faint">
      <span className="w-6">#</span>
      <span className="flex-1">Team</span>
      {/* Pts is the league's own, three for a win, read off Fantrax's table
          rather than counted here. */}
      <span className="numeric w-8 text-right">Pts</span>
    </div>
  );
}
