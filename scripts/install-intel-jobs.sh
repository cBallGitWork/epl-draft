#!/bin/bash
# Installs the launchd jobs that run sync-intel.sh, London time: Tuesday 08:00 weekly; pressers Thursday 16:00 and
# Friday 12:30, 16:00 for the conferences and 17:45 for the squads and depth the sister's 16:30 sweep leaves.
# Each run executes origin/main's copy, so an update lands without reinstalling; a copy it cannot read is a banner.
set -euo pipefail
MAIN=${EPL_DRAFT:-$HOME/epl-draft-1}
AGENTS=$HOME/Library/LaunchAgents

job() {
  local label=$1 mode=$2 times=$3
  local plist="$AGENTS/$label.plist"
  local launch="for i in 1 2 3 4 5; do git -C '$MAIN' fetch -q origin &amp;&amp; break; sleep 30; done
script=\$(git -C '$MAIN' show origin/main:scripts/sync-intel.sh)
[ -n \"\$script\" ] || { /usr/bin/osascript -e 'display notification \"sync-intel.sh unreadable on origin/main\" with title \"epl-draft intel\"'; exit 1; }
exec /bin/bash -c \"\$script\" sync-intel $mode"
  cat >"$plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string><string>-c</string>
    <string>$launch</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>$times</array>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/epl-draft-intel.out.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/epl-draft-intel.out.log</string>
</dict>
</plist>
PLIST
  plutil -lint -s "$plist"
  launchctl bootout "gui/$(id -u)" "$plist" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$plist"
  echo "installed $label"
}

at() { printf '<dict><key>Weekday</key><integer>%s</integer><key>Hour</key><integer>%s</integer><key>Minute</key><integer>%s</integer></dict>' "$1" "$2" "$3"; }

job com.epl-draft.intel-weekly weekly "$(at 2 8 0)"
job com.epl-draft.intel-pressers pressers "$(at 4 16 0)$(at 5 12 30)$(at 5 16 0)$(at 5 17 45)"
