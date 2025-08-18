#!/usr/bin/env bash
set -euo pipefail

# Ensure config dir exists
mkdir -p ~/.gemini

# If settings.json doesn't exist, create it.
if [ ! -f ~/.gemini/settings.json ]; then
  echo "Creating default ~/.gemini/settings.json for MCP."
  # Write Gemini CLI MCP config (servers start automatically when invoked)
  cat > ~/.gemini/settings.json <<'JSON'
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest"]
      },
      "github": {
        "command": "docker",
        "args": ["run","-i","--rm","-e","GITHUB_PERSONAL_ACCESS_TOKEN","ghcr.io/github/github-mcp-server"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_PERSONAL_ACCESS_TOKEN}"
        }
      },
      "git": {
        "command": "npx",
        "args": ["@cyanheads/git-mcp-server"]
      },
      "terminal": {
        "command": "npx",
        "args": ["@dillip285/mcp-terminal"]
      }
    }
  }
JSON
else
  echo "~/.gemini/settings.json already exists, skipping creation."
fi

# Optional: install Playwright browsers once so the Playwright MCP server is ready
# This will be a no-op if already installed.
npx --yes playwright install

echo "MCP servers registered for Gemini CLI. If you haven't yet, set GITHUB_PERSONAL_ACCESS_TOKEN in the container env."
