#!/usr/bin/env bash
# Idempotency check for changesets/action's publish step.
# Emits `New tag:` only when the current version isn't tagged yet,
# so subsequent pushes without a changeset are no-ops.
set -euo pipefail

VERSION=$(jq -r .version "$(dirname "$0")/../package.json")
TAG="@autifyhq/autify-cli@${VERSION}"

git fetch --tags --quiet
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "Tag ${TAG} already exists, skipping release"
else
  echo "New tag: ${TAG}"
fi
