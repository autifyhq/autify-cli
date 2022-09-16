#!/bin/bash
set -e

echoerr() { echo "\$@" 1>&2; }

if [ "$(uname)" == "Darwin" ]; then
  OS=darwin
elif [ "$(uname -s | cut -c 1-5)" == "Linux" ]; then
  OS=linux
elif [ "$(uname -s | cut -c 1-5)" == "MINGW" ]; then
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

AUTIFY_S3_BUCKET=REPLACE
AUTIFY_S3_PREFIX=REPLACE

WORKSPACE="$(pwd)"
rm -fr "$WORKSPACE/autify"
mkdir "$WORKSPACE/autify"

if [ "$OS" == "windows" ]; then
  URL=https://$AUTIFY_S3_BUCKET.s3.amazonaws.com/$AUTIFY_S3_PREFIX-$ARCH.exe
  EXE_FILE="$WORKSPACE/autify/installer.exe"
  curl "$URL" > "$EXE_FILE"
  cmd.exe /C "$(cygpath -w "$EXE_FILE") /S /D=$(cygpath -w "$WORKSPACE/autify")"
else
  mkdir "$WORKSPACE/autify/bin"
  mkdir "$WORKSPACE/autify/lib"
  cd "$WORKSPACE/autify/lib"

  if [ "$(command -v xz)" ]; then
    TAR_EXT="tar.xz"
    TAR_ARGS="xJ"
  else
    TAR_EXT="tar.gz"
    TAR_ARGS="xz"
  fi
  URL=https://$AUTIFY_S3_BUCKET.s3.amazonaws.com/$AUTIFY_S3_PREFIX-$OS-$ARCH.$TAR_EXT
  echo "Installing CLI from $URL"
  if [ "$(command -v curl)" ]; then
    curl "$URL" | tar "$TAR_ARGS"
  else
    wget -O- "$URL" | tar "$TAR_ARGS"
  fi

  ln -s "$WORKSPACE/autify/lib/autify/bin/autify" "$WORKSPACE/autify/bin/autify"
fi

cd "$WORKSPACE"
"$WORKSPACE/autify/bin/autify" --version
