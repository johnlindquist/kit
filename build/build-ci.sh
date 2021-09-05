WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &> /dev/null && pwd)
KIT="$WD/dist"

cd $WD
echo $WD

rm -r $KIT 2> /dev/null
mkdir -p $KIT
cp -a root/. $KIT
cp types $KIT
cp *.md *.json LICENSE .npmignore $KIT

./build/install-node.sh --prefix $KIT/node
PATH="$KIT/node/bin" npm i

npx tsc --outDir $KIT

cd $KIT
PATH="$KIT/node/bin" npm i --production