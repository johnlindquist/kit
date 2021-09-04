WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &> /dev/null && pwd)
KIT="$WD/dist"

rm -r $KIT 2> /dev/null
mkdir -p $KIT
npx tsc --outDir $KIT
cp -a root/. $KIT
cp *.md *.json LICENSE $KIT