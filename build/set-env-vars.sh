set -e

export KIT="${KIT:="$HOME/.kit"}"
export PATH="$KIT/node/bin:$PATH"
export WD=$(cd "$(dirname ${BASH_SOURCE[0]})"/.. &> /dev/null && pwd)
