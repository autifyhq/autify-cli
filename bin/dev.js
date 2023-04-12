#!/usr/bin/env ts-node

import { settings, Errors, flush, run } from "@oclif/core";
import path from "node:path";
import url from "node:url";
import { register } from "ts-node";

const project = path.join(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "..",
  "tsconfig.json"
);

// In dev mode -> use ts-node and dev plugins
// When `bin/dev.js` is invoked in integration-test it'll be "test"
process.env.NODE_ENV ||= "development";

register({ project });

// In dev mode, always show stack traces
// In test mode, stack traces shouldn't appeared in snapshot
if (process.env.NODE_ENV === "development") {
  settings.debug = true;
}

// Start the CLI
run(process.argv.slice(2), import.meta.url)
  .then(flush)
  .catch((error) => {
    const oclifHandler = Errors.handle;
    if (error.response?.data)
      error.message = `${error.message}: ${JSON.stringify(
        error.response.data
      )}`;
    return oclifHandler(error);
  });
