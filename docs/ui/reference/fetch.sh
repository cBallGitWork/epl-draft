#!/bin/bash
# Fetch the Championship Manager reference library.
#
# docs/rules/DESIGN.md §2 and the 29 Aug handover both say the CM reference was "studied
# from the game's own screenshots… not from memory of it" — and then nobody
# committed the screenshots. Every session since has been working from a prose
# summary of pixels it could not see, which is how a bevel ends up bolted to a
# modern layout and the result "looks nothing like CM".
#
# So the pictures live in the repo now, and this script records exactly how they
# were obtained so the set is reproducible and auditable.
#
# Two things that are easy to get wrong and cost an afternoon each:
#   - `.jpg` is the full-size image. `.png` under the same prefix is a THUMBNAIL.
#   - a `Referer` header naming the game page is REQUIRED; without it the CDN
#     serves a 404 body with a 404 status.
#
# The gallery slug is NOT the game-page slug — they carry different hashes. Both
# are recorded per release below.
set -euo pipefail

cd "$(dirname "$0")"

BASE="https://www.myabandonware.com/media/screenshots/c"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"

# dir | gallery slug | file prefix | game page slug | image numbers
RELEASES=(
  "cm9900|championship-manager-season-99-00-iu6|championship-manager-season-99-00|championship-manager-season-99-00-bjo|1 2 3 4 5 6 8 9 10 11 12 13 14 15 16 19 21 22 23 24 25"
  "cm3|championship-manager-3-lz2|championship-manager-3|championship-manager-3-e3u|1 2 3 4 5 6 7 8"
  "cm0102|championship-manager-season-01-02-fdv|championship-manager-season-01-02|championship-manager-season-01-02-a2h|1 2 3 4 5 6 7 8 9 10 11 12"
  "cm0001|championship-manager-season-00-01-fip|championship-manager-season-00-01|championship-manager-season-00-01-3hk|1"
)

total=0
for release in "${RELEASES[@]}"; do
  IFS='|' read -r dir gallery prefix page numbers <<< "$release"
  mkdir -p "$dir"
  referer="https://www.myabandonware.com/game/$page"
  for n in $numbers; do
    out="$dir/$(printf '%02d' "$n").jpg"
    if [ -s "$out" ]; then
      echo "  have $out"
    else
      curl -sf --max-time 30 -H "Referer: $referer" -A "$UA" \
        "$BASE/$gallery/${prefix}_$n.jpg" -o "$out"
      echo "  got  $out ($(wc -c < "$out" | tr -d ' ') bytes)"
    fi
    total=$((total + 1))
  done
done
echo "$total screenshots in $(pwd)"

# ---------------------------------------------------------------------------
# A second source, deliberately NOT downloaded.
#
#   https://gamefabrique.com/screenshots/pc/championship-manager-season-99-00-NN.jpg
#   NN = 01..17, no Referer needed, no larger variant (probed 31 Aug 2026).
#
# 344px thumbnails. Good enough to identify a screen, useless for measuring one,
# and this library exists to be measured — the README's whole argument is that a
# CM claim cites a numbered shot rather than a memory. They are recorded here
# because one of them is the ATTRIBUTE GRID, which the full-size set does not
# have: three columns of `label · 1-20 rating` over a small appearances table.
# Fetch them by hand if that screen ever needs looking at again.
#
# Both galleries above are exhausted. 99/00 numbers 7, 17, 18, 20 and everything
# past 25 return 404; so do 9-12 for CM3, 13-16 for 01/02 and 2-8 for 00/01.
# Probed 31 Aug 2026 — do not probe again.
