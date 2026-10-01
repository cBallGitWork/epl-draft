# apps/lab — the 27/28 platform prototype

Deliberately empty until the companion goes live on the real league (7 Oct 2026).

This is where the *own draft platform* gets built over the season: a draft / EPL /
Football Manager hybrid with real formations and tactics, FM-style narratives
(a player dropped off waivers who then refuses to re-sign), a soft salary cap with
wage demands, press conferences, trades, loans and scouting.

It exists now, empty, for one reason: to give that ambition somewhere to go that
is not `apps/companion`. The companion has a date; the lab does not.

## What it inherits

`@epl/core`'s **football layer** transfers unchanged — the real Premier League does
not care who is scoring it. So do the competition engines (h2h, brackets,
schedules), and any component a second consumer earns, promoted into a shared package
the day it does.

## What it must build that the companion never needs

The companion *reads* someone else's truth. The platform *is* the truth. That means
owned mutable state — a real database, migrations, and a simulation tick — for
morale, contracts, wages, scouting reports and narrative history. None of that has
an analogue in a read-only viewer, so none of it should be prototyped inside one.
