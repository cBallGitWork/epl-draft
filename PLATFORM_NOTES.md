# Platform notes

This file is our living season log and platform journal.
Update it whenever we make architecture decisions, discover API quirks, or
capture season-specific tradeoffs.

## Purpose

- Track what the platform is doing now versus what Fantrax is doing.
- Record design decisions that matter for next season.
- Capture unresolved questions, blockers, and follow-up work.
- Keep a shared source of truth for engineering notes.

## Current season summary

- Start date: 5 Aug 2026.
- Season target: support the 16-user Fantrax league from GW6 onwards.
- Fantrax remains authoritative for live scoring and league state.
- We are building the platform layer separately so the UI and football data can
  survive provider changes.

## Current priorities

- Keep `packages/core` clean: adapters, maps, scoring, identity.
- Keep `apps/companion` focused on the live app experience.
- Keep `apps/lab` as the future 27/28 prototype.
- Avoid building a server-side Fantrax login unless the extension/cookie flow is
  solved.

## Known constraints

- Fantrax auth is gated by reCAPTCHA + 2FA and cannot be migrated to a standard
  password flow.
- FPL player `code` is stable; FPL player `id` is season-scoped.
- Fantrax sport code for EPL is `EPL`, not `SOCCER`.

## Recorded rule exceptions

Each entry is a deliberate departure from `CODE_RULES.md`, recorded in the commit
that made it.

### `revalidate` literal in `apps/companion/app/page.tsx` (§3, no hardcoding)

Next requires a route segment's `export const revalidate` to be a statically
analysable literal, so it cannot be imported from `packages/core/src/config.ts`.
The value intentionally duplicates `REVALIDATE.live`. Both must change together;
a comment at each site says so.

### Next's `next.revalidate` inside `packages/core` (§5, framework-agnostic core) — UNRESOLVED

Both provider clients (`football/fpl/client.ts`, `league/fantrax/client.ts`) pass
Next's `next: { revalidate }` extension to `fetch`. CODE_RULES §5 says core must
carry no Next-specific options. This predates the league layer — the FPL client
shipped with it — and copying it into Fantrax makes it the third occurrence,
which is the point the rule says to act.

It is typed inline (`RequestInit & { next: … }`) rather than by importing Next's
global augmentation, so `npm run typecheck` passes and core still has no Next
dependency. That is a stopgap, not a resolution.

The real choice, still to be made: drop fetch-level caching from core and let the
route segment's `revalidate` bound upstream load (loses per-endpoint granularity —
bootstrap is 1.3 MB and would be refetched on every page revalidation), or inject
the cache policy from the edge (threads an init argument through `snapshot.ts`).

Also note: `npm run typecheck` had never passed before this — the failure was
invisible because `CLAUDE.md`'s verify section lists only `npm test` and
`npm run build`. Both now gate every commit alongside typecheck.

## Questions

- What Fantrax data should we replicate vs proxy?
- Which player identity mappings are safe to normalize once and cache?
- What should `apps/lab` look like for the 27/28 platform prototype?

## Work items

- [ ] Audit `packages/core/src/*/fpl` and `packages/core/src/*/fantrax` adapters.
- [ ] Document Fantrax method usage in `packages/core`.
- [ ] Add tests for any new mapper or adapter behavior.
- [ ] Sync season event handling with Fantrax live scoring.

## Season log

- 2026-08-05: Created `PLATFORM_NOTES.md` and improved `CLAUDE.md`.
