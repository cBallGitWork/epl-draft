# `/news/transfers` — every move in the league

Every claim, drop and trade in the league on one page, newest first, beside Mail's inbox (Craig, 7 Oct 2026: *"need
somewhere to put all the transfers in the league … a league wide page for quick reference"*). **It is the team
Transfers tab's ledger with each row's mover named, read off the same feed, so the two can never disagree.**

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## On the page

- The Mail bar, headed as the inbox is: the reader's team and *Mail*, or *Mail* alone with no code.
- **Inbox · Transfers**, Mail's two views (`news/MailViews`). On a phone the strip stands down while a letter is
  open, as the Fantrax link beneath it does.
- The ledger (`components/league/Ledger`, no `teamId`): the date block, **the mover** on his own colour, the type
  in the info ink, who came in, who went out, and a trade's partner. Under a thumb a plate prints the league's short
  name (*DOME*); the desk prints the full one.
- No moves: *Nothing* says so, coded `0 deals`.

## Whose move a row is

A deal has no single owner in the feed: a claim names the team that gained, a bare drop only the one that let go,
and a trade both. `moverOf` (core `gazette/dealSides.ts`) takes the first team that gained, or for a bare drop the
one that let go; a trade is drawn from its first side, with the other on the partner plate, exactly as the team
page draws it from his side. Tested in `dealSides.test.ts`.

## Why Mail and not Draft

Craig's choice, 7 Oct 2026, over a seventh Draft tab (the six already fill a phone's width) and a fifth Data tab.
Mail is where a signing already arrives as a letter; the ledger is the same business as a list.
