#!/usr/bin/env zsh
cat > $JS_PATH/bin/js <<EOF
#!/bin/zsh

if [[ $1 == "i" ]]; then
    cd $JS_PATH
    $JS_NPM install $2
    return
fi

if [[ $1 == "un" ]]; then
    cd $JS_PATH
    $JS_NPM uninstall $2
    return
fi

if [[ $1 == "env" ]]; then
    $EDITOR $JS_PATH/.env
    return
fi

if [[ $1 == "fix" ]]; then
    cd $JS_PATH
    $JS_NPM audit fix --force
    return
fi

if [[ $1 == "ls" ]]; then    
    ls $JS_PATH/bin
    return
fi

if [[ $1 == "edit" ]]; then
    $EDITOR $JS_PATH
    return
fi


NODE_PATH=$JS_PATH/node_modules \\
DOTENV_CONFIG_PATH=$JS_PATH/.env \\
$JS_NODE \\
--require dotenv/config \\
--require "$JS_PATH/globals/index.cjs" \\
"\$@"
EOF

chmod +x $JS_PATH/bin/js