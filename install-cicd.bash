#!/bin/bash
set -e

echoerr() { echo "\$@" 1>&2; }

if [ "$(uname)" == "Darwin" ]; then
  OS=darwin
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  OS=linux
else
  echoerr "This installer is only supported on Linux and macOS"
  exit 1
fi

ARCH="$(uname -m)"
if [ "$ARCH" == "x86_64" ]; then
  ARCH=x64
elif [[ "$ARCH" == aarch* ]]; then
  ARCH=arm
elif [ "$ARCH" == "arm64" ]; then
  ARCH=arm64
else
  echoerr "Unsupported arch: $ARCH"
  exit 1
fi

AUTIFY_S3_BUCKET=REPLACE
AUTIFY_S3_PREFIX=REPLACE

WORKSPACE="$(pwd)"
rm -fr ./autify
mkdir -p ./autify/bin
mkdir -p ./autify/lib
cd ./autify/lib

if [ $(command -v xz) ]; then
  TAR_EXT="tar.xz"
  TAR_ARGS="xJ"
else
  TAR_EXT="tar.gz"
  TAR_ARGS="xz"
fi

URL=https://$AUTIFY_S3_BUCKET.s3.amazonaws.com/$AUTIFY_S3_PREFIX-$OS-$ARCH.$TAR_EXT
echo "Installing CLI from $URL"
if [ $(command -v curl) ]; then
  curl "$URL" | tar "$TAR_ARGS"
else
  wget -O- "$URL" | tar "$TAR_ARGS"
fi

cd "$WORKSPACE"
ln -s "$WORKSPACE/autify/lib/autify/bin/autify" "$WORKSPACE/autify/bin/autify"

"$WORKSPACE/autify/bin/autify" --version
