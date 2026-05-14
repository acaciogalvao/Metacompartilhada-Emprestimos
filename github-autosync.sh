#!/bin/bash
# Automatic GitHub sync daemon.
# Polls for any uncommitted changes every INTERVAL seconds, then auto-commits and pushes.
# Runs as a persistent background workflow configured in .replit.

set -euo pipefail

INTERVAL="${GITHUB_SYNC_INTERVAL:-30}"
BRANCH="${GITHUB_SYNC_BRANCH:-main}"
REPO_DIR="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [github-sync] $*"; }

# Verify GITHUB_PAT is available
if [ -z "${GITHUB_PAT:-}" ]; then
  log "ERROR: GITHUB_PAT secret is not set. Auto-sync disabled."
  log "Set the GITHUB_PAT secret in Replit Secrets and restart this workflow."
  exit 1
fi

# Export GIT_ASKPASS so all git network operations use our credential helper
export GIT_ASKPASS="$REPO_DIR/github-credential-helper.sh"

# Configure git identity (idempotent, runs each startup)
git -C "$REPO_DIR" config user.email "${GITHUB_USER_EMAIL:-acaciogalvao@users.noreply.github.com}"
git -C "$REPO_DIR" config user.name "${GITHUB_USER_NAME:-Acacio Galvao}"

# Remove stored credential helper to avoid conflicts with GIT_ASKPASS
git -C "$REPO_DIR" config --unset credential.helper 2>/dev/null || true

log "GitHub auto-sync started (polling every ${INTERVAL}s, branch: ${BRANCH})."
log "All changes (new files, edits, deletes) will be committed and pushed automatically."

is_repo_busy() {
  # Returns true if a rebase, merge, cherry-pick, or revert is in progress
  for state_dir in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD rebase-merge rebase-apply; do
    [ -e "$REPO_DIR/.git/$state_dir" ] && return 0
  done
  return 1
}

push_changes() {
  local timestamp
  timestamp="$(date '+%Y-%m-%d %H:%M:%S')"

  # Skip if a merge/rebase is already in progress — avoid compounding conflicts
  if is_repo_busy; then
    log "SKIP: A merge or rebase is in progress. Resolve it manually, then sync will resume."
    return 0
  fi

  # Stage all changes: tracked modifications, new files, deletions
  git -C "$REPO_DIR" add -A

  # Check if there is anything staged
  if git -C "$REPO_DIR" diff --cached --quiet; then
    return 0
  fi

  log "Changes detected — creating auto-commit..."
  git -C "$REPO_DIR" commit -m "Auto-sync: ${timestamp}" --no-verify

  log "Pulling remote changes (rebase) before push..."
  git -C "$REPO_DIR" pull --rebase origin "$BRANCH" 2>&1 || {
    log "WARN: Pull/rebase failed — skipping push to avoid overwriting remote work."
    return 1
  }

  log "Pushing to GitHub (origin/${BRANCH})..."
  git -C "$REPO_DIR" push origin "$BRANCH" 2>&1

  log "Successfully synced to GitHub."
}

while true; do
  # Detect any change: tracked edits, new untracked files, staged changes, deletions
  STATUS="$(git -C "$REPO_DIR" status --porcelain 2>/dev/null)"
  if [ -n "$STATUS" ]; then
    push_changes || log "WARN: Sync failed this cycle; will retry next interval."
  fi

  sleep "$INTERVAL"
done
