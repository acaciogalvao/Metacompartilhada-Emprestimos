#!/bin/bash
# GIT_ASKPASS helper: called by git with a prompt string asking for username or password.
# Git passes the prompt as $1 (e.g. "Username for 'https://github.com':" or "Password for ...:")
PROMPT="${1:-}"
if echo "$PROMPT" | grep -qi "username"; then
  echo "git"
elif echo "$PROMPT" | grep -qi "password"; then
  echo "${GITHUB_PAT}"
fi
