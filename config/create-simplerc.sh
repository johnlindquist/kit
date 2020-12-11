#!/usr/bin/env zsh
cat > $SIMPLE_PATH/.simplerc <<EOF
export SIMPLE_NODE=$SIMPLE_NODE
export SIMPLE_NPM=$SIMPLE_NPM
export SIMPLE_PATH=$SIMPLE_PATH
export PATH="\$PATH:$SIMPLE_PATH/bin"
EOF