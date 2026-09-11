#!/usr/bin/env bash


######################################################################################################
# Usage: ./updateAppid.sh  downloadedExtendSource.zip  original_app_reference_id  new_app_reference_id
#
# Output: new_app_reference_id.zip 
######################################################################################################




set -euo pipefail

# ---- Validate arguments first ----
if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <extendAppSource.zip> <original_app_reference_id> <new_app_reference_id>"
  exit 1
fi

ZIP_FILE="$1"
SEARCH_STRING="$2"
REPLACE_STRING="$3"

capitalize_first() {
  local s="$1"
  printf '%s%s' \
    "$(printf '%s' "${s:0:1}" | tr '[:lower:]' '[:upper:]')" \
    "${s:1}"
}

# Capitalized versions (first letter only)
SEARCH_CAP="$(capitalize_first "$SEARCH_STRING")"
REPLACE_CAP="$(capitalize_first "$REPLACE_STRING")"


if [[ ! -f "$ZIP_FILE" ]]; then
  echo "Error: ZIP file not found: $ZIP_FILE"
  exit 1
fi

WORK_DIR=$(mktemp -d)
ORIGINAL_DIR=$(pwd)

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

# ---- Unzip ----
unzip -q "$ZIP_FILE" -d "$WORK_DIR"
cd "$WORK_DIR"

# ---- Replace strings in ALL files (recursive) ----
find . -type f -print0 | while IFS= read -r -d '' file; do
  # Exact match
  sed -i.bak "s/${SEARCH_STRING}/${REPLACE_STRING}/g" "$file" || true

  # Capitalized-first-letter match
  sed -i.bak "s/${SEARCH_CAP}/${REPLACE_CAP}/g" "$file" || true

  rm -f "${file}.bak"
done

# ---- Rebuild zip preserving directories ----
zip -qr "${ORIGINAL_DIR}/${REPLACE_STRING}.zip" .

echo "✅ Updated zip created: ${REPLACE_STRING}.zip"

