# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.234.0/containers/typescript-node/.devcontainer/base.Dockerfile

# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon):
# see https://github.com/devcontainers/images/tree/main/src/typescript-node
ARG VARIANT="20-bullseye"
FROM mcr.microsoft.com/devcontainers/typescript-node:${VARIANT}
# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends p7zip-full nsis default-jre tig

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node packages
# RUN su node -c "npm install -g <your-package-list -here>"

RUN curl https://autify-cli-assets.s3.amazonaws.com/autify-cli/channels/stable/install-standalone.sh | sh

# To avoid annoying message because this directory is created as root by mounts in devcontainer.json
RUN mkdir -p /home/node/.config && chown node: /home/node/.config
