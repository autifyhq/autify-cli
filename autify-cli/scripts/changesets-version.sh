#!/usr/bin/env bash
# Version step for changesets/action: bumps versions, builds, regenerates README.
# Build must run before `oclif readme` so it can enumerate commands from dist/.
set -euo pipefail

npx changeset version
npm run build
cd autify-cli && npx oclif readme --repository-prefix='<%- repo %>/blob/@autifyhq/autify-cli@<%- version %>/autify-cli/<%- commandPath %>'
