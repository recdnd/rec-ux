#!/bin/bash
# ux-rec - localhost 薄殼(接 machine/specs/02-localhost.md)
# 本檔放在 ux-rec/rituals/ 內

REC_PROJECT="ux-rec"
REC_PORT="2323"
# REC_LOCAL_PATH="/"
# REC_BUILD_CMD="npm run build"
# REC_SERVE_CMD=""

REC_PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

_d="$REC_PROJECT_DIR"
while [[ "$_d" != "/" && ! -d "$_d/sov/machine/lib" ]]; do _d="$(dirname "$_d")"; done
[[ -d "$_d/sov/machine/lib" ]] || _d="$(cd "$REC_PROJECT_DIR/../../DungeonsRoot" 2>/dev/null && pwd)"
MACHINE_LIB="${MACHINE_LIB:-$_d/sov/machine/lib}"

source "$MACHINE_LIB/rec-serve.sh"
rec_serve "$@"
