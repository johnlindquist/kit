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

info "Cloning the repo to $SIMPLE_PATH"
git clone https://github.com/johnlindquist/.js.git $SIMPLE_PATH

info "Downloading node.js to your .js directory"
$SIMPLE_PATH/config/install-node.sh --prefix $SIMPLE_PATH/bin/.node --yes

export SIMPLE_NODE=$SIMPLE_PATH/bin/.node/bin/node
export SIMPLE_NPM=$SIMPLE_PATH/bin/.node/bin/npm

info "Attaching simple to the the downloaded node and npm"
$SIMPLE_PATH/config/create-simplerc.sh

info "Linking included scripts"
$SIMPLE_PATH/config/create-bins.sh

info "Adding simple to .zshrc"
if grep -q $SIMPLE_PATH'/.simplerc' ~/.zshrc; then
  echo "Source already added to .zshrc"
  else
  echo -n '\nsource '$SIMPLE_PATH'/.simplerc' >> ~/.zshrc
fi

info "Installing npm packages"
cd $SIMPLE_PATH
$SIMPLE_NPM install

info "Sourcing .simplerc for first run"
source $SIMPLE_PATH/.simplerc

info "Creating .env file"
cp $SIMPLE_PATH/config/template-env.env $SIMPLE_PATH/.env

complete "Welcome to JavaScript Scripts!"
info "type 'js' and hit enter to get started:"