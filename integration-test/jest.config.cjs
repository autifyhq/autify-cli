/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  snapshotResolver: "<rootDir>/snapshot-resolver.cjs",
  // Needed to run tests inside node_modules.
  testPathIgnorePatterns: [],
  haste: {
    // Needed to run tests inside node_modules.
    retainAllFiles: true,
  },
};

module.exports = config;
