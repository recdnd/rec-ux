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
open(os.path.join(HERE, '付録.html'), 'w', encoding='utf-8').write(tpl.replace('/*BODY*/', ''))
open(os.path.join(HERE, '付録-a4.html'), 'w', encoding='utf-8').write(
    tpl.replace('/*BODY*/', 'a4').replace('@page{ size:1200px 675px; margin:0; }', '@page{ size:297mm 210mm; margin:0; }'))
import subprocess
CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
for src, pdf in (('付録.html', 'Rec-付録.pdf'), ('付録-a4.html', 'Rec-付録-A4.pdf')):
    subprocess.run([CH, '--headless=new', '--disable-gpu', '--mute-audio', '--no-pdf-header-footer', '--virtual-time-budget=3000',
                    '--print-to-pdf=' + os.path.join(HERE, pdf), 'file://' + os.path.join(HERE, src)], check=True, capture_output=True)
print('ok')
