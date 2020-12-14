#!/usr/bin/env zsh
cat > $SIMPLE_PATH/.simplerc <<EOF
export SIMPLE_NODE_PATH="$SIMPLE_PATH/bin/.node/bin"
export SIMPLE_NODE="$SIMPLE_PATH/bin/.node/bin/node"
export SIMPLE_NPM="$SIMPLE_PATH/bin/.node/bin/npm"
export SIMPLE_PATH="$SIMPLE_PATH"
export PATH="\$PATH:$SIMPLE_PATH/bin"
EOF