#!/usr/bin/env zsh

"Cloning the repo to $JS_PATH"
git clone https://github.com/johnlindquist/.js.git $JS_PATH

echo "Accessing nvm"
if [ -f ~/.nvm/nvm.sh ]; then
  echo 'sourcing nvm from ~/.nvm'
  . ~/.nvm/nvm.sh
elif command -v brew; then
  # https://docs.brew.sh/Manpage#--prefix-formula
  BREW_PREFIX=$(brew --prefix nvm)
  if [ -f "$BREW_PREFIX/nvm.sh" ]; then
    echo "sourcing nvm from brew ($BREW_PREFIX)"
    . $BREW_PREFIX/nvm.sh
  fi
fi

echo "Installing the latest version of Node.js"
nvm install node --latest-npm

export JS_NODE=$(nvm which node)
export JS_NPM=${JS_NODE%node}npm

echo "Attaching .js to the latest node and npm versions"
$JS_PATH/config/create-jsrc.sh

echo "Linking included scripts"
$JS_PATH/config/link.sh

echo "Creating js executable"
$JS_PATH/config/create-js.sh

echo "Adding .js to .zshrc"
echo '\nsource '$JS_PATH'/.jsrc' >> ~/.zshrc

echo "Sourcing .zshrc"
source ~/.zshrc

echo "Installing npm packages"
cd $JS_PATH
$JS_NPM install

echo "Verify your installation: "
echo "type 'joke' and hit enter"
