import type { Severity } from "../predictions/checks";
import { masked, ngrams, sentences } from "../predictions/prose";
import type { MatchDesk } from "./desk";
import type { ReportPiece } from "./draft";
import { surname } from "./keyStats";
import { isGoal } from "./timeline";

// Each part of a piece owns its facts (sports desk, 28 Sep 2026): the table is the standfirst's, the account tells what
// decided the match and not the bookings, a section says what the account did not, and a stake is about its own man.

type Report = (section: string, check: string, severity: Severity, evidence: string) => void;

const TABLE = /\b\d{1,2}(?:st|nd|rd|th)\b|\bbottom three\b|\brelegation zone\b|\bwithout a win\b|\bunbeaten\b|\btop of the table\b|\btop place\b|\bfirst (?:win|defeat|victory)\b/iu;
const FIXTURE = /\bnext\b|\bhost(?:s|ing)?\b|\btravel(?:s|ling)? to\b|\bgo(?:es)? to\b|\baway to\b|\bat home to\b|\bvisit(?:s)?\b/iu;
const BOOKED = /\bbooked\b|\bcautioned\b|\byellow card\b/iu;
const CHANGE = /\bcame on\b|\bsent on\b|\bmaking way\b|\bmade way\b|\breplaced\b|\bintroduced\b/iu;
const RUN = 4;

export function partFaults(code: number, piece: ReportPiece, desk: MatchDesk, fault: Report): void {
  const { match, events } = desk;
  const names = [...match.men.map((m) => m.name), ...match.men.map((m) => surname(m.name)), match.home.name, match.away.name, ...match.home.shorts, ...match.away.shorts];

  // The table is told once, in the standfirst.
  const outside = [piece.account, ...piece.sections.flatMap((s) => [s.pitch, s.stake])].join(" ");
  const table = TABLE.exec(masked(outside, names));
  if (table !== null) fault(`${code}:account`, "the table belongs to the standfirst, once", "send-back", table[0]);

  // A section says what the account did not.
  const account = ngrams(piece.account, RUN, names);
  piece.sections.forEach((s, i) => {
    const shared = [...ngrams(s.pitch, RUN, names)].find((gram) => account.has(gram));
    if (shared !== undefined) fault(`${code}:s${i + 1}`, "a section retells the account", "send-back", shared);
  });

  // A section is about a man the desk offered: it chose him for his stake.
  const offered = desk.nominees.map((n) => surname(n.man.name));
  piece.sections.forEach((s, i) => {
    if (!offered.some((name) => s.head.includes(name) || s.pitch.startsWith(name) || s.pitch.includes(name))) fault(`${code}:s${i + 1}`, "a section about a man the desk did not offer", "send-back", s.head);
  });

  // A stake is about its own man and the manager who picked him: no fixtures, no second player.
  piece.sections.forEach((s, i) => {
    if (FIXTURE.test(s.stake)) fault(`${code}:s${i + 1}`, "a fixture in a stake", "send-back", s.stake.match(FIXTURE)?.[0] ?? "");
    const own = match.men.filter((m) => s.head.includes(surname(m.name)) || s.pitch.includes(surname(m.name)));
    const others = match.men.filter((m) => !own.includes(m) && s.stake.includes(surname(m.name)));
    if (others.length > 0) fault(`${code}:s${i + 1}`, "a stake names only its own man", "send-back", surname(others[0].name));
  });

  // Bookings and routine changes are the timeline's: in the account only when they became a red, a goal or an injury.
  const sentOff = new Set(events.filter((e) => e.kind === "sent-off" || e.kind === "second-yellow").map((e) => e.man?.code));
  const decisive = new Set([
    ...events.filter((e) => isGoal(e)).flatMap((e) => [e.man?.code, e.other?.code]),
    ...events.filter((e) => e.injury).flatMap((e) => [e.man?.code, e.other?.code]),
  ]);
  for (const sentence of sentences(piece.account)) {
    const about = match.men.filter((m) => sentence.includes(surname(m.name)));
    if (BOOKED.test(sentence) && !about.some((m) => sentOff.has(m.code))) fault(`${code}:account`, "a booking in the account", "send-back", sentence.slice(0, 70));
    if (CHANGE.test(sentence) && !about.some((m) => decisive.has(m.code))) fault(`${code}:account`, "a routine change in the account", "send-back", sentence.slice(0, 70));
  }
}
