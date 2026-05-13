#!/usr/bin/env bash
# Creates the release tag locally and emits `New tag:` so changesets/action
# pushes it and creates the matching GitHub release.
set -euo pipefail

VERSION=$(jq -r .version "$(dirname "$0")/../package.json")
TAG="@autifyhq/autify-cli@${VERSION}"

if ! git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  git tag "${TAG}"
fi
echo "New tag: ${TAG}"
