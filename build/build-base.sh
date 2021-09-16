cd $WD
echo $WD

rm -r $KIT 2> /dev/null
mkdir -p $KIT
cp -a root/. $KIT
cp -r build $KIT
./build/install-node.sh --prefix $KIT/node
cp -r types $KIT
find $KIT/types -type f -exec sed -i '' 's/\.\.\/src/\.\./g' {} \;
cp *.md package*.json LICENSE $KIT

npx tsc --outDir $KIT
npx tsc --project ./tsconfig-cjs.json --outDir "$KIT/cjs"
node ./scripts/cjs-fix.js

cd $KIT
echo $KIT
npm i --production