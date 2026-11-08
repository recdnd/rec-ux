# Rec 作品集(p-rec, 2026-11-05 以前叫 ux-rec)➢ p.rec.ooo

**2026-11-05 搬家**: 這個 repo(recdnd/rec-ux)= 作品集總站 **p.rec.ooo**. 一個版本一個子路徑, 互不連結:
- `/` = 根頁: 名字 + https://rec.ooo. **不列出也不連到各版本**, 各版本之間也不互相連結.
- `/resume/` = 通用 resume(2026-11-08 主筆「根頁連到resume的一個通用版本, 擔任“別人來找我”的位置」). 根頁**只連這一個**. 英 `/resume/` + 日 `/resume/ja/`, 日語瀏覽器自動轉 ja(網址帶 `?hl=` 不轉). 事實只在 `tools/resume/data.json`, 改完跑 `python3 tools/resume/build.py`(兩張頁是產物, 不手改). 日語版作品集連 `/aeu/`, 英語版連 `/uiux/`.
- `/aeu/` = 通用作品集(11-08 從 8j5 複製), resume 連過來, **不加 noindex**. 其他代號站照舊 noindex. 進門要前端密碼(藍細線中心小框, Enter 送出, 錯了閃紅; 過一次存 localStorage; `?k=碼` 直接放行). 碼只在 b-rec 05 與 rec.ooo career 📋 profile 的說明, 這裡只放 SHA-256.
- 給某一家交 resume 時: `/<代號>/resume/`, 從 `/resume/` 複製凍結(同 product -> 代號的做法).
- `/uiux/` = 原本 ux.rec.ooo 的整站, 內容不改. ux.rec.ooo 已送出十幾份應募, 所以 **ux.rec.ooo/xxx -> https://p.rec.ooo/uiux/xxx 301 保留路徑**(Porkbun 轉址, 主筆設), `uiux/` 底下的路徑要跟舊站一一對得上, 不要搬動或改名.
- `/product/` = PD(プロダクトデザイン)版: 同一批作品, 骨架換成 決定の記錄(課題 / 検討 / 決定 / 確認 / 次)+ プロダクト層(課題 / 提供 / 運営 / 体制). 全部相對路徑, 掛在任何子路徑都能動. 寫法標準在 b-rec(🎀 工表 ux-rec), 檢查 `python3 tools/check_pd.py`, 影片 `python3 tools/pd_media.py`(從 uiux/movies 複製, 同內容 git 只存一份).
- `/versions/` = 所有版本一覽(作品集 / resume / 画庫), 整行點了開新分頁. 清單 `versions/versions.json`, 加一版就加一行. 「給哪一家」= `versions/names.json`(本機才有, .gitignore; `python3 tools/versions_names.py` 從 b-rec 05 產生). noindex, 根頁不連. 2026-11-08 從 `/admin` 改名(主筆「p-rec/versions做成所有存在的作品集/簡歷等的版本列表集」), `/admin` 留 meta refresh 轉過去.
- `/ml/` 還沒有, 不放空頁.
- 只上網站本身: `_config.yml` 把 README / tools / rituals / push.command 排除在 GitHub Pages 外.
- 本機: repo 根起 `python3 -m http.server 2323`, 看 `/uiux/` 與 `/product/`.

以下是搬家前(ux.rec.ooo 時期)的說明. 裡面的 `index.html` `css/` `js/` `data/` `movies/` `shots/` 現在都在 `uiux/` 底下, tools 照舊在 repo 根(已改成讀 `uiux/`).

---

## 搬家前: Rec UX(ux-rec)

**2026-10-30 重做中(分支 `redo`)**: 主筆「ux.rec.ooo 重做作品集. 風格對齊 rec.ooo/band, 背景簡潔, 照前端契約, 先骨架, 之後走 15 秒影片一支一支做」. 新頁 = `index.html` + `css/ux.css` + `js/ux.js` + `data/cases.json`(一則 = 一支影片 + problem / move / outcome; `video` 為 null = 還沒做, 列表右邊不打 ▶; 影片不鎖比例, 顯示原寸(影片像素 / 2, 錄影是 @2x), 不放大, 盒放不下才縮; 還沒影片時用 `size` 欄如 "1792x1120", 沒有就 2320x1450. **錄影規格 1000x800(CSS px, 5:4, Retina 錄出 2000x1600; 1440 螢幕上剛好原寸). band 桌面例外 1160x725(排法要 1160 寬)**, 手機照原本). **🧊 Singles 板塊(2026-11-01 開, 11-02 雪藏)**: 主筆 11-02「決定不再採用singles這個操作」「singles這個功能和相關代碼雪藏comment out，以後我想做再說」. BraintankAI 改成自己的板塊(🕹️ 嵌 braintank.ai + 一則錄影). 相關程式在 js/ux.js 與 tools/check_cases.py 標 🧊 註解掉, boards.json 的 singles 留著(`_iced`, 沒有事例指到就不出現). Spiral 同日只留一則(session-stream)+ 🕹️, 另外三則收在 `data/iced-cases.json`(頁面不讀), 影片還在 movies/. **案例文案(2026-11-02, 主筆「每次都要檢查, 對齊ui/ux portfolio高級標準」)**: 寫 / 改 cases.json 照 b-rec `🎀 工表/ux-rec/案例寫法工表.md`, 改完跑 `python3 tools/check_cases.py`; `tools/pre-commit`(連到 .git/hooks)在 cases.json 有 ✗ 時擋 commit. **類型標(2026-11-02, 主筆選 A)**: 板塊名那一行最右邊灰字寫類型(`boards.json` 的 `kind` / `ja.kind`); 不用圖標. 平台不標(全是 Web, 手機那幾則有 📱). 本機 `python3 -m http.server 2323`. 合回 main 才上線; 網域回 ux.rec.ooo 要改 CNAME + DNS(主筆).

UX の事例を**プロジェクトごとの板塊**で見せるサイト. 2026-10-20 主筆「後面很多大量新專案, 劃分為 dungeons / kiln / band 等各種板塊」で Spiral 単独から作り直し.
- 板塊: sus dungeons / Rec Dungeons(band)/ rec.ooo / kiln / Ruvia / Spiral(開発終了, 最後に置く). 順番と一行説明は `data/boards.json`.
- 事例は `data/cards.json`. 1 枚 = problem / designMove / outcome + media. `board` で板塊に入る.
- media: `{"type":"video"}`(`movies/<id>.mp4`)か `{"type":"image","src":"shots/<file>"}`. 新しい事例は先に画像, 動画ができたら差し替え.
- 影片換了一定跑 `python3 tools/stamp.py`(寫 ?v= 雜湊, 不然瀏覽器放舊的).
- 動画は自動で録る: `cd tools && npm i && node record.mjs <id>`(`all` で全部). 手順は `tools/scenarios.mjs`, 尺寸は Spiral に揃える(桌面 960x600 @2x = 1920x1200, 手機 iPhone SE 375x667 @2x). 1 本ずつ見て, 変な所は手順を直して撮り直す.
- 画面写真は**公開サイト(rec.ooo 等)から撮る**. 本機の 2828 で撮ると 🎀(本機だけの)リンクが写る.
- 作品集の入口は https://rec.ooo. ドメインは ux.rec.ooo(CNAME, 2026-10-30 主筆「好」で spiral.rec.ooo から戻した).

## Stack

Plain HTML + CSS + JavaScript. 事例は `data/cards.json`, 動画は `movies/<id>.mp4`.

```bash
python3 -m http.server 8080
```

## Domain

GitHub Pages, custom domain **`p.rec.ooo`**(CNAME, 2026-11-05). DNS: p.rec.ooo CNAME -> recdnd.github.io(主筆 11-05 在 Porkbun 建). ux.rec.ooo -> https://p.rec.ooo/uiux 301(Porkbun URL 轉址, 保留路徑, 主筆設). 更早: spiral.rec.ooo(10-30 前)-> ux.rec.ooo(10-30 ~ 11-05).
