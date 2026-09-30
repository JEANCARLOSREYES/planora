#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

planora_node="$(command -v node || true)"
if [ -z "$planora_node" ]; then
  planora_bundled_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
  if [ -x "$planora_bundled_node" ]; then
    planora_node="$planora_bundled_node"
  fi
fi

if [ -z "$planora_node" ] || [ ! -f node_modules/next/dist/bin/next ]; then
  echo "Install Node.js 22.12 or newer, then follow Getting Started in README.md."
  read -r -p "Press Enter to close."
  exit 1
fi

if curl --silent --fail --max-time 2 http://127.0.0.1:3000/workspace >/dev/null; then
  open http://127.0.0.1:3000/workspace
  exit 0
fi

echo "Starting Planora. Keep this window open while using your local workspace."
echo "Once Ready appears below, open http://127.0.0.1:3000/workspace"
export PATH="$(dirname "$planora_node"):$PATH"
exec "$planora_node" node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000
