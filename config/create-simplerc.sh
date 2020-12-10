#!/usr/bin/env zsh
cat > $SIMPLE_PATH/.simplerc <<EOF

export SIMPLE_PATH=$SIMPLE_PATH
export SIMPLE_NODE=$SIMPLE_NODE
export SIMPLE_NPM=$SIMPLE_NPM

path+=$SIMPLE_PATH/bin
export PATH
EOF