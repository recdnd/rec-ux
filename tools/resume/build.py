#!/usr/bin/env python3
"""p.rec.ooo/resume/ 產出器(2026-11-08).

事實只在 tools/resume/data.json. 這支把它寫成兩張靜態頁:
  resume/index.html     英語(x-default). 瀏覽器語言是日語而且網址沒帶 ?hl= 時, 轉到 ja/.
  resume/ja/index.html  日語.
靜態寫死是為了搜尋引擎和 scout 平台的預覽讀得到內容(不靠 JS 畫).
樣式照前端契約: 系統黑字, 連結系統藍底色框 .07 / .14 / .22, 無框, 邊距 4px, 角落物件 2px, 不放說明字.
語言鍵在右上(換頁連結), 右下 🖨️ = 列印(瀏覽器存 PDF), 列印時兩顆都不出.
"""
import html, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
D = json.loads((ROOT / "tools/resume/data.json").read_text())
E = html.escape

CSS = """
:root{ --ink:#000; --op:#0000ff; --bg:#fff; --dim:.55; --float-k:0,0,255;
  --font: ui-monospace,"SF Mono",Menlo,"Courier New","Hiragino Sans","PingFang TC",monospace; }
html{ background:var(--bg); }
html,body{ margin:0; padding:0; color:var(--ink); }
body{ font:12px/1.5 var(--font); padding:4px 4px 40px; box-sizing:border-box; }
button,input,select,textarea{ border:0; }
main{ max-width:640px; margin:0 auto; padding-top:24px; }
p,ul,dl,dd{ margin:0; padding:0; }
ul{ list-style:none; }
section{ margin-top:16px; }
h1{ font:inherit; font-size:16px; margin:0; }
h2{ font:inherit; opacity:var(--dim); margin:0 0 4px; }
.alias{ opacity:var(--dim); }
.contact{ display:flex; flex-wrap:wrap; gap:3px 8px; margin-top:4px; }
a{ color:var(--op); text-decoration:none; padding:1px; background:rgba(var(--float-k),.07); }
a:hover,a:focus-visible{ background:rgba(var(--float-k),.14); outline:0; }
a:active{ background:rgba(var(--float-k),.22); }
.work li{ margin-bottom:4px; }
.kind{ opacity:var(--dim); margin-left:8px; }
.row{ display:grid; grid-template-columns:200px 1fr; gap:0 8px; }
.when{ opacity:var(--dim); }
.hl{ position:fixed; top:2px; right:2px; }
.dock{ position:fixed; right:2px; bottom:2px; display:flex; gap:4px; z-index:40; }
.dock button{ font:inherit; font-size:11px; line-height:1.2; padding:3px 7px; cursor:pointer; user-select:none;
  background:rgba(var(--float-k),.07); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); }
.dock button:hover{ background:rgba(var(--float-k),.14); }
.dock button:active{ background:rgba(var(--float-k),.22); }
@media (max-width:560px){ main{ padding-top:20px; } .row{ grid-template-columns:1fr; margin-bottom:4px; } }
@media print{
  @page{ size:A4; margin:16mm; }
  .hl,.dock{ display:none; }
  body{ padding:0; font-size:10.5px; }
  main{ max-width:none; padding:0; }
  a{ background:none; color:var(--ink); padding:0; }
  a[data-u]::after{ content:" " attr(data-u); opacity:var(--dim); }
}
"""

def page(lang):
    ja = lang == "ja"
    L = lambda o: o[lang]
    canon = "https://p.rec.ooo/resume/ja/" if ja else "https://p.rec.ooo/resume/"
    title = "Rec レジュメ" if ja else "Rec Resume"
    desc = ("Rec（XUE JUNTAO）のレジュメ。作品、担当、学歴、語学。" if ja
            else "Resume of Rec (Xue Juntao): work, role, education, languages.")
    other = ('<a class="hl" href="../?hl=en" hreflang="en" lang="en">EN</a>' if ja
             else '<a class="hl" href="ja/" hreflang="ja" lang="ja">日本語</a>')
    # 英語頁才轉: 日語瀏覽器 + 網址沒帶 ?hl= -> ja/. 從日語頁按 EN 來的帶 ?hl=en, 不轉回去.
    redirect = "" if ja else """<script>
(function(){ try{ if(location.search.indexOf("hl=")>=0) return;
  var l=((navigator.languages&&navigator.languages[0])||navigator.language||"").toLowerCase();
  if(l.indexOf("ja")===0) location.replace("ja/"); }catch(e){} })();
</script>
"""
    ld = {"@context": "https://schema.org", "@type": "ProfilePage", "url": canon, "inLanguage": lang,
          "mainEntity": {"@type": "Person", "name": D["name"]["en"], "alternateName": [D["alias"], "セツ シュントウ"],
                         "email": "mailto:" + D["email"], "url": D["site"],
                         "address": {"@type": "PostalAddress", "addressLocality": "Tokyo", "addressCountry": "JP"},
                         "knowsLanguage": ["zh", "en", "ja"],
                         "alumniOf": ["Rikkyo University", "Virginia Tech"],
                         "sameAs": [w["url"] for w in D["work"]]}}

    work = "\n".join(
        f'    <li><a href="{E(w["url"])}" data-u="{E(w["url"])}">{E(w["name"])}</a><span class="kind">{E(L(w["kind"]))}</span><p>{E(L(w["line"]))}</p></li>'
        for w in D["work"])
    role = "\n".join(f"    <li>{E(L(r))}</li>" for r in D["role"])
    edu = "\n".join(
        f'    <li class="row"><span class="when">{E(L(x["when"]))}</span><span>{E(L(x["what"]))}</span></li>'
        for x in D["edu"])
    lng = "\n".join(f"    <li>{E(L(x))}</li>" for x in D["lang"])
    lab = {k: E(L(v)) for k, v in D["label"].items()}
    pf = D["portfolio"][lang]
    pfu = "https://p.rec.ooo/" + pf.lstrip("./")

    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<!-- 產物: tools/resume/build.py 從 tools/resume/data.json 寫出. 不要手改這一份. -->
{redirect}<title>{title}</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{canon}">
<link rel="alternate" hreflang="en" href="https://p.rec.ooo/resume/">
<link rel="alternate" hreflang="ja" href="https://p.rec.ooo/resume/ja/">
<link rel="alternate" hreflang="x-default" href="https://p.rec.ooo/resume/">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:type" content="profile">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📇</text></svg>">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<style>{CSS}</style>
</head>
<body>
{other}
<main>
  <header>
    <h1>{E(L(D["name"]))} <span class="alias">{E(D["alias"])}</span></h1>
    <p class="contact"><span>{E(L(D["place"]))}</span><a href="mailto:{E(D["email"])}">{E(D["email"])}</a><a href="{E(D["site"])}/">{E(D["site"].split("//")[1])}</a><a href="{pf}" data-u="{pfu}">{lab["pf"]}</a></p>
  </header>
  <section class="work">
    <h2>{lab["work"]}</h2>
    <ul>
{work}
    </ul>
  </section>
  <section>
    <h2>{lab["role"]}</h2>
    <ul>
{role}
    </ul>
  </section>
  <section>
    <h2>{lab["edu"]}</h2>
    <ul>
{edu}
    </ul>
  </section>
  <section>
    <h2>{lab["lang"]}</h2>
    <ul>
{lng}
    </ul>
  </section>
</main>
<div class="dock"><button type="button" aria-label="print" onclick="print()">🖨️</button></div>
</body>
</html>
"""

out = ROOT / "resume"
(out / "ja").mkdir(parents=True, exist_ok=True)
(out / "index.html").write_text(page("en"))
(out / "ja/index.html").write_text(page("ja"))
print("wrote resume/index.html, resume/ja/index.html")
