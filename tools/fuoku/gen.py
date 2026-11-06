#!/usr/bin/env python3
"""付録 A1-A6(正本: p-rec/tools/fuoku/. 作品集 PDF の後ろに足す. saturn は交件の副本だけ).

2026-11-06 作り直し(主筆「要你學兒玉不包括學前端和配色啊 ... 要根據主筆的情況(kpi賽和產品設計完全不是一個東西)不要抄了，全部重做」):
見た目は本文の頁と同じ版面 + 主筆の設計規約(tpl.html の頭の註解). 中身は製品の決定に寄せる:
  A1 実装(天秤で払う)/ A2 決めたことの一覧(事例データの全件)/ A3 AI に任せる前と後の決まり(+ 実際の検査出力)/
  A4-A6 比較案(Cloutric を誰に売るか / 音楽の売り方 3 回 / 定番の塔の RPG と何を変えるか).
コードは実物(pd_code.strip_comments で註解を落とし, zh_line で中国語の画面文言の行を外す). A3 の ✓ は check_pd を今走らせた結果.

  python3 p-rec/tools/fuoku/gen.py            -> 付録-a4.html / Rec-付録-A4.pdf(事例は product = pixiv 正本)
  python3 p-rec/tools/fuoku/gen.py smarthr    -> 付録-a4-smarthr.html / Rec-付録-A4-smarthr.pdf(事例は 33b, 札は案内の 5 点)
"""
import json, os, re, subprocess, sys
R = os.path.expanduser('~/Documents/DungeonsRoot')
sys.path.insert(0, os.path.join(R, 'p-rec/tools'))
from pd_code import CODE, strip_comments, zh_line
HERE = os.path.dirname(os.path.abspath(__file__))


def lines(f, a, b):
    t = open(os.path.join(R, f), encoding='utf-8').read().split('\n')
    return [x for x in strip_comments([(i, t[i - 1]) for i in range(a, min(b, len(t)) + 1)]) if not zh_line(x[1])]


# 宛先ごと: 頁の札(A1..A6)と事例データの置き場
PROFILES = {
    '': {'site': 'product', 'tags': ['実装', '決定の一覧', 'AI の使い方', '比較案', '比較案', '比較案']},
    'smarthr': {'site': '33b', 'tags': ['意思決定の理由 → 実装', '検討プロセス / 意思決定の理由', 'AI の活用方法',
                                        '検討プロセス / 意思決定の理由', '検討プロセス / 意思決定の理由', '検討プロセス / 意思決定の理由']},
}
prof = sys.argv[1] if len(sys.argv) > 1 else ''
P = PROFILES[prof]

# A1: trade.js 全体(壁)+ 天秤の step と成立(ルーペ). 注は pd_code の dungeons-genre と同じ
TR = 'rec-rec/home/dungeons/trade.js'
allt = lines(TR, 1, 400)
half = (len(allt) + 1) // 2
notes = CODE['dungeons-genre']['notes']
LENS = [(139, 178), (202, 213)]
lens = [[[n, t] + ([notes[n]] if n in notes else []) for n, t in lines(TR, a, b)] for a, b in LENS]

# A2: 事例データの決定を全件(note = 進め方 は除く), 製品の並び順のまま
site = os.path.join(R, 'p-rec', P['site'], 'data')
prods = json.load(open(os.path.join(site, 'products.json'), encoding='utf-8'))
name = {p['id']: p['name'] for p in prods}
cases = [c for c in json.load(open(os.path.join(site, 'cases.json'), encoding='utf-8')) if c.get('type') != 'note']
order = {p['id']: i for i, p in enumerate(prods)}
cases.sort(key=lambda c: order.get(c['product'], 99))
decisions = [[name.get(c['product'], c['product']), c['title'], c.get('options') or '', c.get('check') or ''] for c in cases]

# A3: check_pd を今走らせた ✓ の一覧(実際の出力)
ck = subprocess.run([sys.executable, os.path.join(R, 'p-rec/tools/check_pd.py')], capture_output=True, text=True)
oks = re.findall(r'^✓ (.+)$', ck.stdout, re.M)
if ck.returncode != 0 or not oks:
    sys.exit('check_pd が通っていない: 付録 A3 に今の出力を載せられない\n' + ck.stdout[-800:])

# A6: 十一の方針(sus dungeons 開発書 00-prompt原文·分支 N2, 2026-08-13 主筆原文の順と %)
RULES = [
    ('1', '死んだら、後室に落ちる仕組みにする', 90),
    ('2', '花を、育てても交換してもよい別の通貨にする', 60),
    ('3', '階は一直線。飛び越しはあるが、1d や 8a のような枝番は作らない', 60),
    ('4', '魔物を倒しきった階は、買って畑・釣り・自分の領地にできる', 90),
    ('5', '横の字幕画面を、日程や錬金炉などの機能画面に切り替えられる', 80),
    ('6', '教会から実験室まで主題を広げ、迷宮を一本道で終わらせない', 70),
    ('7', 'データを増やすだけの飾りは作らない。物語は売りにしない', 50),
    ('8', '店や牧場はパネルにせず、歩いて入る', 90),
    ('9', '階を飛ばす道具・倍率の道具は作らない', 90),
    ('', '探索・道順・収集と交換・純粋な技巧の階に寄せる', 55),
    ('10', '完全にランダムな階は作らない', 20),
    ('11', '抽象的な数値への依存を、できるだけ減らす', 20),
]

data = {
    'tags': P['tags'], 'wall': [allt[:half], allt[half:]], 'lens': lens, 'file': TR, 'name': 'trade.js',
    'span': ' / '.join(f'{a}–{b}' for a, b in LENS),
    'total': len(open(os.path.join(R, TR), encoding='utf-8').read().split('\n')), 'kept': len(allt),
    'decisions': decisions, 'oks': oks, 'rules': [list(r) for r in RULES],
}
html = open(os.path.join(HERE, 'tpl.html'), encoding='utf-8').read().replace('/*DATA*/null', json.dumps(data, ensure_ascii=False))
sfx = '-' + prof if prof else ''
src = os.path.join(HERE, '付録-a4' + sfx + '.html')
open(src, 'w', encoding='utf-8').write(html)
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
subprocess.run([CH, '--headless=new', '--disable-gpu', '--mute-audio', '--no-pdf-header-footer', '--virtual-time-budget=3000',
                '--print-to-pdf=' + os.path.join(HERE, 'Rec-付録-A4' + sfx + '.pdf'), 'file://' + src], check=True, capture_output=True)
print('ok', len(decisions), '決定 /', len(oks), '✓')
