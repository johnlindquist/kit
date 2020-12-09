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
$JS_PATH/config/create-symlinks.sh

info "Creating js executable"
cp $JS_PATH/config/js-template.sh $JS_PATH/bin/js
chmod +x $JS_PATH/bin/js

info "Adding .js to .zshrc"
echo '\nsource '$JS_PATH'/.jsrc' >> ~/.zshrc

info "Installing npm packages"
cd $JS_PATH
$JS_NPM install

info "Sourcing .jsrc for first run"
source $JS_PATH/.jsrc

info "Creating .env file"
$JS_PATH/config/create-env.sh

info "Verify your installation: "
complete "type 'js' and hit enter"
