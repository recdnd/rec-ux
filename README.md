# Rec UX(ux-rec)

**2026-10-30 重做中(分支 `redo`)**: 主筆「ux.rec.ooo 重做作品集. 風格對齊 rec.ooo/band, 背景簡潔, 照前端契約, 先骨架, 之後走 15 秒影片一支一支做」. 新頁 = `index.html` + `css/ux.css` + `js/ux.js` + `data/cases.json`(一則 = 一支影片 + problem / move / outcome; `video` 為 null = 還沒做, 列表右邊不打 ▶). 本機 `python3 -m http.server 2323`. 合回 main 才上線; 網域回 ux.rec.ooo 要改 CNAME + DNS(主筆).

UX の事例を**プロジェクトごとの板塊**で見せるサイト. 2026-10-20 主筆「後面很多大量新專案, 劃分為 dungeons / kiln / band 等各種板塊」で Spiral 単独から作り直し.
- 板塊: sus dungeons / Rec Dungeons(band)/ rec.ooo / kiln / Ruvia / Spiral(開発終了, 最後に置く). 順番と一行説明は `data/boards.json`.
- 事例は `data/cards.json`. 1 枚 = problem / designMove / outcome + media. `board` で板塊に入る.
- media: `{"type":"video"}`(`movies/<id>.mp4`)か `{"type":"image","src":"shots/<file>"}`. 新しい事例は先に画像, 動画ができたら差し替え.
- 動画は自動で録る: `cd tools && npm i && node record.mjs <id>`(`all` で全部). 手順は `tools/scenarios.mjs`, 尺寸は Spiral に揃える(桌面 960x600 @2x = 1920x1200, 手機 iPhone SE 375x667 @2x). 1 本ずつ見て, 変な所は手順を直して撮り直す.
- 画面写真は**公開サイト(rec.ooo 等)から撮る**. 本機の 2828 で撮ると 🎀(本機だけの)リンクが写る.
- 作品集の入口は https://rec.ooo. ドメインは今 spiral.rec.ooo(CNAME). ux.rec.ooo に戻すかは主筆決め(DNS).

## Stack

Plain HTML + CSS + JavaScript. 事例は `data/cards.json`, 動画は `movies/<id>.mp4`.

```bash
python3 -m http.server 8080
```

## Domain

GitHub Pages, custom domain `spiral.rec.ooo`(CNAME). DNS: spiral.rec.ooo CNAME -> recdnd.github.io.
