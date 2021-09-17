set -e

export WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &> /dev/null && pwd)
export KIT="$WD/.kit"
export PATH="$KIT/node/bin:$PATH"

cd $WD
echo $WD

mkdir -p $KIT
cp -a root/. $KIT
cp -r build $KIT
mkdir -p $KIT/types
cp types/kit.d.ts $KIT
cp -r declarations $KIT
find $KIT/types -type f -exec sed -i '' 's/\.\.\/src/\.\./g' {} \;
cp *.md package*.json LICENSE $KIT

./build/install-node.sh --prefix $KIT/node

node --version
npm --version
npm i
npx tsc --outDir $KIT
npx tsc --project ./tsconfig-cjs.json --outDir "$KIT/cjs"
node ./scripts/cjs-fix.js