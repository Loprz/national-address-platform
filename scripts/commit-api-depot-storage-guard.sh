#!/usr/bin/env bash
#
# commit-api-depot-storage-guard.sh
#
# Run in a NATIVE macOS terminal (not the Cowork sandbox).
#
# Commits the finished-but-uncommitted api-depot work that was hidden while the
# us-port branch ref was broken: the local US-mode S3 storage guard + database
# fallback, the two new tests, and the .env.sample / README docs.
#
# It runs the file-module tests FIRST and only commits if they pass.
# Does not push. Safe to review before running.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPOT="$ROOT/api-depot"
cd "$DEPOT"

# Clear any stale git lock files (the Cowork sandbox mount can't unlink, so
# probes run from there leave these behind; native git removes them fine).
for lock in .git/index.lock .git/HEAD.lock .git/refs/heads/us-port.lock; do
  if [ -e "$lock" ]; then echo "Removing stale lock: $lock"; rm -f "$lock"; fi
done

echo "Branch: $(git rev-parse --abbrev-ref HEAD)   HEAD: $(git rev-parse --short HEAD)"

FILES=(
  ".env.sample"
  "README.md"
  "src/modules/file/file.service.ts"
  "src/modules/file/s3.service.ts"
  "src/modules/file/file.service.spec.ts"
  "src/modules/file/s3.service.spec.ts"
)

echo
echo "Changes to be committed:"
git status -s -- "${FILES[@]}"

echo
echo "Ensuring node_modules is materialized (iCloud may have offloaded it)..."
# Force iCloud to download any dataless placeholder files under node_modules.
if command -v brctl >/dev/null 2>&1; then
  brctl download "$DEPOT/node_modules" 2>/dev/null || true
fi
# Verify a core dep is actually readable; if not, reinstall from yarn.lock.
if ! head -c1 node_modules/@nestjs/common/index.js >/dev/null 2>&1; then
  echo "Core dependency not readable yet; reinstalling with yarn..."
  yarn install --check-files
fi

echo
echo "Running file-module tests first..."
if ! npx jest src/modules/file/file.service.spec.ts src/modules/file/s3.service.spec.ts; then
  echo
  echo "TESTS FAILED — aborting commit. Nothing was committed."
  exit 1
fi

echo
echo "Tests passed. Staging and committing..."
git add "${FILES[@]}"

git commit -m "feat(us): add local US-mode S3 guard with database fallback

In local (non-production) US validation-profile mode, skip S3 client setup when
the required S3_* env vars are missing and serve new BAL file uploads from the
database fallback path instead of requiring placeholder S3 config. FileService
now stores file content in the database when S3 is unavailable and reads it back
from there first. S3Service reports a clear 503 with a descriptive message when
S3 is intentionally disabled for local US-mode.

Documents the DB fallback / empty-S3_* local behavior in .env.sample and
README.md. Adds file.service and s3.service unit tests covering the guard and
fallback paths."

echo
echo "Done:"
git log --oneline -3
echo
echo "Not pushed. To publish:  git -C \"$DEPOT\" push origin us-port"
