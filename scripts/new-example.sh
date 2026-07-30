#!/usr/bin/env bash
# Same as new-example.mjs but with no Node needed. Copies examples/_template
# and fills in the title and type.
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

if ! echo "$name" | grep -Eq '^[a-z0-9][a-z0-9-]*$'; then
  echo "Folder names are kebab-case: lowercase letters, numbers, and hyphens. \"$name\" is not." >&2
  exit 1
fi

# hub.config.json is the source of truth for types. Most machines don't have
# jq, so grab the types block with awk and grep inside it.
types=$(awk '/"types": \[/,/\]/' "$root/hub.config.json")

if [ -z "$type" ]; then
  type=$(echo "$types" | grep -o '"[^"]*"' | sed -n 2p | tr -d '"')
fi

if ! echo "$types" | grep -qF "\"$type\""; then
  echo "\"$type\" is not an approved type. Check the types list in hub.config.json." >&2
  exit 1
fi

if [ -z "$title" ]; then
  # my-example-name -> My Example Name
  title=$(echo "$name" | tr '-' ' ' | awk '{for (i=1; i<=NF; i++) $i = toupper(substr($i,1,1)) substr($i,2)} 1')
elif ! echo "$title" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9 .,()-]*$'; then
  echo "Keep the title to letters, numbers, spaces, and basic punctuation." >&2
  exit 1
fi

dir="$root/examples/$name"
if [ -e "$dir" ]; then
  echo "examples/$name already exists. Pick another name." >&2
  exit 1
fi

cp -R "$root/examples/_template" "$dir"

# BSD and GNU sed disagree about -i, so go through a temp file
sed "s/\"title\": \"My Example\"/\"title\": \"$title\"/; s/\"type\": \"Extend App\"/\"type\": \"$type\"/" "$dir/example.json" > "$dir/.tmp"
mv "$dir/.tmp" "$dir/example.json"

sed "1s/.*/# $title/" "$dir/README.md" > "$dir/.tmp"
mv "$dir/.tmp" "$dir/README.md"

echo "Created examples/$name (type: $type)"
echo
echo "Next steps:"
echo "  1. Drop your artifact into examples/$name/ (app source, orchestration, skill markdown, diagrams)."
echo "  2. Edit examples/$name/example.json and README.md."
echo "  3. Open a pull request. CI runs validation for you."
