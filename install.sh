#!/bin/bash
set -e

cd /c/Users/Moses\ Fernando/Documents/GitHub/project-finder

echo "=== Installing global tools ==="
if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm || true
fi

echo "=== Installing project dependencies ==="

# Reinstall dependencies
rm -rf node_modules package-lock.json pnpm-lock.yaml

npm install --no-audit --no-fund --legacy-peer-deps || (
  echo "Retrying with yarn if available..."
  npm install --no-audit --no-fund --legacy-peer-deps -g yarn || true
  yarn install --network-timeout 300000 || npm install --no-audit --no-fund --legacy-peer-deps
)

echo "=== Installation complete ==="
ls -la node_modules | head -20 || echo "Node modules check failed"
