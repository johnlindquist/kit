#!/usr/bin/env zsh
cat > $JS_PATH/.jsrc <<EOF

export JS_PATH=$JS_PATH
export JS_NODE=$JS_NODE
export JS_NPM=$JS_NPM

path+=$JS_PATH/bin
export PATH
EOF