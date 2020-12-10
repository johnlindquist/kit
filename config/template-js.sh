#!/bin/zsh

source $JS_PATH/.env

if [ $# -eq 0 ];  then
    js-interactive
    return
fi

if [ -L $1 ]; then
    NODE_PATH=$JS_PATH/node_modules \
    DOTENV_CONFIG_PATH=$JS_PATH/.env \
    $JS_NODE \
    --require dotenv-with-expand/config \
    --require "$JS_PATH/globals/index.cjs" \
    "$@"
    else
    js-interactive $1
fi