const sep = require("node:path").sep;

module.exports = {
  // resolves from test to snapshot path
  resolveSnapshotPath: (testPath, snapshotExtension) => {
    return (
      testPath.replace(
        `${sep}dist${sep}test${sep}`,
        `${sep}__snapshots__${sep}`
      ) + snapshotExtension
    );
  },

  // resolves from snapshot to test path
  resolveTestPath: (snapshotFilePath, snapshotExtension) => {
    return snapshotFilePath
      .replace(`${sep}__snapshots__${sep}`, `${sep}dist${sep}test${sep}`)
      .slice(0, -snapshotExtension.length);
  },

  // Example test path, used for preflight consistency check of the implementation above
  testPathForConsistencyCheck: "some/dist/test/example.test.js",
};
