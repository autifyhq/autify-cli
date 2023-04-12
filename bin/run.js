#!/usr/bin/env node

import { run, Errors, flush } from "@oclif/core";

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
