#!/usr/bin/env bash
# Emits `New tag:` for changesets/action to create the GitHub release.
set -euo pipefail

VERSION=$(jq -r .version "$(dirname "$0")/../package.json")
echo "New tag: @autifyhq/autify-cli@${VERSION}"
