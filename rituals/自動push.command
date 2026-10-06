#!/bin/bash
# ux-rec - push 薄殼(接 machine/specs/01-deploy.md)
# 本檔放在 ux-rec/rituals/ 內

REC_PROJECT="ux-rec"
REC_DEPLOY_URL="https://spiral.rec.ooo"

# 專案根 = 本腳本目錄的上一層(rituals/ 在專案根下)
REC_PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 自動找 machine/lib(從專案根 walk-up)
_d="$REC_PROJECT_DIR"
while [[ "$_d" != "/" && ! -d "$_d/sov/machine/lib" ]]; do _d="$(dirname "$_d")"; done
# 跨 Root fallback: 找不到時試兄弟 DungeonsRoot
[[ -d "$_d/sov/machine/lib" ]] || _d="$(cd "$REC_PROJECT_DIR/../../DungeonsRoot" 2>/dev/null && pwd)"
MACHINE_LIB="${MACHINE_LIB:-$_d/sov/machine/lib}"

source "$MACHINE_LIB/rec-push.sh"
rec_push "$@"
