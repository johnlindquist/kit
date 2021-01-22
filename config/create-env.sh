SIMPLE_NODE=$SIMPLE_PATH/node/bin/node
SIMPLE_NPM=$SIMPLE_PATH/node/bin/npm

sed "s#{{SIMPLE_PATH}}#$SIMPLE_PATH#g;s#{{SIMPLE_NODE}}#$SIMPLE_NODE#g;s#{{SIMPLE_NPM}}#$SIMPLE_NPM#g" \
$SIMPLE_PATH/config/template-env.env > $SIMPLE_PATH/.env
