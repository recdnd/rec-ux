#!/usr/bin/env python3
"""ux-rec 案例文案檢查(主筆 2026-11-02「案例寫法是否足夠好了, 每次都要檢查, 對齊ui/ux portfolio高級標準」).

標準正本: b-rec/docs/🎀 工表/p-rec/案例寫法工表.md. 這支只查機器查得出來的那一半, 另一半(畫面上有沒有 / 有沒有取捨)照工表的判斷題人工過.
用法: python3 tools/check_cases.py [id ...]   沒給 id = 全部. 有 ✗ 就 exit 1(.git/hooks/pre-commit 會擋 commit).
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "uiux"   # 2026-11-05 搬家: 站在 p.rec.ooo/uiux/, 資料跟著在 uiux/
FIELDS = ("title", "line", "problem", "move", "outcome")
# 長度上限: 英文算字數, 日文算字元. 一則卡片要能一眼掃完(2026-11-02 用通過的那幾則定)
EN_MAX = {"line": 14, "problem": 32, "move": 50, "outcome": 32}
JA_MAX = {"line": 40, "problem": 80, "move": 110, "outcome": 90}
# 空話: 只宣稱不描述的詞. 出現 = ✗(要換成畫面上真的有的東西)
BUZZ = ["seamless", "leverage", "first-class", "paradigm", "reposition", "holistic", "intuitive", "empower",
        "unlock", "elevate", "robust", "streamline", "synergy", "user-centric", "delightful", "cutting-edge",
        "innovative", "next-generation", "revolutionary", "game-chang", "frictionless", "best-in-class",
        "world-class", "state-of-the-art", "programmable", "legib", "recast", "collapse"]
JA_BUZZ = ["シームレス", "直感的", "革新的", "一級", "パラダイム", "プログラム可能", "格上げ"]
# 問題欄要有一個具體的人(誰卡住). 只寫 users / システム = 對誰都說得通 = 沒說
ACTORS = ["player", "listener", "reader", "writer", "buyer", "fan", "visitor", "people", "you", "someone", "anyone"]
STOP = set("a an the and or of to in on at for with by is are be as it its this that from into than then so not no".split())

def words(s):
    return re.findall(r"[A-Za-z][A-Za-z'-]*", s.lower())

def check(c):
    err, warn = [], []
    ja = c.get("ja") or {}
    for f in FIELDS:
        if not c.get(f): err.append(f"en.{f} 空")
        if not ja.get(f): err.append(f"ja.{f} 空")
    if not c.get("role"): err.append("role 空")
    if not ja.get("role"): err.append("ja.role 空")
    if len(c.get("role") or []) > 4: warn.append(f"role {len(c['role'])} 項, 最多 4")
    # 🧊 Singles 雪藏(主筆 11-02): 那時 Singles 一則一個產品, 標題 = 產品名, 不用翻也不查具體的人. 開回時換回下面兩行
    # single = c.get("board") == "singles"
    # if ja.get("title") == c.get("title") and not single:
    single = False
    if ja.get("title") == c.get("title"):
        err.append(f"ja.title 還是英文「{c.get('title')}」")
    for f, m in EN_MAX.items():
        n = len(words(c.get(f, "")))
        if n > m: err.append(f"en.{f} {n} 字 > {m}")
    for f, m in JA_MAX.items():
        n = len(ja.get(f, ""))
        if n > m: err.append(f"ja.{f} {n} 字 > {m}")
    en_all = " ".join(c.get(f, "") for f in FIELDS).lower()
    for b in BUZZ:   # 詞頭對齊(\b), 不然 forecast 會中 recast
        if re.search(r"\b" + re.escape(b), en_all): err.append(f"en 空話「{b}」")
    ja_all = "".join(ja.get(f, "") for f in FIELDS)
    for b in JA_BUZZ:
        if b in ja_all: err.append(f"ja 空話「{b}」")
    if re.search(r"ね[。」]|ね$", ja_all): err.append("ja 句末「ね」(主筆不用)")
    p = words(c.get("problem", ""))
    if "users" in p or "user" in p: warn.append("problem 寫 user(s): 換成具體的人(player / listener / reader / writer ...)")
    elif not any(w.startswith(a) for w in p for a in ACTORS) and not single:   # 詞頭比, readers / players 也算
        warn.append("problem 沒有具體的人: 誰卡住了?")
    mv = {w for w in words(c.get("move", "")) if w not in STOP}
    oc = {w for w in words(c.get("outcome", "")) if w not in STOP}
    if oc and len(mv & oc) / len(oc) > 0.5: warn.append("outcome 一半以上的詞跟 move 重複: 是不是在重講設計?")
    if c.get("video") and not (ROOT / c["video"]).exists(): err.append(f"影片不存在 {c['video']}")
    return err, warn

def main():
    cases = json.loads((ROOT / "data/cases.json").read_text())
    want = set(sys.argv[1:])
    bad = 0
    for c in cases:
        if want and c["id"] not in want: continue
        err, warn = check(c)
        mark = "✗" if err else ("△" if warn else "✓")
        print(f"{mark} {c['id']}")
        for e in err: print(f"    ✗ {e}")
        for w in warn: print(f"    △ {w}")
        bad += bool(err)
    print("\n判斷題(機器查不到, 每則人工過): 工表〈判斷題〉六條 -- b-rec/docs/🎀 工表/p-rec/案例寫法工表.md")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
