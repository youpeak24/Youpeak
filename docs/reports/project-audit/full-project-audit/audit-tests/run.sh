#!/usr/bin/env bash
# usage: bash reports/project-audit/full-project-audit/audit-tests/run.sh <suite-filter> <log-name>
# Runs one audit suite inside throw-away Firestore/Auth emulators (demo project) and frees the ports afterwards.
cd "$(dirname "$0")/../../../.." || exit 1
LOG="reports/project-audit/full-project-audit/logs/$2.txt"
powershell.exe -NoProfile -Command "Get-NetTCPConnection -LocalPort 8396,9396 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >/dev/null 2>&1
npx -y firebase-tools@13 emulators:exec --config tests/emulator/firebase.json --only firestore,auth \
  --project demo-youpeak-audit "node reports/project-audit/full-project-audit/audit-tests/run.cjs $1" > "$LOG" 2>&1
echo "exit=$?" >> "$LOG"
powershell.exe -NoProfile -Command "Get-NetTCPConnection -LocalPort 8396,9396 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }" >/dev/null 2>&1
grep -E "^(PASS|FAIL|AUDIT RESULT|     |HARNESS)" "$LOG" | cut -c1-700
