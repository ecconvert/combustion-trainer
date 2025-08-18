#!/usr/bin/env bash
set -euo pipefail

# change to repo root (assumes script is in scripts/)
cd "$(dirname "$(dirname "$0")")"

# ensure .gitignore is staged/updated
git add .gitignore || true

# remove tracked paths only if they are currently tracked
for p in .pnpm-store node_modules; do
  if git ls-files --error-unmatch "$p" >/dev/null 2>&1; then
    echo "Removing tracked $p from git index..."
    git rm -r --cached "$p" || true
  else
    echo "$p is not tracked — skipping."
  fi
done

# commit if there are staged changes
if ! git diff --cached --quiet; then
  git commit -m "chore: ignore pnpm store and node_modules (update .gitignore)"
else
  echo "No changes to commit."
fi
