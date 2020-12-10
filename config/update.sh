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

cd $SIMPLE_PATH

info "Cleaning generated symlinks"
git clean -fXq $SIMPLE_PATH/bin/*

info "Updating Repo at $SIMPLE_PATH"
cd $SIMPLE_PATH
git pull

if [[ $1 == "--node" ]]; then
    info "Removing .simple node"
    git clean -Xfq $SIMPLE_PATH/bin/.node  
    git clean -Xfq $SIMPLE_PATH/node_modules/  

    info "Downloading node.js to your .simple directory"
    $SIMPLE_PATH/config/install-node.sh --prefix $SIMPLE_PATH/bin/.node --yes
fi

$SIMPLE_PATH/config/upgrade.sh