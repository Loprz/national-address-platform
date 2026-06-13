#!/usr/bin/env bash
#
# repair-git-refs.sh
#
# Run this in a NATIVE macOS terminal (NOT inside the Cowork sandbox).
# The sandbox mount blocks file deletion and errors ("Resource deadlock
# avoided") on the corrupted ref files, so these fixes must run locally.
#
# It does two things:
#   1. mes-adresses-api: removes a stale, empty .git/index.lock left behind
#      when a commit could not clean up its lock file over the sandbox mount.
#      (The selector-endpoint commit 8f82733 itself landed fine.)
#   2. api-depot: removes the "us-port 2" cloud-sync conflict-copy ref file
#      that makes git treat the whole us-port branch as broken, then repoints
#      us-port at the correct commit (7538240) and reattaches HEAD.
#
# Safe to re-run. Review before executing.

set -euo pipefail

# --- Resolve repo root (the BaseAdresseNationale folder this script lives in) ---
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Workspace root: $ROOT"

# ── 1. mes-adresses-api: clear stale index.lock ──────────────────────────────
API_LOCK="$ROOT/mes-adresses-api/.git/index.lock"
if [ -f "$API_LOCK" ]; then
  echo "Removing stale lock: $API_LOCK"
  rm -f "$API_LOCK"
else
  echo "No stale index.lock in mes-adresses-api (already clean)."
fi
echo "mes-adresses-api status:"
git -C "$ROOT/mes-adresses-api" status -s || true
git -C "$ROOT/mes-adresses-api" log --oneline -1 || true

# ── 2. api-depot: repair the us-port branch ref ──────────────────────────────
DEPOT="$ROOT/api-depot"
US_PORT_SHA="75382405045101344bdfcdd234bbd66e10d817b9"   # 7538240, from us-port reflog

echo
echo "Repairing api-depot us-port ref..."

# Remove the conflict-copy artifact (the trailing ' 2' name is what git chokes on).
CONFLICT="$DEPOT/.git/refs/heads/us-port 2"
if [ -e "$CONFLICT" ]; then
  echo "Removing conflict ref: $CONFLICT"
  rm -f "$CONFLICT"
else
  echo "No 'us-port 2' conflict ref found (already clean)."
fi

# Clear any stale ref lockfiles left by an earlier crashed git process.
for lock in "$DEPOT/.git/refs/heads/us-port.lock" "$DEPOT/.git/HEAD.lock"; do
  if [ -e "$lock" ]; then
    echo "Removing stale lock: $lock"
    rm -f "$lock"
  fi
done

# Make sure the target commit actually exists locally before repointing.
if git -C "$DEPOT" cat-file -e "${US_PORT_SHA}^{commit}" 2>/dev/null; then
  echo "Pointing us-port at $US_PORT_SHA"
  git -C "$DEPOT" update-ref refs/heads/us-port "$US_PORT_SHA"
else
  echo "WARNING: commit $US_PORT_SHA not found in api-depot object store."
  echo "         If you have a remote, run: git -C \"$DEPOT\" fetch --all"
  echo "         then re-run this script, or set us-port to the right SHA manually."
fi

# Reattach HEAD to the branch (it was left pointing at a broken ref).
git -C "$DEPOT" symbolic-ref HEAD refs/heads/us-port

echo
echo "api-depot result:"
git -C "$DEPOT" status -s || true
git -C "$DEPOT" log --oneline -3 || true

echo
echo "Done. If api-depot still reports problems, run:"
echo "  git -C \"$DEPOT\" fsck --full"
