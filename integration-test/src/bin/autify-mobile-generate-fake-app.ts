import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { androidBuildPath, iosBuildPath } from "../commands";

// https://commons.wikimedia.org/wiki/File:Transparent.gif
const tinyBinary = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

// Generate fake build files if not exiting.
// For recording, you should setup the real files on the same paths.
if (existsSync(iosBuildPath)) {
  console.log(`${iosBuildPath} already exists.`);
} else {
  mkdirSync(iosBuildPath); // *.app is a directory
  writeFileSync(join(iosBuildPath, "ios"), tinyBinary); // Add a fake binary file
  console.log(`${iosBuildPath} is created.`);
}

if (existsSync(androidBuildPath)) {
  console.log(`${androidBuildPath} already exists.`);
} else {
  writeFileSync(androidBuildPath, tinyBinary); // Create a fake binary file
  console.log(`${androidBuildPath} is created.`);
}
