#!/usr/bin/env zsh
cat > $JS_PATH/bin/js <<EOF
#!/bin/zsh

source \$JS_PATH/.env

if [ \$# -eq 0 ];  then
    js-interactive
    return
fi

if [[ \$1 == "i" ]]; then
    cd \$JS_PATH
    \$JS_NPM install \$2
    return
fi

if [[ \$1 == "un" ]]; then
    cd \$JS_PATH
    \$JS_NPM uninstall \$2
    return
fi

if [[ \$1 == "env" ]]; then
    \$EDITOR \$JS_PATH/.env
    return
fi

if [[ \$1 == "fix" ]]; then
    cd \$JS_PATH
    \$JS_NPM audit fix --force
    return
fi

if [[ \$1 == "ls" ]]; then    
    find \$JS_PATH/bin -maxdepth 1 -type l -exec basename {} \;
    return
fi

if [[ \$1 == "edit" ]]; then
    \$EDITOR \$JS_PATH
    return
fi

if [[ \$1 == "rm" ]]; then
    if [ -f \$JS_PATH/bin/\$2 ]; then
        rm \$JS_PATH/bin/\$2
        rm \$JS_PATH/src/\$2.mjs
    else
        echo "\$2 not found"
    fi
    return
fi

if [[ \$1 == "help" ]]; then
    js-interactive
    return
fi



NODE_PATH=\$JS_PATH/node_modules \\
DOTENV_CONFIG_PATH=\$JS_PATH/.env \\
\$JS_NODE \\
--require dotenv/config \\
--require "\$JS_PATH/globals/index.cjs" \\
"\$@"
EOF

chmod +x $JS_PATH/bin/js