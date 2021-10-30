set -e

export KIT="${KIT:="$HOME/.kit"}"
export PATH="$KIT/node/bin:$PATH"
export WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &>/dev/null && pwd)

cd $WD
echo $WD

rm -r $KIT 2>/dev/null
mkdir -p $KIT
cp -a root/. $KIT
cp -r build $KIT
cp -r src/types $KIT

./build/install-node.sh v17.0.1 --prefix $KIT/node
cp *.md package*.json LICENSE $KIT

echo "Building ESM kit to $KIT"
npx tsc --outDir $KIT

echo "Build declarations to $KIT"
npx tsc --project ./tsconfig-declaration.json --outDir $KIT

echo "Build CJS to $KIT/cjs"
npx tsc --project ./tsconfig-cjs.json --outDir "$KIT/cjs"

node ./scripts/cjs-fix.js

cd $KIT
echo $KIT
npm i --production

echo "*" >>"$KIT/.kitignore"
