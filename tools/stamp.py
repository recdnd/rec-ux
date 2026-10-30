# 影片換了瀏覽器還放舊的(主筆 10-30「沒看到變化，硬重整和清除數據都沒用」): 同一個網址的影片會被快取.
# 這支把每支影片內容的雜湊寫進 data/cases.json 的 v, 頁面用 ?v=<雜湊> 去拿 -> 檔案一換, 網址就換.
# 換影片後跑: python3 tools/stamp.py
import hashlib, json, pathlib, subprocess
root = pathlib.Path(__file__).resolve().parent.parent
p = root / "data" / "cases.json"
cases = json.loads(p.read_text())
for c in cases:
    f = root / c["video"] if c.get("video") else None
    if f and f.exists():
        c["v"] = hashlib.sha1(f.read_bytes()).hexdigest()[:8]
        # 📱(主筆 10-30「所有是手機介面的都加📱」): 直式影片 = 手機介面, 列表標題後面打 📱
        w, h = map(int, subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(f)]).decode().strip().split(",")[:2])
        if h > w: c["phone"] = True
        else: c.pop("phone", None)
    else:
        c.pop("v", None)
p.write_text(json.dumps(cases, ensure_ascii=False, indent=2) + "\n")
print({c["id"]: (c.get("v"), "📱" if c.get("phone") else "") for c in cases if c.get("v")})
