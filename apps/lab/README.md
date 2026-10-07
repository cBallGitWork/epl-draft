# apps/lab — the 27/28 platform prototype

Empty, and staying empty this season (Craig, 7 Oct 2026). `docs/plans/ROADMAP.md`'s
*27/28: the decision* says why and what would open it in spring 2027.

The idea it was kept for: a draft / EPL / Football Manager hybrid. Of that, the part
nobody has built is **a player who remembers how a manager treated him** — dropped a
week after he was claimed, he comes back to that manager dearer. It is tested this
season inside the companion, off Fantrax's transactions, before any platform exists.
Caps, wages and contracts are not new (Ottoneu; Fantrax's own contract years) and wait
for a platform.

## What it inherits

`@epl/core`'s **football layer** transfers unchanged — the real Premier League does
not care who is scoring it. So do the competition engines (h2h, brackets,
schedules), the slot pricer, the roster rules and the team-code sign-in, and any
component a second consumer earns, promoted into a shared package the day it does.

## What it must build that the companion never needs

The companion *reads* someone else's truth. The platform *is* the truth. That means a
database and migrations, a settlement engine whose scores are right from week one,
waivers, trades and a draft with processing rules, and the rekey from `fantraxId` to
FPL's `code`. None of that has an analogue in a read-only viewer, so none of it should
be prototyped inside one.
