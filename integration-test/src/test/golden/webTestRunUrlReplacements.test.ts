/* eslint-disable unicorn/filename-case */
import { testAutifyCliSnapshot } from "../helpers/testAutifyCliSnapshot";

const command =
  'web test run https://app.autify.com/projects/0000/scenarios/0000 -r "https://example.com https://example.net?foo=bar"';

// const commandForWin =
//   'web test run https://app.autify.com/projects/0000/scenarios/0000 -r """"https://example.com https://example.net?foo=bar""';

testAutifyCliSnapshot(
  // process.platform === "win32" ? commandForWin : command,
  command,
  command
);
