#!/usr/bin/env python3
"""付録ページ(正本: p-rec/tools/fuoku/. Web 版と作品集 PDF の両方がここから. saturn は交件の副本だけ).
付録ページ試作(主筆 2026-11-06「壁 + ルーペ c這種最好, 作為添附頁放在後面 ... 網站和pdf都固定放幾頁」).
コードは実物(p-rec/tools/pd_code.py の strip_comments で註解だけ落とす), 数字は下の NUMS を測った値. 1 ページ 1200x675."""
import json, os, sys
R = os.path.expanduser('~/Documents/DungeonsRoot')
sys.path.insert(0, os.path.join(R, 'p-rec/tools'))
from pd_code import strip_comments
HERE = os.path.dirname(os.path.abspath(__file__))
def L(f, a, b):
    t = open(os.path.join(R, f), encoding='utf-8').read().split('\n')
    return strip_comments([(i, t[i - 1]) for i in range(a, min(b, len(t)) + 1)])
from pd_code import CODE
TR = 'rec-rec/home/dungeons/trade.js'
allt = L(TR, 1, 400)
half = (len(allt) + 1) // 2
notes = CODE['dungeons-trade']['notes']
lens = [[n, t] + ([notes[n]] if n in notes else []) for n, t in L(TR, 139, 178)]
data = {'wall': [allt[:half], allt[half:]], 'lens': lens, 'file': TR, 'total': len(open(os.path.join(R, TR), encoding='utf-8').read().split('\n')), 'kept': len(allt)}
tpl = open(os.path.join(HERE, 'tpl.html'), encoding='utf-8').read().replace('/*DATA*/null', json.dumps(data, ensure_ascii=False))
# 16:9 版(発表 / 単体)と A4 横版(作品集 PDF の後ろに足す. 主筆 11-06「網站和pdf都固定放幾頁」)
# 宛先ごとの札と締め(主筆 11-06「smarthr原郵件裡明確說過了哪些要寫, 不是前端作品集展示」): 頁の右上の札 = その会社の案内の言葉
PROFILES = {
    'smarthr': [
        ('<span class="pill">実装</span>', '<span class="pill">意思決定の理由 → 実装</span>'),
        ('<span class="pill">規模</span>', '<span class="pill">チーム内での役割</span>'),
        ('<div class="band">10 月は 1 か月で 450 コミット。ゲーム・作業台・音楽ストアを一人で並行して進めている。</div>',
         '<div class="band">企画・設計・実装・運営を一人で担う。10 月は 1 か月で 450 コミット。</div>'),
        ('<span class="pill">仕組み</span>', '<span class="pill">AI の活用方法</span>'),
        ('<h2>作業の決まりと自動検査</h2>', '<h2>AI の活用方法：作業の決まりと自動検査</h2>'),
        ('<div class="band">決まりは作業の前に読ませ、守れたかは機械で数える。</div>',
         '<div class="band">AI エージェントには、決まりを作業の前に読ませ、守れたかを機械で数える。</div>'),
        ('<span class="pill">比較 → 採用</span>', '<span class="pill">検討プロセス / 意思決定の理由</span>'),
    ],
}
prof = sys.argv[1] if len(sys.argv) > 1 else ''
for a, b in PROFILES.get(prof, []):
    assert a in tpl, a
    tpl = tpl.replace(a, b)
sfx = '-' + prof if prof else ''
open(os.path.join(HERE, '付録' + sfx + '.html'), 'w', encoding='utf-8').write(tpl.replace('/*BODY*/', ''))
open(os.path.join(HERE, '付録-a4' + sfx + '.html'), 'w', encoding='utf-8').write(
    tpl.replace('/*BODY*/', 'a4').replace('@page{ size:1200px 675px; margin:0; }', '@page{ size:297mm 210mm; margin:0; }'))
import subprocess
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
for src, pdf in (('付録' + sfx + '.html', 'Rec-付録' + sfx + '.pdf'), ('付録-a4' + sfx + '.html', 'Rec-付録-A4' + sfx + '.pdf')):
    subprocess.run([CH, '--headless=new', '--disable-gpu', '--mute-audio', '--no-pdf-header-footer', '--virtual-time-budget=3000',
                    '--print-to-pdf=' + os.path.join(HERE, pdf), 'file://' + os.path.join(HERE, src)], check=True, capture_output=True)
print('ok')
