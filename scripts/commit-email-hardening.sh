#!/usr/bin/env bash
#
# commit-email-hardening.sh
#
# Run in a NATIVE macOS terminal (not the Cowork sandbox).
#
# Hardens the transactional email service so a deployed environment can never
# silently drop mail:
#   - robust production/Railway detection (NODE_ENV, RAILWAY_ENVIRONMENT[_NAME],
#     and any RAILWAY_* runtime identifier) -> 503 when no transport configured
#   - a loud WARN when the local stream transport is used (dev only), so a
#     "success" with no delivery is impossible to miss
#
# Runs the email-service spec first and only commits + pushes if it passes.
# Reinstalls mes-adresses-api deps if they are missing (removed during the
# off-iCloud move). Safe to review before running.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API="$ROOT/mes-adresses-api"
cd "$API"

# Clear any stale git lock files left by sandbox probes.
for lock in .git/index.lock .git/HEAD.lock .git/refs/heads/us-port.lock; do
  [ -e "$lock" ] && { echo "Removing stale lock: $lock"; rm -f "$lock"; }
done

echo "Branch: $(git rev-parse --abbrev-ref HEAD)   HEAD: $(git rev-parse --short HEAD)"

# Node 22 per .nvmrc.
if [ -s "$HOME/.nvm/nvm.sh" ]; then . "$HOME/.nvm/nvm.sh"; nvm use 22 >/dev/null || true; fi

# Reinstall deps if missing (node_modules was cleared during the move).
if [ ! -e node_modules/.bin/jest ]; then
  echo "Installing mes-adresses-api dependencies (first run after the move)..."
  yarn install
fi

FILES=(
  "libs/shared/src/modules/transactional_email/transactional_email.service.ts"
  "libs/shared/src/modules/transactional_email/transactional_email.service.spec.ts"
)

echo
echo "Changes to be committed:"
git status -s -- "${FILES[@]}"

echo
echo "Running the email-service spec first..."
if ! npx jest transactional_email.service.spec; then
  echo
  echo "TESTS FAILED — aborting commit. Nothing was committed."
  exit 1
fi

echo
echo "Tests passed. Staging and committing..."
git add "${FILES[@]}"
git commit -m "fix(us): never silently drop transactional email in deployed envs

Harden TransactionalEmailService so a deployed environment without SMTP or
Resend configured fails loudly instead of silently using the dev stream
transport (which discards mail while resolving successfully). Production is now
detected via NODE_ENV/RAILWAY_ENVIRONMENT[_NAME] plus any RAILWAY_* runtime
identifier, and the local stream-transport path logs a WARN naming the template
and recipients. Adds tests for Railway detection and the warning."

echo
echo "Pushing..."
git push origin us-port

echo
echo "Done:"
git log --oneline -3
