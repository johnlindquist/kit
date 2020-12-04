#!/usr/bin/env zsh
for file in $JS_PATH/src/*.mjs; do
    chmod +x $file
    # Strip the path
    symName=${file##*/}
    # Strip the .mjs extension
    symName=${symName%.mjs}
    # Create the alias
    ln -s $file $JS_PATH/bin/$symName
done