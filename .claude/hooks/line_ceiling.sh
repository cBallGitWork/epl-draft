#!/bin/bash
# PostToolUse note for Write|Edit.
# CODE_RULES §4 sets a soft ceiling at 200 lines and a hard one at 300. It is the
# one rule with no gate behind it — tests, typecheck, lint and build all pass a
# 900-line file — so the only thing that ever enforced it was somebody noticing.
# This notices. It reports; it does not block, because the split is a judgement
# about responsibilities and this hook has no view on those.
set -euo pipefail

input=$(cat)
path=$(printf '%s' "$input" | /usr/bin/jq -r '.tool_input.file_path // empty')
[ -z "$path" ] && exit 0
[ -f "$path" ] || exit 0

case "$path" in
  *.ts|*.tsx|*.mjs|*.js|*.css) ;;
  *) exit 0 ;;
esac

lines=$(wc -l < "$path" | tr -d ' ')
root="${CLAUDE_PROJECT_DIR:-$PWD}"
rel="${path#"$root"/}"

note=""
if [ "$lines" -gt 300 ]; then
  note="$rel is now ${lines} lines — past the 300-line HARD ceiling in CODE_RULES §4. Split it before committing, or record the exception in PLATFORM_NOTES.md in the same commit. One responsibility per file: client.ts (I/O), map.ts (pure transform), types.ts, selectors.ts."
elif [ "$lines" -gt 250 ]; then
  note="$rel is ${lines} lines — past the 200-line soft ceiling and closing on the 300 hard one (CODE_RULES §4). Worth splitting now, while you know what the pieces are."
fi

[ -z "$note" ] && exit 0

/usr/bin/jq -n --arg ctx "$note" \
  '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$ctx}}'
exit 0
