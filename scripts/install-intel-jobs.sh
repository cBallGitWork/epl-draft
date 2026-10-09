#!/bin/bash
# Installs the launchd jobs, London time. sync-intel.sh: Tuesday 08:00 weekly; pressers Thursday 16:00 and Friday 12:30,
# 14:00 and 15:45 for the conferences, and Thursday 17:15 and Friday 17:45 for the squads, depth and xMins the sister's
# 16:30 sweeps leave (Thursday's before Lawro at 20:00).
# Each run executes origin/main's copy, so an update lands without reinstalling; a copy it cannot read is a banner.
set -euo pipefail
MAIN=${EPL_DRAFT:-$HOME/epl-draft-1}
AGENTS=$HOME/Library/LaunchAgents

job() {
  local label=$1 script=$2 mode=$3 times=$4 log=$5
  local plist="$AGENTS/$label.plist"
  local launch="for i in 1 2 3 4 5; do git -C '$MAIN' fetch -q origin &amp;&amp; break; sleep 30; done
script=\$(git -C '$MAIN' show origin/main:scripts/$script.sh)
[ -n \"\$script\" ] || { /usr/bin/osascript -e 'display notification \"$script.sh unreadable on origin/main\" with title \"epl-draft\"'; exit 1; }
exec /bin/bash -c \"\$script\" $script $mode"
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
  <key>StandardOutPath</key><string>$HOME/Library/Logs/$log.out.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/$log.out.log</string>
</dict>
</plist>
PLIST
  plutil -lint -s "$plist"
  launchctl bootout "gui/$(id -u)" "$plist" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$plist"
  echo "installed $label"
}

at() { printf '<dict><key>Weekday</key><integer>%s</integer><key>Hour</key><integer>%s</integer><key>Minute</key><integer>%s</integer></dict>' "$1" "$2" "$3"; }

job com.epl-draft.intel-weekly sync-intel weekly "$(at 2 8 0)" epl-draft-intel
job com.epl-draft.intel-pressers sync-intel pressers "$(at 4 16 0)$(at 4 17 15)$(at 5 12 30)$(at 5 14 0)$(at 5 15 45)$(at 5 17 45)" epl-draft-intel
