#!/bin/bash
# Installs the launchd jobs that run sync-intel.sh: Tuesday 08:00 weekly; Thursday 16:00, Friday 12:30 and 16:00 pressers.
# Each run executes origin/main's copy of the script, so an update lands without reinstalling. London time.
set -euo pipefail
MAIN=${EPL_DRAFT:-$HOME/epl-draft-1}
AGENTS=$HOME/Library/LaunchAgents

job() {
  local label=$1 mode=$2 times=$3
  local plist="$AGENTS/$label.plist"
  cat >"$plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string><string>-c</string>
    <string>git -C "$MAIN" fetch -q origin &amp;&amp; git -C "$MAIN" show origin/main:scripts/sync-intel.sh | /bin/bash -s $mode</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>$times</array>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/epl-draft-intel.out.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/epl-draft-intel.out.log</string>
</dict>
</plist>
PLIST
  launchctl bootout "gui/$(id -u)" "$plist" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$plist"
  echo "installed $label"
}

at() { printf '<dict><key>Weekday</key><integer>%s</integer><key>Hour</key><integer>%s</integer><key>Minute</key><integer>%s</integer></dict>' "$1" "$2" "$3"; }

job com.epl-draft.intel-weekly weekly "$(at 2 8 0)"
job com.epl-draft.intel-pressers pressers "$(at 4 16 0)$(at 5 12 30)$(at 5 16 0)"
