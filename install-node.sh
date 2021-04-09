#!/bin/sh

# `install-node.vercel.app` is a simple one-liner shell script to
# install official Node.js binaries from `nodejs.org/dist` or other
# blessed sources (i.e. Alpine Linux builds are not on nodejs.org)
#
# For newest Node.js version:
#
#   $ curl -sL install-node.vercel.app | sh

# For latest LTS Node.js version:
#
#   $ curl -sL install-node.vercel.app/lts | sh
#
# Install a specific version (ex: v8.9.0):
#
#   $ curl -sL install-node.vercel.app/v8.9.0 | sh
#
# Semver also works (ex: v4.x.x):
#
#   $ curl -sL install-node.vercel.app/4 | sh
#
# Options may be passed to the shell script with `-s --`:
#
#   $ curl -sL install-node.vercel.app | sh -s -- --prefix=$HOME --version=8 --verbose
#   $ curl -sL install-node.vercel.app | sh -s -- -P $HOME -v 8 -V
#
# Patches welcome!
# https://github.com/zeit/install-node.vercel.app
# Nathan Rajlich <nate@zeit.co>
set -eu

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

fetch() {
  local command
  if hash curl 2>/dev/null; then
    set +e
    command="curl --silent --fail $1"
    curl --silent --fail "$1"
    rc=$?
    set -e
  else
    if hash wget 2>/dev/null; then
      set +e
      command="wget -O- -q $1"
      wget -O- -q "$1"
      rc=$?
      set -e
    else
      error "No HTTP download program (curl, wget) found…"
      exit 1
    fi
  fi

  if [ $rc -ne 0 ]; then
    error "Command failed (exit code $rc): ${BLUE}${command}${NO_COLOR}"
    exit $rc
  fi
}

resolve_node_version() {
  local tag="$1"
  if [ "${tag}" = "latest" ]; then
    tag=
  fi
  fetch "https://resolve-node.vercel.app/$tag"
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
    fi

    # `uname -m` in some cases mis-reports 32-bit OS as 64-bit, so double check
    if [ "${arch}" = "x64" ] && [ "$(getconf LONG_BIT)" -eq 32 ]; then
      arch=x86
    fi

    echo "${arch}"
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

if [ -z "${BASE_URL-}" ]; then
  BASE_URL="https://nodejs.org/dist"
fi

# parse argv variables
while [ "$#" -gt 0 ]; do
  case "$1" in
    -v|--version) VERSION="$2"; shift 2;;
    -p|--platform) PLATFORM="$2"; shift 2;;
    -P|--prefix) PREFIX="$2"; shift 2;;
    -a|--arch) ARCH="$2"; shift 2;;
    -b|--base-url) BASE_URL="$2"; shift 2;;

    -V|--verbose) VERBOSE=1; shift 1;;
    -f|-y|--force|--yes) FORCE=1; shift 1;;

    -v=*|--version=*) VERSION="${1#*=}"; shift 1;;
    -p=*|--platform=*) PLATFORM="${1#*=}"; shift 1;;
    -P=*|--prefix=*) PREFIX="${1#*=}"; shift 1;;
    -a=*|--arch=*) ARCH="${1#*=}"; shift 1;;
    -b=*|--base-url=*) BASE_URL="${1#*=}"; shift 1;;
    -V=*|--verbose=*) VERBOSE="${1#*=}"; shift 1;;
    -f=*|-y=*|--force=*|--yes=*) FORCE="${1#*=}"; shift 1;;

    -*) error "Unknown option: $1"; exit 1;;
    *) VERSION="$1"; shift 1;;
  esac
done

# Resolve the requested version tag into an existing Node.js version
RESOLVED="$(resolve_node_version "$VERSION")"
if [ -z "${RESOLVED}" ]; then
  error "Could not resolve Node.js version ${MAGENTA}${VERSION}${NO_COLOR}"
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
if [ ! -z "${VERBOSE-}" ]; then
  VERBOSE=v
  info "${BOLD}Verbose${NO_COLOR}: yes"
else
  VERBOSE=
fi

echo

# Alpine Linux binaries get downloaded from `nodejs-binaries.zeit.sh`
if [ "$PLATFORM" = "linux_musl" -o \( "$PLATFORM" = "win" -a "$RESOLVED" = "v5.12.0" \) ]; then
  BASE_URL="https://nodejs-binaries.zeit.sh"
fi

EXT=tar.gz
if [ "${PLATFORM}" = win ]; then
  EXT=zip
fi

URL="${BASE_URL}/${RESOLVED}/node-${RESOLVED}-${PLATFORM}-${ARCH}.tar.gz"
info "Tarball URL: ${UNDERLINE}${BLUE}${URL}${NO_COLOR}"

info "Installing Node.js, please wait…"

if [ "${EXT}" = zip ]; then
  fetch "${URL}" \
    | tar xzf${VERBOSE} - \
      --exclude CHANGELOG.md \
      --exclude LICENSE \
      --exclude README.md \
      --strip-components 1 \
      -C "${PREFIX}"
else
  fetch "${URL}" \
    | tar xzf${VERBOSE} - \
      --exclude CHANGELOG.md \
      --exclude LICENSE \
      --exclude README.md \
      --strip-components 1 \
      -C "${PREFIX}"
fi

complete "Done"