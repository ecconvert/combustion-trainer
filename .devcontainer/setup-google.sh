#!/usr/bin/env bash
set -euo pipefail

echo "[google-setup] Installing Google Cloud CLI..."
# Debian/Ubuntu inside the Node devcontainer
sudo apt-get update -y
sudo apt-get install -y curl apt-transport-https ca-certificates gnupg
curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/google-cloud.gpg
echo "deb [signed-by=/usr/share/keyrings/google-cloud.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
  | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list >/dev/null
sudo apt-get update -y
sudo apt-get install -y google-cloud-cli

echo "[google-setup] Installing Gemini CLI..."
npm -g i @google/gemini-cli

echo "[google-setup] Ensuring ~/.gemini/settings.json exists..."
mkdir -p ~/.gemini

# If you already have a settings.json, don’t clobber it
if [ ! -f ~/.gemini/settings.json ]; then
  cat > ~/.gemini/settings.json <<'JSON'
{
  "defaultModel": "gemini-1.5-flash",
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
  echo "[google-setup] Wrote ~/.gemini/settings.json"
else
  echo "[google-setup] Found existing ~/.gemini/settings.json; leaving it as-is"
fi

echo "[google-setup] Installing Playwright browsers (safe to re-run)..."
npx --yes playwright install

echo "[google-setup] Done."
