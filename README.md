Autify Command Line Interface (CLI)
=================

Autify CLI can help your integration with Autify!

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage

Note: `npm install` is not available yet. We'll work on publishing to npm.

<!-- usage -->
```sh-session
$ npm install -g autify-cli
$ autify COMMAND
running command...
$ autify (--version)
autify-cli/0.1.0-beta.0 linux-x64 node-v16.15.0
$ autify --help [COMMAND]
USAGE
  $ autify COMMAND
...
```
<!-- usagestop -->

## Download Prebuilt package
We provide prebuilt packages in the forms below (Node.js runtime is included):

| OS  | Architecture | Package type | Download Link | Note
| :--- |:--- | :--- | :--- | :--- |
|Linux  |Intel 64bit|tar.gz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-linux-x64.tar.gz)|
|Linux  |Intel 64bit|tar.xz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-linux-x64.tar.xz)|
|Linux  |Arm 32bit  |tar.gz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-linux-arm.tar.gz)|
|Linux  |Arm 32bit  |tar.xz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-linux-arm.tar.xz)|
|macOS  |Intel 64bit|tar.gz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-darwin-x64.tar.gz)|
|macOS  |Intel 64bit|tar.xz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-darwin-x64.tar.xz)|
|macOS  |Intel 64bit|Installer|[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-x64.pkg)|Not properly signed yet.
|macOS  |Arm 64bit  |tar.gz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-darwin-arm64.tar.gz)|
|macOS  |Arm 64bit  |tar.xz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-darwin-arm64.tar.xz)|
|macOS  |Arm 64bit  |Installer|[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-arm64.pkg)|Not properly signed yet.
|Windows|Intel 64bit|tar.gz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-win32-x64.tar.gz)|
|Windows|Intel 64bit|tar.xz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-win32-x64.tar.xz)|
|Windows|Intel 64bit|Installer|[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-x64.exe)|Not properly signed yet.
|Windows|Intel 32bit|tar.gz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-win32-x86.tar.gz)|
|Windows|Intel 32bit|tar.xz   |[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-win32-x86.tar.xz)|
|Windows|Intel 32bit|Installer|[`stable`](https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/stable/autify-x86.exe)|Not properly signed yet.

After the installation, you can always get the latest update on `stable` channel automatically, or by running `autify update`.

# Commands
<!-- commands -->
* [`autify help [COMMAND]`](#autify-help-command)
* [`autify mobile api run-test-plan`](#autify-mobile-api-run-test-plan)
* [`autify mobile api upload-build`](#autify-mobile-api-upload-build)
* [`autify mobile auth login`](#autify-mobile-auth-login)
* [`autify update [CHANNEL]`](#autify-update-channel)
* [`autify web api create-url-replacement`](#autify-web-api-create-url-replacement)
* [`autify web api delete-url-replacement`](#autify-web-api-delete-url-replacement)
* [`autify web api describe-result`](#autify-web-api-describe-result)
* [`autify web api describe-scenario`](#autify-web-api-describe-scenario)
* [`autify web api execute-scenarios`](#autify-web-api-execute-scenarios)
* [`autify web api execute-schedule`](#autify-web-api-execute-schedule)
* [`autify web api list-capabilities`](#autify-web-api-list-capabilities)
* [`autify web api list-results`](#autify-web-api-list-results)
* [`autify web api list-scenarios`](#autify-web-api-list-scenarios)
* [`autify web api list-url-replacements`](#autify-web-api-list-url-replacements)
* [`autify web api update-url-replacement`](#autify-web-api-update-url-replacement)
* [`autify web auth login`](#autify-web-auth-login)
* [`autify web test run SCENARIO-OR-TEST-PLAN-URL`](#autify-web-test-run-scenario-or-test-plan-url)
* [`autify web test wait TEST-RESULT-URL`](#autify-web-test-wait-test-result-url)

## `autify help [COMMAND]`

Display help for autify.

```
USAGE
  $ autify help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for autify.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `autify mobile api run-test-plan`

Run a test plan

```
USAGE
  $ autify mobile api run-test-plan --test-plan-id <value> --run-test-plan-request <value>

FLAGS
  --run-test-plan-request=<value>  (required) The build_id to execute the test plan.
  --test-plan-id=<value>           (required) The ID of the test plan to run.

DESCRIPTION
  Run a test plan

EXAMPLES
  $ autify mobile api run-test-plan
```

## `autify mobile api upload-build`

Upload the build file.

```
USAGE
  $ autify mobile api upload-build --project-id <value> --file <value>

FLAGS
  --file=<value>        (required) Build file.
  --project-id=<value>  (required) The ID of the project to upload the build file to.

DESCRIPTION
  Upload the build file.

EXAMPLES
  $ autify mobile api upload-build
```

## `autify mobile auth login`

Login to Autify for Mobile

```
USAGE
  $ autify mobile auth login

DESCRIPTION
  Login to Autify for Mobile

EXAMPLES
  Start interactive setup:

    $ autify mobile auth login

  Reading the token from file:

    $ autify mobile auth login < token.txt
```

## `autify update [CHANNEL]`

update the autify CLI

```
USAGE
  $ autify update [CHANNEL] [-a] [-v <value> | -i] [--force]

FLAGS
  -a, --available        Install a specific version.
  -i, --interactive      Interactively select version to install. This is ignored if a channel is provided.
  -v, --version=<value>  Install a specific version.
  --force                Force a re-download of the requested version.

DESCRIPTION
  update the autify CLI

EXAMPLES
  Update to the stable channel:

    $ autify update stable

  Update to a specific version:

    $ autify update --version 1.0.0

  Interactively select version:

    $ autify update --interactive

  See available versions:

    $ autify update --available
```

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v3.0.0/src/commands/update.ts)_

## `autify web api create-url-replacement`

Create a new url replacement for the test plan

```
USAGE
  $ autify web api create-url-replacement --test-plan-id <value> --create-url-replacement-request <value>

FLAGS
  --create-url-replacement-request=<value>  (required) The url to replace
  --test-plan-id=<value>                    (required) For example, 15 for the following URL:
                                            https://app.autify.com/projects/1/test_plans/15

DESCRIPTION
  Create a new url replacement for the test plan

EXAMPLES
  $ autify web api create-url-replacement
```

## `autify web api delete-url-replacement`

Delete a url replacement for the test plan

```
USAGE
  $ autify web api delete-url-replacement --test-plan-id <value> --url-replacement-id <value>

FLAGS
  --test-plan-id=<value>        (required) For example, 15 for the following URL:
                                https://app.autify.com/projects/1/test_plans/15
  --url-replacement-id=<value>  (required) url_replacement id

DESCRIPTION
  Delete a url replacement for the test plan

EXAMPLES
  $ autify web api delete-url-replacement
```

## `autify web api describe-result`

Get a result.

```
USAGE
  $ autify web api describe-result --project-id <value> --result-id <value>

FLAGS
  --project-id=<value>  (required) For example, 1 for the following URL: https://app.autify.com/projects/1/results/4
  --result-id=<value>   (required) For example, 4 for the following URL: https://app.autify.com/projects/1/results/4

DESCRIPTION
  Get a result.

EXAMPLES
  $ autify web api describe-result
```

## `autify web api describe-scenario`

Get a scenario.

```
USAGE
  $ autify web api describe-scenario --project-id <value> --scenario-id <value>

FLAGS
  --project-id=<value>   (required) For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios/2
  --scenario-id=<value>  (required) For example, 2 for the following URL: https://app.autify.com/projects/1/scenarios/2

DESCRIPTION
  Get a scenario.

EXAMPLES
  $ autify web api describe-scenario
```

## `autify web api execute-scenarios`

You can execute any scenarios in your workspace using any execution environments (which is called "capabilities" here).

```
USAGE
  $ autify web api execute-scenarios --project-id <value> --execute-scenarios-request <value>

FLAGS
  --execute-scenarios-request=<value>  (required) The scenarios and settings to execute
  --project-id=<value>                 (required) For example, 1 for the following URL:
                                       https://app.autify.com/projects/1/scenarios

DESCRIPTION
  You can execute any scenarios in your workspace using any execution environments (which is called "capabilities"
  here).

EXAMPLES
  $ autify web api execute-scenarios
```

## `autify web api execute-schedule`

Run a test plan. (Note: "Schedule" is called as "TestPlan" now.)

```
USAGE
  $ autify web api execute-schedule --schedule-id <value>

FLAGS
  --schedule-id=<value>  (required) For example, 3 for the following URL: https://app.autify.com/projects/1/test_plans/3

DESCRIPTION
  Run a test plan. (Note: "Schedule" is called as "TestPlan" now.)

EXAMPLES
  $ autify web api execute-schedule
```

## `autify web api list-capabilities`

List available Capabilities.

```
USAGE
  $ autify web api list-capabilities --project-id <value> [--os <value>] [--browser <value>] [--device-type <value>]

FLAGS
  --browser=<value>      browser name to filter
  --device-type=<value>  device_type name to filter
  --os=<value>           os name to filter
  --project-id=<value>   (required) For example, 1 for the following URL: https://app.autify.com/projects/1/capabilities

DESCRIPTION
  List available Capabilities.

EXAMPLES
  $ autify web api list-capabilities
```

## `autify web api list-results`

List results.

```
USAGE
  $ autify web api list-results --project-id <value> [--page <value>] [--per-page <value>] [--test-plan-id <value>]

FLAGS
  --page=<value>          The number of page returns.
  --per-page=<value>      The number of items returns. Default number is 30 and up to a maximum of 100
  --project-id=<value>    (required) For example, 1 for the following URL: https://app.autify.com/projects/1/results
  --test-plan-id=<value>  Test plan ID used to filter results.

DESCRIPTION
  List results.

EXAMPLES
  $ autify web api list-results
```

## `autify web api list-scenarios`

List scenarios.

```
USAGE
  $ autify web api list-scenarios --project-id <value> [--page <value>]

FLAGS
  --page=<value>        The number of page returns.
  --project-id=<value>  (required) For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios

DESCRIPTION
  List scenarios.

EXAMPLES
  $ autify web api list-scenarios
```

## `autify web api list-url-replacements`

List url replacements for the test plan

```
USAGE
  $ autify web api list-url-replacements --test-plan-id <value>

FLAGS
  --test-plan-id=<value>  (required) For example, 15 for the following URL:
                          https://app.autify.com/projects/1/test_plans/15

DESCRIPTION
  List url replacements for the test plan

EXAMPLES
  $ autify web api list-url-replacements
```

## `autify web api update-url-replacement`

Update a url replacement for the test plan

```
USAGE
  $ autify web api update-url-replacement --test-plan-id <value> --url-replacement-id <value> --update-url-replacement-request
    <value>

FLAGS
  --test-plan-id=<value>                    (required) For example, 15 for the following URL:
                                            https://app.autify.com/projects/1/test_plans/15
  --update-url-replacement-request=<value>  (required) The url to replace. Either pattern_url or replacement_url is
                                            required.
  --url-replacement-id=<value>              (required) url_replacement id

DESCRIPTION
  Update a url replacement for the test plan

EXAMPLES
  $ autify web api update-url-replacement
```

## `autify web auth login`

Login to Autify for Web

```
USAGE
  $ autify web auth login

DESCRIPTION
  Login to Autify for Web

EXAMPLES
  Start interactive setup:

    $ autify web auth login

  Reading the token from file:

    $ autify web auth login < token.txt
```

## `autify web test run SCENARIO-OR-TEST-PLAN-URL`

Run a scenario or test plan.

```
USAGE
  $ autify web test run [SCENARIO-OR-TEST-PLAN-URL] [-r <value>] [--os <value>] [--os-version <value>] [--browser
    <value>] [--device <value>] [--device-type <value>] [-w] [-t <value>] [-v]

ARGUMENTS
  SCENARIO-OR-TEST-PLAN-URL  Scenario URL or Test plan URL e.g.
                             https://app.autify.com/projects/<ID>/(scenarios|test_plans)/<ID>

FLAGS
  -r, --url-replacements=<value>...  URL replacements. Example: http://example.com=http://example.net
  -t, --timeout=<value>              [default: 300] Timeout seconds when waiting for the finish of the test execution.
  -v, --verbose                      Verbose output
  -w, --wait                         Wait until the test finishes.
  --browser=<value>                  Browser to run the test
  --device=<value>                   Device to run the test
  --device-type=<value>              Device type to run the test
  --os=<value>                       OS to run the test
  --os-version=<value>               OS version to run the test

DESCRIPTION
  Run a scenario or test plan.

EXAMPLES
  Run a test scenario (Default capability):

    $ autify web test run https://app.autify.com/projects/0000/scenarios/0000

  Run a test plan:

    $ autify web test run https://app.autify.com/projects/0000/test_plans/0000

  Run and wait a test scenario:

    $ autify web test run https://app.autify.com/projects/0000/scenarios/0000 --wait --timeout 600

  Run a test scenario with a specific capability:

    $ autify web test run https://app.autify.com/projects/0000/scenarios/0000 --os "Windows Server" --browser Edge

  With URL replacements:

    $ autify web test run https://app.autify.com/projects/0000/scenarios/0000 -r \
      http://example.com=http://example.net -r http://example.org=http://example.net
```

## `autify web test wait TEST-RESULT-URL`

Wait a test result until it finishes.

```
USAGE
  $ autify web test wait [TEST-RESULT-URL] [-t <value>] [-v]

ARGUMENTS
  TEST-RESULT-URL  Test result URL e.g. https://app.autify.com/projects/<ID>/results/<ID>

FLAGS
  -t, --timeout=<value>  [default: 300] Timeout seconds when waiting for the finish of the test execution.
  -v, --verbose          Verbose output

DESCRIPTION
  Wait a test result until it finishes.

EXAMPLES
  $ autify web test wait https://app.autify.com/projects/0000/results/0000
```
<!-- commandsstop -->
