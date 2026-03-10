#!/usr/bin/env bash
set -euo pipefail

# Optional SSH setup for private git dependencies/submodules in CI.
# Provide key as NETLIFY_DEPLOY_KEY environment variable.
KEY="${NETLIFY_DEPLOY_KEY:-}"

if [ -z "$KEY" ]; then
  echo "[netlify-setup-ssh] NETLIFY_DEPLOY_KEY not set; skipping SSH setup."
  exit 0
fi

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

# Support both one-line and multiline keys.
printf "%s\n" "$KEY" > "$HOME/.ssh/id_rsa"
chmod 600 "$HOME/.ssh/id_rsa"

if [ ! -f "$HOME/.ssh/known_hosts" ]; then
  touch "$HOME/.ssh/known_hosts"
  chmod 644 "$HOME/.ssh/known_hosts"
fi

ssh-keyscan -H github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null || true

cat > "$HOME/.ssh/config" <<'CFG'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
CFG
chmod 600 "$HOME/.ssh/config"

echo "[netlify-setup-ssh] SSH deploy key configured for github.com."
