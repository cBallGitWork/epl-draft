"""The sister repo's export from the data its GitHub sweep last pushed to R2, for scripts/sync-intel.sh.

    cd <sister> && .venv/bin/python <this> <sister> <out> weekly|pressers

Under the sister's sweep lock: a scoped restore, a verdict on the newest sweep, then the export into <out>.
Exits 0 fresh, 3 exported from a stale or red sweep, 1 failed; the last line printed says which.
"""

import json
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

# What the export reads that the GitHub sweep writes, and the staged FPL calendar the sweep schedule is read off.
# Never a curated zone: a restore overwrites hand edits.
ZONES = "derived,signals,match_logs,staging/understat,raw/fpl/live/bootstrap,staging/fpl/{season}"
LOCK_WAIT_S = 900
STALE = 3


def newest_report(sister: Path) -> dict | None:
    reports = sorted((sister / "data/derived/sweep_runs").glob("*/report.json"))
    return json.loads(reports[-1].read_text()) if reports else None


def stale_reason(report: dict | None, mode: str, now: datetime, due: datetime | None) -> str | None:
    """Why the newest sweep is too old or red to trust, or None. Weekly wants Tuesday morning's own sweep; pressers the
    one the sister's schedule says should have finished by now (`due`), or the last 26h when it cannot say."""
    if report is None:
        return "there is no sweep report on this Mac"
    run, finished = report.get("run_id"), report.get("finished_at")
    if report.get("green") is not True or not finished:
        return f"the newest sweep, {run}, was not green"
    if mode == "weekly":
        since = now.replace(hour=5, minute=0, second=0, microsecond=0)
    else:
        since = due if due is not None else now - timedelta(hours=26)
    if datetime.fromisoformat(finished) < since:
        return f"the newest sweep, {run}, finished at {finished[:16]}Z, before {since:%Y-%m-%d %H:%M}Z"
    return None


def main() -> int:
    sister, out, mode = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
    sys.path.insert(0, str(sister))
    from src.constants import CURRENT_SEASON_LONG
    from src.sweep.orchestration import sweep_runner
    from src.sweep.orchestration.digest import _collect_full_sweep_due

    lock = sweep_runner._wait_for_sweep_lock(sister / "logs/sweep.lock", wait_s=LOCK_WAIT_S, sleep=time.sleep)
    if lock is None:
        print(f"a sweep on this Mac held the lock for {LOCK_WAIT_S // 60} minutes", flush=True)
        return 1
    try:
        restore = subprocess.run(
            [sys.executable, "-m", "src.sweep.orchestration.s3_sync", "restore", "--zones", ZONES.format(season=CURRENT_SEASON_LONG)],
            cwd=sister,
        )
        if restore.returncode != 0:
            print(f"the restore from R2 exited {restore.returncode}", flush=True)
            return 1
        now = datetime.now(timezone.utc)
        due = _collect_full_sweep_due(sister, now)
        stale = stale_reason(newest_report(sister), mode, now, datetime.fromisoformat(due) if due else None)
        # It exits 1 on complaints it carries; the caller judges the files it wrote.
        with open(out / "export.log", "w") as log:
            subprocess.run(
                [sys.executable, "scripts/export/epl_draft_intel.py", "--out", str(out)],
                cwd=sister, stdout=log, stderr=subprocess.STDOUT,
            )
        print(f"stale: {stale}" if stale else "fresh", flush=True)
        return STALE if stale else 0
    finally:
        lock.close()


if __name__ == "__main__":
    sys.exit(main())
