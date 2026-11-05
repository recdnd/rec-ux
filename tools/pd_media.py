#!/usr/bin/env python3
"""PD 版(product/)的影片: 從 uiux/movies/ 複製到 product/movies/, 並把內容雜湊寫進 product/data/cases.json 的 media.v(2026-11-05).

product/ 要能單獨掛在任何子路徑(全部相對路徑), 所以影片放在自己底下, 不去拿 ../uiux/movies.
同一份內容在 git 裡是同一個 blob, 複製不會讓 repo 變大. 正本仍是 uiux/movies/, 那邊換了影片就再跑這支.
用法: python3 tools/pd_media.py     沒用到的舊複製會刪掉. 📱 = 直式影片(跟 uiux/tools/stamp.py 同一個判法).
"""
import hashlib, json, pathlib, shutil, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, DST = ROOT / "uiux" / "movies", ROOT / "product" / "movies"
P = ROOT / "product" / "data" / "cases.json"
cases = json.loads(P.read_text(encoding="utf-8"))
DST.mkdir(exist_ok=True)
want = set()
for c in cases:
    m = c.get("media") or {}
    f = m.get("video")
    if not f: continue
    want.add(f)
    s, d = SRC / f, DST / f
    if not d.exists() or d.read_bytes() != s.read_bytes():
        shutil.copyfile(s, d)
    m["v"] = hashlib.sha1(s.read_bytes()).hexdigest()[:8]
    w, h = map(int, subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                             "stream=width,height", "-of", "csv=p=0", str(s)]).decode().strip().split(",")[:2])
    m["size"] = f"{w}x{h}"
    if h > w: m["phone"] = True
    else: m.pop("phone", None)
for old in DST.iterdir():
    if old.name not in want: old.unlink()
P.write_text(json.dumps(cases, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print({c["id"]: (c["media"].get("v"), c["media"]["size"], "📱" if c["media"].get("phone") else "") for c in cases if c["media"].get("video")})
