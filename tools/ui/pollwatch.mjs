// Watch an open page poll: how often it refetches, and how often a refetch changes what is on screen.
//
//   node tools/ui/pollwatch.mjs <route> [--minutes 5] [--selector main] [--via <route>] [--team-cookie <file>]
//
// `--via` opens that route first and reaches <route> by clicking its rail link, so the layout's
// poll rate carries across a client navigation as it does for a reader.

import { connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [route] = positional;
if (!route) {
  console.error("usage: node tools/ui/pollwatch.mjs <route> [--minutes 5] [--selector main] [--via <route>] [--team-cookie <file>]");
  process.exit(1);
}

const minutes = Number(flags.minutes ?? 5);
const selector = flags.selector ?? "main";
/** A screen change counts toward a poll when it lands this soon after the poll's response. */
const CHANGE_WINDOW_MS = 5000;

const install = `(() => {
  const w = window.__pollwatch = { start: performance.now(), polls: [], changes: [] };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      const url = new URL(e.name);
      // A refresh refetches this page; the rail's prefetches of other pages carry _rsc too.
      if (url.searchParams.has("_rsc") && url.pathname === location.pathname) w.polls.push({ at: e.startTime, end: e.responseEnd, ms: e.duration });
    }
  }).observe({ type: "resource", buffered: false });
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
  let last = hash(document.querySelector(${JSON.stringify(selector)})?.textContent ?? "");
  new MutationObserver(() => {
    const now = hash(document.querySelector(${JSON.stringify(selector)})?.textContent ?? "");
    if (now !== last) { last = now; w.changes.push(performance.now()); }
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  return true;
})()`;

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));
await cdp.setViewport(390, 844);
await cdp.open(flags.via ?? route, 3500);
await cdp.js(install);
if (flags.via) {
  const clicked = await cdp.js(`(() => { const a = document.querySelector('a[href="${route}"]'); if (!a) return false; a.click(); return true; })()`);
  if (!clicked) throw new Error(`no link to ${route} on ${flags.via}`);
}

await new Promise((resolve) => setTimeout(resolve, minutes * 60_000));
const { start, polls: requests, changes } = await cdp.js("({ start: window.__pollwatch.start, polls: window.__pollwatch.polls, changes: window.__pollwatch.changes })");
cdp.close();

// A refresh also re-prefetches the rail's link to the page it is on: requests this close are one poll.
const BURST_MS = 2000;
const polls = [];
for (const request of requests) {
  const last = polls.at(-1);
  if (last !== undefined && request.at - last.at < BURST_MS) last.end = Math.max(last.end, request.end);
  else polls.push({ ...request });
}

const quantile = (values, q) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]);
};
const gaps = polls.slice(1).map((poll, i) => (poll.at - polls[i].at) / 1000);
const changed = polls.filter((poll) => changes.some((at) => at >= poll.at && at <= poll.end + CHANGE_WINDOW_MS));

console.log(`pollwatch ${flags.via ? `${flags.via} → ` : ""}${route}, ${minutes} min, watching ${selector}`);
console.log(`polls        ${polls.length} (${(polls.length / minutes).toFixed(1)}/min)`);
console.log(`first poll   ${polls.length > 0 ? `${Math.round((polls[0].at - start) / 1000)}s after install` : "never"}`);
console.log(`gap s        p50 ${quantile(gaps, 0.5) ?? "-"}  max ${gaps.length > 0 ? Math.round(Math.max(...gaps)) : "-"}`);
console.log(`rsc ms       p50 ${quantile(polls.map((p) => p.ms), 0.5) ?? "-"}  p95 ${quantile(polls.map((p) => p.ms), 0.95) ?? "-"}`);
console.log(`changed      ${changed.length}/${polls.length} polls moved the screen; ${changes.length} changes in all`);
