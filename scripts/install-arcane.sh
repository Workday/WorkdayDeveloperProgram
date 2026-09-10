#!/usr/bin/env bash
# Installs the Arcane Auditor CLI into .arcane-auditor/bin/ (gitignored) so
# `node scripts/audit-examples.mjs` can run the same audit CI runs.
#
# Uses the install script that ships with Arcane's GitHub Action, pinned to
# the same commit the CI workflow uses, so local and CI installs match.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pin="$root/.arcane-auditor/action-ref"
ref="$(tr -d '[:space:]' < "$pin")"

url="https://raw.githubusercontent.com/${ref%@*}/${ref#*@}/.github/action/install.sh"
echo "Fetching installer from $url"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
curl -fsSL -o "$tmp" "$url"

ARCANE_INSTALL_DIR="$root/.arcane-auditor/bin" bash "$tmp"
echo
echo "Now run: node scripts/audit-examples.mjs --changed"
