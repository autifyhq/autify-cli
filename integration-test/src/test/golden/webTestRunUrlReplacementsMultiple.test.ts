/* eslint-disable unicorn/filename-case */
import { testAutifyCliSnapshot } from "../helpers/testAutifyCliSnapshot";

testAutifyCliSnapshot(
  'web test run https://app.autify.com/projects/0000/scenarios/0000 -r "https://example.com https://example.net?foo=bar" -r "https://example.net https://example.com?foo=bar"'
);
