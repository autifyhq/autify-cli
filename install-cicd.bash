#!/bin/bash
set -e

echoerr() { echo "\$@" 1>&2; }

AUTIFY_CLI_VERSION=REPLACE
AUTIFY_S3_BUCKET=REPLACE
AUTIFY_S3_PREFIX=REPLACE

WORKSPACE="$(pwd)"
AUTIFY_DIR="$WORKSPACE/autify"
AUTIFY_PATH="$AUTIFY_DIR/path" # Required PATHs to use the installed commands.

if [ -n "$AUTIFY_CLI_INSTALL_USE_CACHE" ] && [ -d "$AUTIFY_DIR" ]; then
  echo "$AUTIFY_DIR exists. Reuse it as cache."
  exit
fi
rm -fr "$AUTIFY_DIR"
mkdir "$AUTIFY_DIR"

if [ "$(uname)" == "Darwin" ]; then
  OS=darwin
elif [ "$(uname -s | cut -c 1-5)" == "Linux" ]; then
  OS=linux
elif [ "$(uname -s | cut -c 1-5)" == "MINGW" ]; then
  OS=windows
elif [ "$(uname -s | cut -c 1-4)" == "MSYS" ]; then
  OS=windows
else
  echoerr "Unsupported os: $(uname)"
  exit 1
fi

ARCH="$(uname -m)"
if [ "$ARCH" == "x86_64" ]; then
  ARCH=x64
elif [ "$ARCH" == "armv7l" ]; then
  ARCH=arm
elif [ "$ARCH" == "aarch64" ]; then
  ARCH=arm64
elif [ "$ARCH" == "arm64" ]; then
  ARCH=arm64
else
  echoerr "Unsupported arch: $ARCH"
  exit 1
fi

if [ "$OS" == "windows" ]; then
  URL="https://$AUTIFY_S3_BUCKET.s3.amazonaws.com/$AUTIFY_S3_PREFIX-$ARCH.exe"
  echo "Installing CLI from $URL"
  EXE_FILE="$AUTIFY_DIR/installer.exe"
  curl "$URL" > "$EXE_FILE"
  cmd.exe /C "$(cygpath -w "$EXE_FILE") /S /D=$(cygpath -w "$AUTIFY_DIR")"
  cygpath -w "$AUTIFY_DIR/bin" >> "$AUTIFY_PATH"
else
  mkdir "$AUTIFY_DIR/bin"
  mkdir "$AUTIFY_DIR/lib"
  cd "$AUTIFY_DIR/lib"
  if [ "$(command -v xz)" ]; then
    TAR_EXT="tar.xz"
    TAR_ARGS="xJ"
  else
    TAR_EXT="tar.gz"
    TAR_ARGS="xz"
  fi
  URL="https://$AUTIFY_S3_BUCKET.s3.amazonaws.com/$AUTIFY_S3_PREFIX-$OS-$ARCH.$TAR_EXT"
  echo "Installing CLI from $URL"
  if [ "$(command -v curl)" ]; then
    curl "$URL" | tar "$TAR_ARGS"
  else
    wget -O- "$URL" | tar "$TAR_ARGS"
  fi

  ln -s "$AUTIFY_DIR/lib/autify/bin/autify" "$AUTIFY_DIR/bin/autify"
  echo "$AUTIFY_DIR/bin" >> "$AUTIFY_PATH"
fi

cd "$WORKSPACE"
"$AUTIFY_DIR/bin/autify" --version

if [ -n "$AUTIFY_CLI_INTEGRATION_TEST_INSTALL" ]; then
  file_prefix=$(basename "$AUTIFY_S3_PREFIX")
  dir_prefix=$(dirname "$AUTIFY_S3_PREFIX")
  if [ "$file_prefix" == "autify" ]; then
    # channel
    package="autifyhq-autify-cli-integration-test.tgz"
  else
    # version
    package="autifyhq-autify-cli-integration-test-$AUTIFY_CLI_VERSION.tgz"
  fi
  package_url="https://$AUTIFY_S3_BUCKET.s3.amazonaws.com/${dir_prefix}/${package}"

  cd "$AUTIFY_DIR"
  echo "Installing autify-cli-integration-test package from $package_url"
  npm install "$package_url"
  if [ "$OS" == "windows" ]; then
    cygpath -w "$AUTIFY_DIR/node_modules/.bin" >> "$AUTIFY_PATH"
  else
    echo "$AUTIFY_DIR/node_modules/.bin" >> "$AUTIFY_PATH"
  fi
fi
