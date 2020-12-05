#!/usr/bin/env zsh
cat > $JS_PATH/bin/js <<EOF
#!/bin/zsh

NODE_PATH=$JS_PATH/node_modules \\
DOTENV_CONFIG_PATH=$JS_PATH/.env \\
$JS_NODE \\
--require dotenv/config \\
--require "$JS_PATH/globals/index.cjs" \\
"\$@"
EOF

chmod +x $JS_PATH/bin/js