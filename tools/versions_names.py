#!/usr/bin/env python3
"""versions/names.json(本機才有): /versions 每一版「給哪一家」(2026-11-05).

正本 = b-rec 🎀 專案開發書/p-rec/05-公司代號.md〈對照表〉: 一行 `| https://p.rec.ooo/<path> | 給誰 | ... |`.
repo recdnd/rec-ux 是 Public, 所以 names.json 在 .gitignore, 不上線; 線上的 /versions 只顯示內容.
用法: python3 tools/admin_names.py   (05 的表改了就再跑一次)
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "b-rec" / "docs" / "🎀 專案開發書" / "p-rec" / "05-公司代號.md"
OUT = ROOT / "versions" / "names.json"

names = {}
for line in SRC.read_text(encoding="utf-8").splitlines():
    m = re.match(r"^\|\s*https://p\.rec\.ooo/([^ |]*)\s*\|\s*([^|]+?)\s*\|", line)
    if m:
        names[m.group(1)] = m.group(2)
OUT.write_text(json.dumps(names, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(names)
