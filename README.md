# Autify Command Line Interface (CLI)

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/autifyhq/autify-cli?color=blue&display_name=tag&sort=semver) [![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

Autify CLI can help your integration with Autify!

![Autify_CLI_ogp (2)](https://user-images.githubusercontent.com/37822/186738361-4d07c65f-9d3b-4295-ba3c-f2b84a6d9743.png)

<!-- toc -->

- [Autify Command Line Interface (CLI)](#autify-command-line-interface-cli)
- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

# Usage

See our official document: https://help.autify.com/docs/autify-command-line-interface

# Commands

<!-- commands -->

- [`autify connect access-point create`](#autify-connect-access-point-create)
- [`autify connect access-point set`](#autify-connect-access-point-set)
- [`autify connect client install [VERSION]`](#autify-connect-client-install-version)
- [`autify connect client start`](#autify-connect-client-start)
- [`autify help [COMMAND]`](#autify-help-command)
- [`autify mobile api describe-test-result`](#autify-mobile-api-describe-test-result)
- [`autify mobile api list-test-results`](#autify-mobile-api-list-test-results)
- [`autify mobile api run-test-plan`](#autify-mobile-api-run-test-plan)
- [`autify mobile api upload-build`](#autify-mobile-api-upload-build)
- [`autify mobile auth login`](#autify-mobile-auth-login)
- [`autify mobile build upload BUILD-PATH`](#autify-mobile-build-upload-build-path)
- [`autify mobile test run TEST-PLAN-URL`](#autify-mobile-test-run-test-plan-url)
- [`autify mobile test wait TEST-RESULT-URL`](#autify-mobile-test-wait-test-result-url)
- [`autify update [CHANNEL]`](#autify-update-channel)
- [`autify web api create-access-point`](#autify-web-api-create-access-point)
- [`autify web api create-url-replacement`](#autify-web-api-create-url-replacement)
- [`autify web api delete-access-point`](#autify-web-api-delete-access-point)
- [`autify web api delete-url-replacement`](#autify-web-api-delete-url-replacement)
- [`autify web api describe-result`](#autify-web-api-describe-result)
- [`autify web api describe-scenario`](#autify-web-api-describe-scenario)
- [`autify web api execute-scenarios`](#autify-web-api-execute-scenarios)
- [`autify web api execute-schedule`](#autify-web-api-execute-schedule)
- [`autify web api list-access-points`](#autify-web-api-list-access-points)
- [`autify web api list-capabilities`](#autify-web-api-list-capabilities)
- [`autify web api list-results`](#autify-web-api-list-results)
- [`autify web api list-scenarios`](#autify-web-api-list-scenarios)
- [`autify web api list-url-replacements`](#autify-web-api-list-url-replacements)
- [`autify web api update-url-replacement`](#autify-web-api-update-url-replacement)
- [`autify web auth login`](#autify-web-auth-login)
- [`autify web test run SCENARIO-OR-TEST-PLAN-URL`](#autify-web-test-run-scenario-or-test-plan-url)
- [`autify web test wait TEST-RESULT-URL`](#autify-web-test-wait-test-result-url)

## `autify connect access-point create`

Create an Autify Connect Access Point

```
USAGE
  $ autify connect access-point create --name <value> [--web-workspace-id <value>]

FLAGS
  --name=<value>              (required) Name of Autify Connect Access Point to be created
  --web-workspace-id=<value>  Workspace ID of Autify for Web to which the Access Point will belong

DESCRIPTION
  Create an Autify Connect Access Point

EXAMPLES
  $ autify connect access-point create --name NAME --web-workspace-id ID
```

## `autify connect access-point set`

Set Autify Connect Access Point

```
USAGE
  $ autify connect access-point set --name <value>

FLAGS
  --name=<value>  (required) Name of the Autify Connect Access Point already created

DESCRIPTION
  Set Autify Connect Access Point

EXAMPLES
  Start interactive setup:

    $ autify connect access-point set --name=NAME

  Reading the key from file:

    $ autify connect access-point set --name=NAME < key.txt
```

## `autify connect client install [VERSION]`

Install Autify Connect Client

```
USAGE
  $ autify connect client install [VERSION]

ARGUMENTS
  VERSION  [default: v0.7.2] Specify the target version of Autify Connect Client.

DESCRIPTION
  Install Autify Connect Client

EXAMPLES
  (Recommended) Install the supported version:

    $ autify connect client install

  Install a specific version:

    $ autify connect client install v0.6.1

  Install a stable version:

    $ autify connect client install stable
```

## `autify connect client start`

Start Autify Connect Client

```
USAGE
  $ autify connect client start [--verbose] [--file-logging] [--debug-server-port <value>] [--web-workspace-id <value>]
    [--extra-arguments <value>]

FLAGS
  --debug-server-port=<value>  The server for debugging and monitoring launches on your local machine on the given port.
                               It will use a radom port if not specified.
  --extra-arguments=<value>    Extra command line arguments you want to pass to Autify Connect Client e.g.
                               "--tunnel-proxy http://proxy".
  --file-logging               Logging Autify Connect Client log to a file instead of console.
  --verbose                    Make the operation more talkative.
  --web-workspace-id=<value>   Workspace ID of Autify for Web to create an ephemeral Access Point. If not specified, it
                               will use the one configured by `autify connect access-point create/set`, instead.

DESCRIPTION
  Start Autify Connect Client

EXAMPLES
  With pre-created Access Point:

    $ autify connect client start

  With ephemeral Access Point of Autify for Web:

    $ autify connect client start --web-workspace-id 000
```

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.18/src/commands/help.ts)_

## `autify mobile api describe-test-result`

Get a test result.

```
USAGE
  $ autify mobile api describe-test-result --project-id <value> --id <value>

FLAGS
  --id=<value>          (required) Test Result ID.
  --project-id=<value>  (required) ID of the project from which the test results will be obtained.

DESCRIPTION
  Get a test result.

EXAMPLES
  $ autify mobile api describe-test-result
```

## `autify mobile api list-test-results`

List test results.

```
USAGE
  $ autify mobile api list-test-results --project-id <value> [--page <value>] [--per-page <value>] [--test-plan-id
  <value>]

FLAGS
  --page=<value>          Page number to be retrieved.
  --per-page=<value>      Number of test results per page.
  --project-id=<value>    (required) ID of the project from which the list of test results will be retrieved.
  --test-plan-id=<value>  ID of the test plan.

DESCRIPTION
  List test results.

EXAMPLES
  $ autify mobile api list-test-results
```

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

## `autify mobile build upload BUILD-PATH`

Upload a build file

```
USAGE
  $ autify mobile build upload [BUILD-PATH] -w <value> [--json]

ARGUMENTS
  BUILD-PATH  File path to the iOS app (*.app) or Android app (*.apk).

FLAGS
  -w, --workspace-id=<value>  (required) Workspace ID to upload the build file

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Upload a build file

EXAMPLES
  $ autify mobile build upload

  Upload build file

    $ autify mobile build upload --workspace-id AAA ./my.app

  Upload build file (JSON output)

    $ autify mobile build upload --workspace-id AAA ./my.app --json
```

## `autify mobile test run TEST-PLAN-URL`

Run a test plan.

```
USAGE
  $ autify mobile test run [TEST-PLAN-URL] [--build-id <value> | --build-path <value>] [-w] [-t <value>] [-v]
    [--max-retry-count <value>]

ARGUMENTS
  TEST-PLAN-URL  Test plan URL e.g. https://mobile-app.autify.com/projects/<ID>/test_plans/<ID>

FLAGS
  -t, --timeout=<value>      [default: 300] Timeout seconds when waiting for the finish of the test execution.
  -v, --verbose              Verbose output
  -w, --wait                 Wait until the test finishes.
  --build-id=<value>         ID of the already uploaded build.
  --build-path=<value>       File path to the iOS app (*.app) or Android app (*.apk).
  --max-retry-count=<value>  Maximum retry count. The command can take up to timeout * (max-retry-count + 1).

DESCRIPTION
  Run a test plan.

EXAMPLES
  Run a test plan with a build ID:

    $ autify mobile test run --build-id CCC https://mobile-app.autify.com/projects/AAA/test_plans/BBB

  Run a test plan with a new build file:

    $ autify mobile test run --build-path ./my.[app|apk] https://mobile-app.autify.com/projects/AAA/test_plans/BBB

  Run and wait a test plan:

    $ autify mobile test run --build-id CCC https://mobile-app.autify.com/projects/AAA/test_plans/BBB --wait \
      --timeout 600
```

## `autify mobile test wait TEST-RESULT-URL`

Wait a test result until it finishes.

```
USAGE
  $ autify mobile test wait [TEST-RESULT-URL] [-t <value>] [-v]

ARGUMENTS
  TEST-RESULT-URL  Test result URL e.g. https://mobile-app.autify.com/projects/<ID>/results/<ID>

FLAGS
  -t, --timeout=<value>  [default: 300] Timeout seconds when waiting for the finish of the test execution.
  -v, --verbose          Verbose output

DESCRIPTION
  Wait a test result until it finishes.

EXAMPLES
  $ autify mobile test wait https://mobile-app.autify.com/projects/AAA/results/BBB
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

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v3.0.6/src/commands/update.ts)_

## `autify web api create-access-point`

You can generate a new access point by passing in its name.

```
USAGE
  $ autify web api create-access-point --project-id <value> --create-access-point-request <value>

FLAGS
  --create-access-point-request=<value>  (required) The name of the access point to be created
  --project-id=<value>                   (required) For example, 1 for the following URL:
                                         https://app.autify.com/projects/1/scenarios

DESCRIPTION
  You can generate a new access point by passing in its name.

EXAMPLES
  $ autify web api create-access-point
```

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

## `autify web api delete-access-point`

You can delete an access point by passing in its name.

```
USAGE
  $ autify web api delete-access-point --project-id <value> --delete-access-point-request <value>

FLAGS
  --delete-access-point-request=<value>  (required) The name of the access point to be deleted
  --project-id=<value>                   (required) For example, 1 for the following URL:
                                         https://app.autify.com/projects/1/scenarios

DESCRIPTION
  You can delete an access point by passing in its name.

EXAMPLES
  $ autify web api delete-access-point
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
  $ autify web api execute-schedule --schedule-id <value> [--execute-schedule-request <value>]

FLAGS
  --execute-schedule-request=<value>  The options to execute a test plan.
  --schedule-id=<value>               (required) For example, 3 for the following URL:
                                      https://app.autify.com/projects/1/test_plans/3

DESCRIPTION
  Run a test plan. (Note: "Schedule" is called as "TestPlan" now.)

EXAMPLES
  $ autify web api execute-schedule
```

## `autify web api list-access-points`

List access points for the project.

```
USAGE
  $ autify web api list-access-points --project-id <value> [--page <value>]

FLAGS
  --page=<value>        The number of page returns.
  --project-id=<value>  (required) For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios

DESCRIPTION
  List access points for the project.

EXAMPLES
  $ autify web api list-access-points
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
  $ autify web test run [SCENARIO-OR-TEST-PLAN-URL] [-n <value>] [-r <value>] [--autify-connect <value> |
    --autify-connect-client] [--autify-connect-client-verbose ] [--autify-connect-client-file-logging ]
    [--autify-connect-client-debug-server-port <value> ] [--autify-connect-client-extra-arguments <value> ] [--os
    <value>] [--os-version <value>] [--browser <value>] [--device <value>] [--device-type <value>] [-w] [-t <value>]
    [-v] [--max-retry-count <value>]

ARGUMENTS
  SCENARIO-OR-TEST-PLAN-URL  Scenario URL or Test plan URL e.g.
                             https://app.autify.com/projects/<ID>/(scenarios|test_plans)/<ID>

FLAGS
  -n, --name=<value>                                 [Only for test scenario] Name of the test execution.
  -r, --url-replacements=<value>...                  URL replacements. Example: http://example.com=http://example.net
  -t, --timeout=<value>                              [default: 300] Timeout seconds when waiting for the finish of the
                                                     test execution.
  -v, --verbose                                      Verbose output
  -w, --wait                                         Wait until the test finishes.
  --autify-connect=<value>                           Name of the Autify Connect Access Point.
  --autify-connect-client                            Start Autify Connect Client
  --autify-connect-client-debug-server-port=<value>  Port for Autify Connect Client debug server. A random port will be
                                                     used if not specified.
  --autify-connect-client-extra-arguments=<value>    Extra command line arguments you want to pass to Autify Connect
                                                     Client e.g. "--tunnel-proxy http://proxy".
  --autify-connect-client-file-logging               Logging Autify Connect Client log to a file instead of console.
  --autify-connect-client-verbose                    Verbose output for Autify Connect Client.
  --browser=<value>                                  [Only for test scenario] Browser to run the test
  --device=<value>                                   [Only for test scenario] Device to run the test
  --device-type=<value>                              [Only for test scenario] Device type to run the test
  --max-retry-count=<value>                          Maximum retry count while waiting. The command can take up to
                                                     `timeout * (max-retry-count + 1)`. Only effective with `--wait`.
  --os=<value>                                       [Only for test scenario] OS to run the test
  --os-version=<value>                               [Only for test scenario] OS version to run the test

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

  Run a test with specifying the execution name:

    $ autify web test run https://app.autify.com/projects/0000/scenarios/0000 --name "Sample execution"

  Run a test scenario with Autify Connect:

    $ autify web test run https://app.autify.com/projects/0000/scenarios/0000 --autify-connect NAME

  Run a test scenario with Autify Connect Client:

    $ autify web test run https://app.autify.com/projects/0000/scenarios/0000 --wait --autify-connect-client
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
