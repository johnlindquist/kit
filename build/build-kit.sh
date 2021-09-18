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
./build/install-node.sh --prefix $KIT/node
mkdir -p $KIT/types
cp types/kit.d.ts $KIT
cp -r declarations $KIT
find $KIT/types -type f -exec sed -i '' 's/\.\.\/src/\.\./g' {} \;
cp *.md package*.json LICENSE $KIT

npx tsc --outDir $KIT
npx tsc --project ./tsconfig-declaration.json --outDir $KIT
npx tsc --project ./tsconfig-cjs.json --outDir "$KIT/cjs"
node ./scripts/cjs-fix.js

cd $KIT
echo $KIT
npm i --production

echo "*" >> "$KIT/.kitignore"