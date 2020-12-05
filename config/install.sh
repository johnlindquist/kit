#!/usr/bin/env zsh

"Cloning the repo to $JS_PATH"
git clone https://github.com/johnlindquist/.js.git $JS_PATH

echo "Installing the latest version of Node.js"
curl -sL install-node.now.sh | sh -s -- --prefix $JS_PATH/bin/.node --yes

export JS_NODE=$JS_PATH/bin/.node/bin/node
export JS_NPM=$JS_PATH/bin/.node/bin/npm

echo "Attaching .js to the latest node and npm versions"
$JS_PATH/config/create-jsrc.sh

echo "Linking included scripts"
$JS_PATH/config/create-symlinks.sh

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
