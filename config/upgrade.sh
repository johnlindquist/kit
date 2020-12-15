#!/bin/sh

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

info "Installing missing npm packages"
cd $SIMPLE_PATH
$SIMPLE_NPM install

info "Creating exectuables for scripts"
$SIMPLE_PATH/config/create-bins.sh

complete "Upgrade complete"
info "type simple and hit enter:"