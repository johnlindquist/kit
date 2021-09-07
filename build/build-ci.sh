set -e

export WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &> /dev/null && pwd)
export KIT="$WD/.kit"
export PATH="$KIT/node/bin:$PATH"

cd $WD
echo $WD

mkdir -p $KIT
cp -a root/. $KIT
./build/install-node.sh --prefix $KIT/node
cp -r types $KIT
cp *.md package*.json LICENSE $KIT

node --version
npm --version
npm i
npx tsc --outDir $KIT
npx tsc --project ./tsconfig-cjs.json --outDir "$KIT/cjs"
node ./scripts/fix-cjs.js