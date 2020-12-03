#!/usr/bin/env zsh

"Cloning the repo to ~/.js"
git clone https://github.com/johnlindquist/.js.git ~/.js

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
nvm install node

echo "Attaching .js to the latest node version"
echo '\nexport JS_NODE='$(nvm which node) >> ~/.js/.jsrc

echo "Adding .js to .zshrc"
echo '\nsource ~/.js/.jsrc' >> ~/.zshrc

echo "Sourcing .zshrc"
source ~/.zshrc

echo "Installing npm packages"
cd ~/.js
$JS_NODE install

echo "Verify your installation: "
echo "type 'joke' and hit enter"
