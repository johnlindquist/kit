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

info "Cloning the repo to $JS_PATH"
git clone https://github.com/johnlindquist/.js.git $JS_PATH

info "Downloading node.js to your .js directory"
$JS_PATH/config/install-node.sh --prefix $JS_PATH/bin/.node --yes

export JS_NODE=$JS_PATH/bin/.node/bin/node
export JS_NPM=$JS_PATH/bin/.node/bin/npm

info "Attaching .js to the the downloaded node and npm"
$JS_PATH/config/create-jsrc.sh

info "Linking included scripts"
$JS_PATH/config/create-bins.sh

info "Adding .js to .zshrc"
if grep -q $JS_PATH'/.jsrc' ~/.zshrc; then
  echo "Source already added to .zshrc"
  else
  echo -n '\nsource '$JS_PATH'/.jsrc' >> ~/.zshrc
fi

info "Installing npm packages"
cd $JS_PATH
$JS_NPM install

info "Sourcing .jsrc for first run"
source $JS_PATH/.jsrc

info "Creating .env file"
cp $JS_PATH/config/template-env.env $JS_PATH/.env

complete "Welcome to JavaScript Scripts!"
info "type 'js' and hit enter to get started:"