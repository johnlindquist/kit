set -e

export WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &>/dev/null && pwd)
export KIT="$WD/.kit"
export KNODE="$WD/.knode"
export PATH="$KNODE:$PATH"

cd $WD
echo $WD

mkdir -p $KIT
cp -a root/. $KIT
cp -r build $KIT
cp -r src/types $KIT

cp *.md package*.json LICENSE $KIT

./build/install-node.sh v18.15.0 --prefix $KNODE

node --version
npm --version
npm i
npx tsc --outDir $KIT
npx tsc --project ./tsconfig-declaration.json --outDir $KIT
npx tsc --project ./tsconfig-cjs.json --outDir "$KIT/cjs"
node ./scripts/cjs-fix.js
