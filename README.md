# spiral.rec.ooo -- Spiral UX

Spiral(2025-2026, 開発終了)の UX 実例 3 件を動画と説明で見せるだけの小さなサイト. 主筆 2026-10-02 に ux.rec.ooo(Rec Dungeons Studio の UX 作品集)から格下げ:
- 作品集の入口は https://rec.ooo(ポートフォリオ兼個人サイト). ここは Spiral の UX 記録だけ.
- spiral.ooo は停止したのでリンクしない.
- repo 名は recdnd/rec-ux のまま, 本地は `ux-rec`.

## Stack

Plain HTML + CSS + JavaScript. 事例は `data/cards.json`, 動画は `movies/<id>.mp4`.

```bash
python3 -m http.server 8080
```

## Domain

GitHub Pages, custom domain `spiral.rec.ooo`(CNAME). DNS: spiral.rec.ooo CNAME -> recdnd.github.io.
