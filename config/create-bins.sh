#!/usr/bin/env zsh
for file in $JS_PATH/src/*.mjs; do
    # Strip the path
    binName=${file##*/}
    # Strip the .mjs extension
    binName=${binName%.mjs}
    # Create the alias
    sed "s/{{name}}/$binName/g" $JS_PATH/config/template-bin > $JS_PATH/bin/$binName
    chmod +x $JS_PATH/bin/$binName
done