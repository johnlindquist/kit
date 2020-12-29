#!/bin/sh

set -e

BOLD="$(tput bold 2>/dev/null || echo '')"
GREY="$(tput setaf 0 2>/dev/null || echo '')"
GREEN="$(tput setaf 2 2>/dev/null || echo '')"
NO_COLOR="$(tput sgr0 2>/dev/null || echo '')"
reset="\033[0m"
red="\033[31m"
green="\033[32m"
yellow="\033[33m"
cyan="\033[36m"
white="\033[37m"

info() {
  printf "${BOLD}${GREY}>${NO_COLOR} $@\n"
}

complete() {
  printf "${GREEN}✓${NO_COLOR} $@\n"
}

info "Cloning the repo to $SIMPLE_PATH..."
git clone https://github.com/johnlindquist/simplescripts.git $SIMPLE_PATH ${GITHUB_HEAD_REF_SLUG_URL:+--branch $GITHUB_HEAD_REF_SLUG_URL}
complete "Repo cloned to $SIMPLE_PATH"

info "Downloading node.js to your $SIMPLE_PATH..."
$SIMPLE_PATH/config/install-node.sh --prefix $SIMPLE_PATH/bin/.node --yes
complete "node.js downloaded to the $SIMPLE_PATH"

complete "Connected simple to simple's local node install"

SIMPLE_NODE=$SIMPLE_PATH/bin/.node/bin/node
SIMPLE_NPM=$SIMPLE_PATH/bin/.node/bin/npm
$SIMPLE_PATH/config/create-bins.sh
complete "Created script wrappers in bin dir"

SIMPLE_PROFILE="$($SIMPLE_PATH/config/detect-profile.sh)" \
$SIMPLE_PATH/config/link-profile.sh

cd $SIMPLE_PATH
PATH="$SIMPLE_PATH/bin/.node/bin:$PATH" $SIMPLE_PATH/bin/.node/bin/npm install
complete "Installed simple npm packages"

cp $SIMPLE_PATH/config/template-env.env $SIMPLE_PATH/.env

echo -e "SIMPLE_PATH=$SIMPLE_PATH" >> "$SIMPLE_PATH/.env"
echo -e "SIMPLE_NPM=$SIMPLE_NPM" >> "$SIMPLE_PATH/.env"
echo -e "SIMPLE_NODE=$SIMPLE_NODE" >> "$SIMPLE_PATH/.env"

complete "Created .env"

complete "Welcome to Simple Scripts!"
echo "type ${BOLD}${GREEN}simple ${NO_COLOR}and hit enter to get started:"
