#!/bin/bash
set -euo pipefail

# `install-node.vercel.app` is a simple one-liner bash script
# to install Node.js binaries from `nodejs.org/dist` or
# `unofficial-builds.nodejs.org/download/release`.
#
# For newest Node.js version:
#
#   $ curl -sfLS install-node.vercel.app | bash
#
# For latest LTS Node.js version:
#
#   $ curl -sfLS install-node.vercel.app/lts | bash
#
# Install a specific version (ex: v8.9.0):
#
#   $ curl -sfLS install-node.vercel.app/v8.9.0 | bash
#
# Semver also works (ex: v4.x.x):
#
#   $ curl -sfLS install-node.vercel.app/4 | bash
#
# Options may be passed to the shell script with `-s --`:
#
#   $ curl -sfLS install-node.vercel.app | bash -s -- --prefix=$HOME --version=8 --verbose
#   $ curl -sfLS install-node.vercel.app | bash -s -- -P $HOME -v 8 -V
#
# Patches welcome!
# https://github.com/vercel/install-node
# Nathan Rajlich <nate@vercel.com>

BOLD="$(tput bold 2>/dev/null || echo '')"
GREY="$(tput setaf 0 2>/dev/null || echo '')"
UNDERLINE="$(tput smul 2>/dev/null || echo '')"
RED="$(tput setaf 1 2>/dev/null || echo '')"
GREEN="$(tput setaf 2 2>/dev/null || echo '')"
YELLOW="$(tput setaf 3 2>/dev/null || echo '')"
BLUE="$(tput setaf 4 2>/dev/null || echo '')"
MAGENTA="$(tput setaf 5 2>/dev/null || echo '')"
CYAN="$(tput setaf 6 2>/dev/null || echo '')"
NO_COLOR="$(tput sgr0 2>/dev/null || echo '')"

info() {
  printf "${BOLD}${GREY}>${NO_COLOR} $@\n"
}

warn() {
  printf "${YELLOW}! $@${NO_COLOR}\n"
}

error() {
  printf "${RED}x $@${NO_COLOR}\n" >&2
}

complete() {
  printf "${GREEN}✓${NO_COLOR} $@\n"
}

# Currently known to support:
#   - win (Git Bash)
#   - darwin
#   - linux
#   - linux_musl (Alpine)
detect_platform() {
  local platform="$(uname -s | tr '[:upper:]' '[:lower:]')"

  # check for MUSL
  if [ "${platform}" = "linux" ]; then
    if ldd /bin/sh | grep -i musl >/dev/null; then
      platform=linux_musl
    fi
  fi

  # mingw is Git-Bash
  if echo "${platform}" | grep -i mingw >/dev/null; then
    platform=win
  fi

  echo "${platform}"
}

# Currently known to support:
#   - x64 (x86_64)
#   - x86 (i386)
#   - armv6l (Raspbian on Pi 1/Zero)
#   - armv7l (Raspbian on Pi 2/3)
#   - arm64 (Apple M1)
detect_arch() {
  local arch="$(uname -m | tr '[:upper:]' '[:lower:]')"

  if echo "${arch}" | grep -i arm >/dev/null; then
    # ARM is fine
    echo "${arch}"
  else
    if [ "${arch}" = "i386" ]; then
      arch=x86
    elif [ "${arch}" = "x86_64" ]; then
      arch=x64
    elif [ "${arch}" = "aarch64" ]; then
      arch=arm64
    fi

    # `uname -m` in some cases mis-reports 32-bit OS as 64-bit, so double check
    if [ "${arch}" = "x64" ] && [ "$(getconf LONG_BIT)" -eq 32 ]; then
      arch=x86
    fi

    echo "${arch}"
  fi
}

confirm() {
  if [ -z "${FORCE-}" ]; then
    printf "${MAGENTA}?${NO_COLOR} $@ ${BOLD}[yN]${NO_COLOR} "
    set +e
    read yn < /dev/tty
    rc=$?
    set -e
    if [ $rc -ne 0 ]; then
      error "Error reading from prompt (please re-run with the \`--yes\` option)"
      return 1
    fi
    if [ "$yn" != "y" ] && [ "$yn" != "yes" ]; then
      error "Aborting (please answer \"yes\" to continue)"
      return 1
    fi
  fi
}

check_prefix() {
  local bin="$1/bin"

  # https://stackoverflow.com/a/11655875
  local good=$( IFS=:
    for path in $PATH; do
      if [ "${path}" = "${bin}" ]; then
        echo 1
        break
      fi
    done
  )

  if [ "${good}" != "1" ]; then
    warn "Prefix bin directory ${bin} is not in your \$PATH"
  fi
}

# defaults
if [ -z "${VERSION-}" ]; then
  VERSION=latest
fi

if [ -z "${PLATFORM-}" ]; then
  PLATFORM="$(detect_platform)"
fi

if [ -z "${PREFIX-}" ]; then
  PREFIX=/usr/local
fi

if [ -z "${ARCH-}" ]; then
  ARCH="$(detect_arch)"
fi

# parse argv variables
while [ "$#" -gt 0 ]; do
  case "$1" in
    -v|--version) VERSION="$2"; shift 2;;
    -p|--platform) PLATFORM="$2"; shift 2;;
    -P|--prefix) PREFIX="$2"; shift 2;;
    -a|--arch) ARCH="$2"; shift 2;;

    -V|--verbose) VERBOSE=1; shift 1;;
    -f|-y|--force|--yes) FORCE=1; shift 1;;

    -v=*|--version=*) VERSION="${1#*=}"; shift 1;;
    -p=*|--platform=*) PLATFORM="${1#*=}"; shift 1;;
    -P=*|--prefix=*) PREFIX="${1#*=}"; shift 1;;
    -a=*|--arch=*) ARCH="${1#*=}"; shift 1;;
    -V=*|--verbose=*) VERBOSE="${1#*=}"; shift 1;;
    -f=*|-y=*|--force=*|--yes=*) FORCE="${1#*=}"; shift 1;;

    -*) error "Unknown option: $1"; exit 2;;
    *) VERSION="$1"; shift 1;;
  esac
done

# Resolve the requested version tag into an existing Node.js version
HEADERS="$(curl -sfLSI "https://resolve-node.vercel.app/?tag=${VERSION}&platform=${PLATFORM}&arch=${ARCH}")"
RESOLVED="$(echo "$HEADERS" | grep "x-node-version" | awk 'BEGIN{RS="\r\n";} /^x-node-version/{print $2}')"
PLATFORM="$(echo "$HEADERS" | grep "x-platform" | awk 'BEGIN{RS="\r\n";} /^x-platform/{print $2}')"
ARCH="$(echo "$HEADERS" | grep "x-arch" | awk 'BEGIN{RS="\r\n";} /^x-arch/{print $2}')"

if [ -z "${RESOLVED}" ]; then
  error "Could not resolve Node.js version ${MAGENTA}${RESOLED}${NO_COLOR}"
  exit 1
fi

PRETTY_VERSION="${GREEN}${RESOLVED}${NO_COLOR}"
if [ "$RESOLVED" != "v$(echo "$VERSION" | sed 's/^v//')" ]; then
  PRETTY_VERSION="$PRETTY_VERSION (resolved from ${CYAN}${VERSION}${NO_COLOR})"
fi
printf "  ${UNDERLINE}Configuration${NO_COLOR}\n"
info "${BOLD}Version${NO_COLOR}:  ${PRETTY_VERSION}"
info "${BOLD}Prefix${NO_COLOR}:   ${GREEN}${PREFIX}${NO_COLOR}"
info "${BOLD}Platform${NO_COLOR}: ${GREEN}${PLATFORM}${NO_COLOR}"
info "${BOLD}Arch${NO_COLOR}:     ${GREEN}${ARCH}${NO_COLOR}"

# non-empty VERBOSE enables verbose untarring
if [ -n "${VERBOSE-}" ]; then
  VERBOSE=v
  info "${BOLD}Verbose${NO_COLOR}: yes"
else
  VERBOSE=
fi

echo

URL="$(echo "$HEADERS" | grep "x-download-url" | awk 'BEGIN{RS="\r\n";} /^x-download-url/{print $2}')"
info "Tarball URL: ${UNDERLINE}${BLUE}${URL}${NO_COLOR}"
check_prefix "${PREFIX}"
confirm "Install Node.js ${GREEN}${RESOLVED}${NO_COLOR} to ${BOLD}${GREEN}${PREFIX}${NO_COLOR}?"

info "Installing Node.js, please wait…"

curl -sfLS "${URL}" \
  | tar xzf${VERBOSE} - \
    --exclude CHANGELOG.md \
    --exclude LICENSE \
    --exclude README.md \
    --strip-components 1 \
    -C "${PREFIX}"

complete "Done"