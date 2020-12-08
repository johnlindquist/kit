#!/usr/bin/env zsh

"Cloning the repo to $JS_PATH"
git clone https://github.com/johnlindquist/.js.git $JS_PATH

echo "Downloading node.js to your .js directory"
$JS_PATH/config/install-node.sh --prefix $JS_PATH/bin/.node --yes

export JS_NODE=$JS_PATH/bin/.node/bin/node
export JS_NPM=$JS_PATH/bin/.node/bin/npm

echo "Attaching .js to the the downloaded node and npm"
$JS_PATH/config/create-jsrc.sh

echo "Linking included scripts"
$JS_PATH/config/create-symlinks.sh

echo "Creating js executable"
$JS_PATH/config/create-js.sh

echo "Adding .js to .zshrc"
echo '\nsource '$JS_PATH'/.jsrc' >> ~/.zshrc

echo "Installing npm packages"
cd $JS_PATH
$JS_NPM install

echo "Sourcing .jsrc for first run"
source $JS_PATH/.jsrc

echo "Creating .env file"
$JS_PATH/config/create-env.sh

echo "Verify your installation: "
echo "type 'js' and hit enter"
