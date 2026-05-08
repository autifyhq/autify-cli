# Changesets

This repository uses [changesets](https://github.com/changesets/changesets) to manage semver releases of `@autifyhq/autify-cli` and `@autifyhq/autify-cli-integration-test`.

## When to add a changeset

Add a changeset to any PR that should result in a new release of the CLI.

## How

```sh
npx changeset
```

Pick the package, choose patch/minor/major, write a one-line description. Commit the generated `.changeset/*.md` file as part of your PR.

## What happens after merge

When your PR is merged to `main`, the changesets bot opens a "Version Packages" PR that bumps `package.json` and removes the changeset files. Merging that PR triggers the release: build, upload to S3, promote to channels, publish to npm, update the Homebrew tap, and create a GitHub release.

The mobilelink version/hash is bumped automatically via a downstream PR when a new mobilelink release is published from.
