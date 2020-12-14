#!/usr/bin/env zsh

BOLD="$(tput bold 2>/dev/null || echo '')"
GREY="$(tput setaf 0 2>/dev/null || echo '')"
GREEN="$(tput setaf 2 2>/dev/null || echo '')"
NO_COLOR="$(tput sgr0 2>/dev/null || echo '')"

info() {
  printf "${BOLD}${GREY}>${NO_COLOR} $@\n"
}

complete() {
  printf "${GREEN}✓${NO_COLOR} $@\n"
}

info "Cloning the repo to $SIMPLE_PATH..."
git clone https://github.com/johnlindquist/simplescripts.git $SIMPLE_PATH
complete "Repo cloned to $SIMPLE_PATH"

info "Downloading node.js to your $SIMPLE_PATH..."
$SIMPLE_PATH/config/install-node.sh --prefix $SIMPLE_PATH/bin/.node --yes
complete "node.js downloaded to the $SIMPLE_PATH"



info "Configuring simple in $SIMPLE_PATH..."
SIMPLE_NODE_PATH="$SIMPLE_PATH/bin/.node/bin" \
TESTING_SOME_VAR="$SIMPLE_PATH/bin/node/bin" \
TESTING_ANOTHER_VAR="$SIMPLE_PATH/bin/.node/bin/" \
SIMPLE_NODE="$SIMPLE_PATH/bin/.node/bin/node" \
SIMPLE_NPM="$SIMPLE_PATH/bin/.node/bin/npm" \
$SIMPLE_PATH/config/create-simplerc.sh

complete "Connected simple to simple's local node install"

$SIMPLE_PATH/config/create-bins.sh
complete "Created script wrappers in bin dir"

if grep -q $SIMPLE_PATH'/.simplerc' ~/.zshrc; then
  echo "Source already added to .zshrc"
  else
  echo -n '\nsource '$SIMPLE_PATH'/.simplerc' >> ~/.zshrc
fi
complete "Added simple to .zshrc"


cd $SIMPLE_PATH
PATH=$SIMPLE_NODE_PATH $SIMPLE_NPM install
complete "Installed simple npm packages"

cp $SIMPLE_PATH/config/template-env.env $SIMPLE_PATH/.env
complete "Created .env"

complete "Welcome to Simple Scripts!"
echo "type ${BOLD}${GREEN}simple ${NO_COLOR}and hit enter to get started:"