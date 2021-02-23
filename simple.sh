#!/bin/sh
SIMPLE_SDK="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

PATH="$SIMPLE_SDK/node/bin:$PATH"
NODE_PATH="$SIMPLE_SDK/node_modules"
SIMPLE_NODE="$SIMPLE_SDK/node/bin/node"
SIMPLE_NPM="$SIMPLE_SDK/node/bin/npm"
SIMPLE_PRELOAD="$SIMPLE_SDK/preload"

SIMPLE_SDK="$SIMPLE_SDK" \
PATH="$PATH" \
SIMPLE_PATH="$SIMPLE_PATH" \
NODE_PATH="$NODE_PATH" \
SIMPLE_NODE="$SIMPLE_NODE" \
SIMPLE_NPM="$SIMPLE_NPM" \
SIMPLE_PRELOAD="$SIMPLE_PRELOAD" \
node \
--require "$SIMPLE_PRELOAD/api.cjs" \
--require "$SIMPLE_PRELOAD/simple.cjs" \
--require "$SIMPLE_PRELOAD/mac.cjs" \
"$@"