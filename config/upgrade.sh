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

info "Installing missing npm packages"
cd $JS_PATH
$JS_NPM install

info "Linking included scripts"
$JS_PATH/config/create-symlinks.sh

info "Creating js executable"
cp $JS_PATH/config/template-js.sh $JS_PATH/bin/js
chmod +x $JS_PATH/bin/js

complete "Upgrade complete"
info "type js and hit enter:"