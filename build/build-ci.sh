set -e

export WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &> /dev/null && pwd)
export KIT="$WD/dist"
export PATH="$KIT/node/bin:$PATH"

"$WD/build/build-base.sh"