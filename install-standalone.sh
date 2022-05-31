#!/bin/bash
{
    set -e
    SUDO=''
    if [ "$(id -u)" != "0" ]; then
      SUDO='sudo'
      echo "This script requires superuser access."
      echo "You will be prompted for your password by sudo."
      # clear any previous sudo permission
      sudo -k
    fi

    # run inside sudo
    $SUDO bash <<SCRIPT
  set -e

  echoerr() { echo "\$@" 1>&2; }

  if [[ ! ":\$PATH:" == *":/usr/local/bin:"* ]]; then
    echoerr "Your path is missing /usr/local/bin, you need to add this to use this installer."
    exit 1
  fi

  if [ "\$(uname)" == "Darwin" ]; then
    OS=darwin
  elif [ "\$(expr substr \$(uname -s) 1 5)" == "Linux" ]; then
    OS=linux
  else
    echoerr "This installer is only supported on Linux and MacOS"
    exit 1
  fi

  ARCH="\$(uname -m)"
  if [ "\$ARCH" == "x86_64" ]; then
    ARCH=x64
  elif [[ "\$ARCH" == aarch* ]]; then
    ARCH=arm
  elif [ "\$ARCH" == "arm64" ]; then
    ARCH=arm64
  else
    echoerr "Unsupported arch: \$ARCH"
    exit 1
  fi

  AUTIFY_S3_BUCKET=REPLACE
  AUTIFY_S3_PREFIX=REPLACE

  mkdir -p /usr/local/lib
  cd /usr/local/lib
  rm -rf autify
  rm -rf ~/.local/share/autify/client
  if [ \$(command -v xz) ]; then
    TAR_EXT="tar.xz"
    TAR_ARGS="xJ"
  else
    TAR_EXT="tar.gz"
    TAR_ARGS="xz"
  fi
  URL=https://\$AUTIFY_S3_BUCKET.s3.amazonaws.com/\$AUTIFY_S3_PREFIX-\$OS-\$ARCH.\$TAR_EXT
  echo "Installing CLI from \$URL"
  if [ \$(command -v curl) ]; then
    curl "\$URL" | tar "\$TAR_ARGS"
  else
    wget -O- "\$URL" | tar "\$TAR_ARGS"
  fi
  # delete old autify bin if exists
  rm -f \$(command -v autify) || true
  rm -f /usr/local/bin/autify
  ln -s /usr/local/lib/autify/bin/autify /usr/local/bin/autify

  # on alpine (and maybe others) the basic node binary does not work
  # remove our node binary and fall back to whatever node is on the PATH
  /usr/local/lib/autify/bin/node -v || rm /usr/local/lib/autify/bin/node

SCRIPT
  # test the CLI
  LOCATION=$(command -v autify)
  echo "autify installed to $LOCATION"
  autify --version
}