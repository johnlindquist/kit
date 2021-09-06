cd $WD
echo $WD

rm -r $KIT 2> /dev/null
mkdir -p $KIT
cp -a root/. $KIT
./build/install-node.sh --prefix $KIT/node
cp -r types $KIT
cp *.md package*.json LICENSE $KIT

npx tsc --outDir $KIT
npx tsc --project ./tsconfig-cjs.json --outDir "$KIT/cjs"
node ./scripts/fix-cjs.js

cd $KIT
echo $KIT
npm i --production