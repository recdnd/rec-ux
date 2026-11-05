#!/usr/bin/env python3
"""PD 版(product/)文案檢查(2026-11-05, 主筆「派席做一個pd版(product design)版, 文案和寫作方式, 都換一套」).

標準正本: b-rec/docs/🎀 工表/p-rec/PD版寫法工表.md. 這支只查機器查得出來的那一半, 判斷題照工表人工過.
用法: python3 tools/check_pd.py [id ...]   沒給 id = 全部. 有 ✗ 就 exit 1.
"""
import hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PD = ROOT / "product"
DR = ROOT.parent                                     # DungeonsRoot
sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_cases import JA_BUZZ                      # UI/UX 版的日文空話詞表, 共用

P_MAX = {"line": 45, "issue": 90, "offer": 110, "run": 110, "team": 60}
C_MAX = {"title": 26, "issue": 80, "options": 90, "decision": 120, "check": 90, "next": 60}
NOTE_MAX = 120
# PD 版自己的空話: 只宣稱不描述. 出現 = ✗
PD_BUZZ = ["最適化", "価値を最大化", "ユーザー中心", "寄り添", "様々な", "さまざまな", "検討を重ね", "ブラッシュアップ",
           "体験を向上", "UX を向上", "UXを向上", "ワクワク", "圧倒的", "徹底的", "課題解決力", "スピード感"]
# 紅線: 不寫這些(手寫代碼 0 那一類 / 成績)
RED = ["ノーコード", "コードを書かず", "手で書いたコード", "一行も書", "GPA", "成績"]
# 素材清單與每則的出處放在 b-rec 🎀(不部署): 這個 repo 是 Public, product/data 也會送出去, 所以不寫在這裡.
#   「」裡的字要在素材裡找得到 = 工表〈素材〉列出的檔; 出處 = 開發書 04 每個 id 一節
TABLE = DR / "b-rec/docs/🎀 工表/p-rec/PD版寫法工表.md"
SRC_BOOK = DR / "b-rec/docs/🎀 專案開發書/p-rec/04-PD版出處.md"
AI_PRODUCTS = {"spiral", "braintank"}   # AI 本身就是產品的: 課題 / 検討裡可以提 AI


def source_files():
    """工表〈素材〉裡反引號包住的檔(從 DungeonsRoot 算)"""
    sec = TABLE.read_text(encoding="utf-8").split("## 素材", 1)[1].split("\n## ", 1)[0]
    return [DR / f for f in re.findall(r"^- `([^`]+\.(?:json|html|py|txt))`", sec, flags=re.M)]


def src_book():
    """開發書 04: {id: (對應的 uiux id 或 None, 條數)}"""
    t = SRC_BOOK.read_text(encoding="utf-8")
    out = {}
    for blk in re.split(r"\n## ", t)[1:]:
        i = blk.split("\n", 1)[0].strip()
        u = re.search(r"對應: uiux `([^`]+)`", blk)
        out[i] = (u.group(1) if u else None, len([l for l in blk.splitlines() if l.startswith("- ") and not l.startswith("- 種類")]))
    return out
INTERN = "2026年10月、2日間。本番相当のECサービスを題材に、1人のプロダクトエンジニアとして改善を担当し、変更ごとに前後の数値を社員の方に報告した。"


def corpus():
    out = []
    for f in source_files():
        try:
            s = f.read_text(encoding="utf-8")
        except OSError:
            continue
        if f.suffix == ".json":   # json 裡的字是 \u 或原字都有可能, 解開再拼
            s = json.dumps(json.loads(s), ensure_ascii=False)
        out.append(re.sub(r"<[^>]+>", "", s))
    return "\n".join(out)


def norm(s):   # 比對「」時不管全形 / 半形括號與空白
    return re.sub(r"\s+", "", s.replace("（", "(").replace("）", ")"))


def bigrams(s):
    s = re.sub(r"[\s、。，「」（）()・/]", "", s)
    return {s[i:i + 2] for i in range(len(s) - 1)}


def overlap(a, b):
    A, B = bigrams(a), bigrams(b)
    return len(A & B) / len(B) if B else 0


def ja_checks(where, s, src_text, err, warn):
    if re.search(r"ね[。」）]|ね$", s): err.append(f"{where}: 句末「ね」")
    if re.search(r"(?<=[^\x00-\x7F])[,.]|(?<=[^\x00-\x7F])\s?[()]|[()](?=[^\x00-\x7F])", s): err.append(f"{where}: 日文裡有半形 , . ( ) -> 全角")
    # 半形 : ; ! ? 接在日文後(1:n 這種兩邊都是 ASCII 的記法不算). 提出する日本語は全角(主筆 11-05, 本堂 10-03 / 10-05 差し戻し)
    if re.search(r"(?<=[^\x00-\x7F])\s?[:;!?](?!\S*//)", s): err.append(f"{where}: 日文裡有半形 : ; ! ? -> 全角")
    for b in JA_BUZZ + PD_BUZZ:
        if b in s: err.append(f"{where}: 空話「{b}」")
    for r in RED:
        if r in s: err.append(f"{where}: 紅線「{r}」")
    for q in re.findall(r"「([^「」]+)」", s):
        if norm(q) not in src_text: err.append(f"{where}: 「{q}」在素材裡找不到(「」只放原文)")


def main():
    products = json.loads((PD / "data/products.json").read_text(encoding="utf-8"))
    cases = json.loads((PD / "data/cases.json").read_text(encoding="utf-8"))
    ux = {c["id"]: c for c in json.loads((ROOT / "uiux/data/cases.json").read_text(encoding="utf-8"))}
    html = (PD / "index.html").read_text(encoding="utf-8")
    js = (PD / "pd.js").read_text(encoding="utf-8")
    src_text = norm(corpus())
    srcs = src_book()
    pid = {p["id"]: p for p in products}
    want = set(sys.argv[1:])
    bad = 0

    def report(i, err, warn):
        nonlocal bad
        print(f"{'✗' if err else ('△' if warn else '✓')} {i}")
        for e in err: print(f"    ✗ {e}")
        for w in warn: print(f"    △ {w}")
        bad += bool(err)

    for p in products:
        if want and p["id"] not in want: continue
        err, warn = [], []
        if not srcs.get(p["id"], (None, 0))[1]: err.append("出處沒寫(開發書 04 這個 id 一節)")
        st = p.get("stage") or {}
        if not p.get("group"):
            for f in ("line", "issue", "team"):
                if not p.get(f): err.append(f"{f} 空")
            # 舞台可以空: 沒有可玩頁、不是展示型的產品層不放圖(主筆 11-05「susdungeons沒有搖桿, 就不要放四張圖」「personal directory也不是展示型的，不用放」)
            if st.get("image") and not (PD / st["image"]).exists(): err.append(f"圖不存在 {st['image']}")
            if st.get("figure") and f'id="{st["figure"]}"' not in html: err.append(f"figure template 不存在 {st['figure']}")
        for f, m in P_MAX.items():
            n = len(p.get(f, ""))
            if n > m: err.append(f"{f} {n} 字 > {m}")
            if p.get(f): ja_checks(f, p[f], src_text, err, warn)
        if st.get("caption"): ja_checks("caption", st["caption"], src_text, err, warn)
        report("product " + p["id"], err, warn)

    for c in cases:
        if want and c["id"] not in want: continue
        err, warn = [], []
        p = pid.get(c.get("product"))
        if not p: err.append(f"product {c.get('product')} 不存在")
        if not srcs.get(c["id"], (None, 0))[1]: err.append("出處沒寫(開發書 04 這個 id 一節)")
        if not c.get("title"): err.append("title 空")
        if len(c.get("title", "")) > C_MAX["title"]: err.append(f"title {len(c['title'])} 字 > {C_MAX['title']}")
        texts = {"title": c.get("title", "")}
        if c.get("type") == "note":
            if not c.get("notes"): err.append("notes 空")
            for k, v in c.get("notes", []):
                texts[k] = v
                if len(v) > NOTE_MAX: err.append(f"{k} {len(v)} 字 > {NOTE_MAX}")
        else:
            for f in ("issue", "options", "decision", "check"):
                if not c.get(f): err.append(f"{f} 空")
            for f, m in C_MAX.items():
                if f == "title": continue
                n = len(c.get(f, ""))
                if n > m: err.append(f"{f} {n} 字 > {m}")
                if c.get(f): texts[f] = c[f]
            if not c.get("role"): err.append("role 空")
            if len(c.get("role") or []) > 4: warn.append(f"role {len(c['role'])} 項, 最多 4")
            # AI 只在 進め方(AI の使い方)那一則. AI 本身就是產品的(Spiral / BraintankAI)可以在課題 / 検討裡提
            if c.get("product") not in AI_PRODUCTS:
                for f in ("options", "decision", "check", "next"):
                    if re.search(r"(?<![A-Za-z])AI(?![A-Za-z])", c.get(f, "")): err.append(f"{f}: 寫了 AI(AI 只在 進め方)")
            u = srcs.get(c["id"], (None, 0))[0]
            if u and ux.get(u) and ux[u]["ja"]["title"] == c["title"]:
                warn.append("title 跟 UI/UX 版一樣: PD 版標題寫決定")
            if c.get("options") and c.get("issue") and overlap(c["issue"], c["options"]) > 0.6:
                warn.append("検討跟課題字面重疊 > 60%: 是不是在重講課題?")
            if c.get("check") and c.get("decision") and overlap(c["decision"], c["check"]) > 0.6:
                warn.append("確認跟決定字面重疊 > 60%: 是不是在重講決定?")
        for k, v in texts.items():
            ja_checks(k, v, src_text, err, warn)
            if "インターン" in v and not (c.get("product") == "process" and v == INTERN):
                err.append(f"{k}: インターン只能在 進め方, 而且是 S0036 那一句")
        m = c.get("media") or {}
        if m.get("video"):
            a, b = PD / "movies" / m["video"], ROOT / "uiux/movies" / m["video"]
            if not a.exists(): err.append(f"影片不在 product/movies/{m['video']}: 跑 tools/pd_media.py")
            elif not b.exists() or a.read_bytes() != b.read_bytes(): err.append(f"product/movies/{m['video']} 跟 uiux/movies 不一樣: 跑 tools/pd_media.py")
            elif m.get("v") != hashlib.sha1(b.read_bytes()).hexdigest()[:8]: err.append("v 對不上: 跑 tools/pd_media.py")
        if m.get("image") and not (PD / m["image"]).exists(): err.append(f"圖不存在 {m['image']}")
        if m.get("caption"): ja_checks("caption", m["caption"], src_text, err, warn)
        if m.get("figure") and f'id="{m["figure"]}"' not in html: err.append(f"figure template 不存在 {m['figure']}")
        if not m: err.append("media 空")
        report(c["id"], err, warn)

    # 頁面: 不加說明用的 title / placeholder(<title> 本身不算); 示意圖的字也照日文規則查
    err, warn = [], []
    page = re.sub(r"<title>.*?</title>", "", html, flags=re.S) + js
    if re.search(r"\stitle\s*=", page): err.append("index.html / pd.js 有 title= (不加說明用 hovertip)")
    if re.search(r"placeholder\s*=", page): err.append("index.html / pd.js 有 placeholder")
    for tid, body in re.findall(r'<template id="([^"]+)">(.*?)</template>', html, flags=re.S):
        for seg in re.findall(r">([^<>]*[^\x00-\x7F][^<>]*)<", body):
            ja_checks(tid, seg.strip(), src_text, err, warn)
    report("page", err, warn)
    print("\n判斷題(機器查不到, 每則人工過): 工表〈判斷題〉六條 -- b-rec/docs/🎀 工表/p-rec/PD版寫法工表.md")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
