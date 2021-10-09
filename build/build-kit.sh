set -e

export KIT="${KIT:="$HOME/.kit"}"
export PATH="$KIT/node/bin:$PATH"
export WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &> /dev/null && pwd)

cd $WD
echo $WD

rm -r $KIT 2> /dev/null
mkdir -p $KIT
cp -a root/. $KIT
cp -r build $KIT
cp -r src/types $KIT
./build/install-node.sh v16.10.0 --prefix $KIT/node
cp *.md package*.json LICENSE $KIT

npx tsc --outDir $KIT
npx tsc --project ./tsconfig-declaration.json --outDir $KIT
npx tsc --project ./tsconfig-cjs.json --outDir "$KIT/cjs"


node ./scripts/cjs-fix.js

cd $KIT
echo $KIT
npm i --production

echo "*" >> "$KIT/.kitignore"