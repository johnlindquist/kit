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

cd $JS_PATH

info "Cleaning generated symlinks"
git clean -fXq $JS_PATH/bin/*

info "Updating Repo at $JS_PATH"
cd $JS_PATH
git pull

if [[ $1 == "--node" ]]; then
    info "Removing .js node"
    git clean -Xfq $JS_PATH/bin/.node  
    git clean -Xfq $JS_PATH/node_modules/  

    info "Downloading node.js to your .js directory"
    $JS_PATH/config/install-node.sh --prefix $JS_PATH/bin/.node --yes
fi

info "Installing missing npm packages"
cd $JS_PATH
$JS_NPM install

info "Linking included scripts"
$JS_PATH/config/create-symlinks.sh

info "Creating js executable"
cp $JS_PATH/config/js-template.sh $JS_PATH/bin/js
chmod +x $JS_PATH/bin/js

complete "Verify your installation: "
complete "type 'js' and hit enter"
