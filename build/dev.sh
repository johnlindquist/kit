KIT="${KIT:="$HOME/.kit"}"
WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &> /dev/null && pwd)

cd $WD
echo $WD

npx tsc-watch --outDir $KIT & \
KIT=$KIT node ./scripts/cjs-dev.js

echo "*" >> "$KIT/.kitignore"