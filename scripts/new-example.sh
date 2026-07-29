#!/usr/bin/env bash
# Creates a new example folder from examples/_template. Same job as
# new-example.mjs, for machines without Node.
#
#   ./scripts/new-example.sh my-example-name
#   ./scripts/new-example.sh my-example-name --type "Orchestration" --title "My Example"

set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

name="${1:-}"
if [ -z "$name" ] || [[ "$name" == --* ]]; then
  echo 'Usage: ./scripts/new-example.sh <folder-name> [--type "Extend App"] [--title "My Example"]' >&2
  exit 1
fi
shift

type=""
title=""
while [ $# -gt 0 ]; do
  case "$1" in
    --type) type="${2:-}"; shift 2 ;;
    --title) title="${2:-}"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

name_pattern='^[a-z0-9][a-z0-9-]*$'
if ! [[ "$name" =~ $name_pattern ]]; then
  echo "Folder names are kebab-case: lowercase letters, numbers, and hyphens. \"$name\" is not." >&2
  exit 1
fi

types_block() { awk '/"types": \[/,/\]/' "$root/hub.config.json"; }

if [ -z "$type" ]; then
  type="$(types_block | grep -o '"[^"]*"' | sed -n '2p' | tr -d '"')"
fi
if ! types_block | grep -qF "\"$type\""; then
  approved="$(types_block | grep -o '"[^"]*"' | sed 1d | tr -d '"' | awk '{printf "%s%s", sep, $0; sep=", "} END {print ""}')"
  echo "\"$type\" is not an approved type. Pick from: $approved" >&2
  exit 1
fi

title_pattern='^[A-Za-z0-9][A-Za-z0-9 .,()-]*$'
if [ -z "$title" ]; then
  title="$(echo "$name" | tr '-' ' ' | awk '{for (i = 1; i <= NF; i++) $i = toupper(substr($i, 1, 1)) substr($i, 2)} 1')"
elif ! [[ "$title" =~ $title_pattern ]]; then
  echo "Keep the title to letters, numbers, spaces, and basic punctuation." >&2
  exit 1
fi

dir="$root/examples/$name"
if [ -e "$dir" ]; then
  echo "examples/$name already exists. Pick another name." >&2
  exit 1
fi

cp -R "$root/examples/_template" "$dir"

sed "s/\"title\": \"My Example\"/\"title\": \"$title\"/; s/\"type\": \"Extend App\"/\"type\": \"$type\"/" \
  "$dir/example.json" > "$dir/example.json.tmp"
mv "$dir/example.json.tmp" "$dir/example.json"

sed "1s/.*/# $title/" "$dir/README.md" > "$dir/README.md.tmp"
mv "$dir/README.md.tmp" "$dir/README.md"

echo "Created examples/$name (type: $type)"
echo ""
echo "Next steps:"
echo "  1. Drop your artifact into examples/$name/ (app source, orchestration, skill markdown, diagrams)."
echo "  2. Edit examples/$name/example.json and README.md."
echo "  3. Open a pull request. CI runs validation for you."
