#!/usr/bin/env python3
"""PD 版の「コード」折りたたみ枠の中身を, 原始碼から抜いて product/data/code.json に書く.

主筆 2026-11-06「作品集站裡也適量放, 最好點擊就可以顯示一部分, 可以收起來 ... 白底藍字那種感覺(scrib的itoa提詞版那種感覺不錯)」.
- コードは実物だけ. 行番号も原ファイルの番号のまま(1 文字も作らない).
- 註解(/* */ と //)は落とす: 中文の作業メモで, 内部の話も混ざるから. 代わりに NOTES の日本語注を行の下に出す(藍).
- 原始碼が変わったらこれを流し直す. 行番号がずれたら NOTES の番号も直す(注の行が空 / 註解だけになったら ✗).

  python3 p-rec/tools/pd_code.py
"""
import json, os, re, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'p-rec/product/data/code.json')

# case id(または products.json の id = 產品層)-> 枠 1 つ. ranges = 原ファイルの行 [from, to] (両端含む). notes = {行番号: 注}.
CODE = {
    'dungeons-genre': {
        'file': 'rec-rec/home/dungeons/trade.js', 'name': 'trade.js',
        'ranges': [(110, 181), (202, 213)],
        'notes': {
            139: '左右の重さの差を、竿の傾きの目標にする。差が大きいほど傾き、上限で頭打ちになる。',
            143: '引っかかりのある秤では、差が小さいうちは竿が動かない。',
            162: '二つの正弦でわずかに揺らす。乱数を使わないので、同じ局面は毎回同じ動きになる。',
            165: '載っている量が多いほど、ゆっくり揺れる。',
            166: 'ばねと減衰の運動方程式。減衰は臨界より弱く、少し揺れてから止まる。',
            171: '皿は竿から吊った振り子として、竿とは別に動く。',
            206: '成立は、この瞬間に自分の皿が下がっているかだけで決める。',
        },
    },
    'band-sell': {
        'file': 'rec-band/index.html', 'name': 'band/index.html',
        'ranges': [(2537, 2572)],
        'notes': {
            2540: 'メールアドレスの形になったときだけ、次の行を出す。',
            2548: '買ったことがあるかどうかに関係なく、同じ返事を返す。リンクはメールで届く。',
            2566: '買ったものはブラウザに置き、すぐ聴けるようにする。',
            2568: '決済の通知が先に届くとは限らないので、2 秒おきに最大 1 分まで聞き直す。',
        },
    },
    'dungeons-desks': {
        'file': 'rec-rec/home/desks/NPC表.html', 'name': 'NPC表.html',
        'ranges': [(2592, 2632), (3787, 3798)],
        'notes': {
            2594: '画面の文字を拾わず、データから引き継ぎ用のテキストを組み立てる。',
            2609: '会話のブロックを、入れ子のまま字下げして書き出す。',
            2625: '分岐の中の分岐も、同じ関数でたどる。',
            3793: '何も選んでいないときは、空の中身をコピーせず ❌ を返す。',
        },
    },
    # Personal Directory(主筆 11-06「personaldirectory沒東西可以展示嗎，加點代碼/規則層啊」). 產品層 key = products.json の id
    'pdir': {
        'file': 'PD+FC/form-copilot/extension/content/injectPanel.ts', 'name': 'injectPanel.ts',
        'ranges': [(470, 499)],
        'notes': {
            472: 'このサイトで自分の手で直して覚えさせた値を、欄の形から引く。',
            473: '学歴の欄が何行も並ぶときは、2 行目から先に同じ学校を入れない。',
            481: '覚えさせた値がある欄は、住所や電話の推定を通さない。',
            482: '住所の欄なのに組の形がわからなければ、埋めずにコピー用に回す。',
            487: '候補には、出どころと確かさを必ず付ける。',
            491: '形のわからない住所は、全住所をコピー用に出すだけにし、確かさは低くする。',
            496: 'どれにも当たらない欄だけが、原本の候補になる。',
            498: '読み取れなかった欄には、候補を出さない。',
        },
    },
    'pdir-fields': {
        'file': 'PD+FC/form-copilot/extension/content/phoneGroup.ts', 'name': 'phoneGroup.ts',
        'ranges': [(37, 41), (90, 110), (129, 132)],
        'notes': {
            39: '携帯の 11 桁だけを 3・4・4 に割る。固定電話は市外局番の長さが決まらないため割らない。',
            91: '欄が一つしかなければ、組とはみなさない。',
            95: '全桁が入る欄が二つ並ぶだけ（自宅と携帯など）なら、組にしない。',
            102: '欄の長さが足りない、または並びがわからなければ、三つとも埋めない。',
            108: '前・中・後に分けて入れる。',
            131: '一つの欄には、ハイフン入りの例や指示があるときだけハイフンを入れる。',
        },
    },
    'pdir-layers': {
        'file': 'PD+FC/form-copilot/scripts/buildSnapshots.ts', 'name': 'buildSnapshots.ts',
        'ranges': [(28, 33), (35, 36), (41, 42), (49, 56)],
        'notes': {
            28: 'ハード層の原本（HEAD.md）から、値を書き換えずにそのまま取り出す。',
            30: '原本に項目がなければ、推測せずにそこで止める。',
            35: 'ひらがな版は、カタカナから機械で作る。',
            41: '全角版も、同じ値から機械で作る。',
            52: '住所は原本の一行を、郵便番号・都道府県・市区町村・番地・建物に割る。',
            53: '割れなければ書き出しを止め、間違った値を黙って作らない。',
        },
    },
}


_STR = re.compile(r"(['\"`])([^'\"`]*?[\u4e00-\u9fff][^'\"`]*?)\1")
_JA_KANJI_ONLY = ('全角',)   # かな無しでも日本語の文言


def zh_line(t):
    """主筆 11-06「再檢查還有沒有中文」: かなの無い漢字だけの文字列 = 中国語の画面文言. その行は枠に出さない(行番号はそのまま, 抜けは見える)."""
    for m in _STR.finditer(t):
        v = m.group(2)
        if re.search(r'[\u3040-\u30ff]', v) or any(w in v for w in _JA_KANJI_ONLY): continue
        return True
    return False


def strip_comments(lines):
    """[(no, text)] -> 註解を落とした [(no, text)]. 文字列の中の /* や // は落とさない(簡単な引用符追跡)."""
    out, inb = [], False
    for no, t in lines:
        s, i, q = '', 0, None
        while i < len(t):
            c = t[i]
            if inb:
                j = t.find('*/', i)
                if j < 0: i = len(t); break
                inb = False; i = j + 2; continue
            if q:
                s += c
                if c == '\\' and i + 1 < len(t): s += t[i + 1]; i += 2; continue
                if c == q: q = None
                i += 1; continue
            if c in '\'"`': q = c; s += c; i += 1; continue
            if t.startswith('/*', i): inb = True; i += 2; continue
            if t.startswith('//', i) and not (i > 0 and t[i - 1] == ':'): break
            if c == '/' and re.match(r'[=(,:!&|?{};]\s*$|^\s*$|return\s*$', s[-8:] if s else ''):   # 正規表現リテラルは丸ごと
                m = re.match(r'/(?:\\.|\[(?:\\.|[^\]])*\]|[^/\\\n])+/[gimsuy]*', t[i:])
                if m: s += m.group(0); i += len(m.group(0)); continue
            s += c; i += 1
        if s.strip(): out.append((no, s.rstrip()))
    return out


def main():
    bad, data = 0, {}
    for cid, spec in CODE.items():
        src = open(os.path.join(ROOT, spec['file']), encoding='utf-8').read().split('\n')
        blocks = []
        for a, b in spec['ranges']:
            blocks.append([x for x in strip_comments([(n, src[n - 1]) for n in range(a, b + 1)]) if not zh_line(x[1])])
        kept = {n for bl in blocks for n, _ in bl}
        for n in spec['notes']:
            if n not in kept: print(f'✗ {cid}: 注の行 {n} がコードに残っていない(行番号ずれ?)'); bad += 1
        data[cid] = {
            'name': spec['name'],
            'span': ' / '.join(f'{a}–{b}' for a, b in spec['ranges']),
            'blocks': [[[n, t] + ([spec['notes'][n]] if n in spec['notes'] else []) for n, t in bl] for bl in blocks],
        }
        print(f'{cid}: {sum(len(b) for b in blocks)} 行, 注 {len(spec["notes"])}')
    cases = {c['id'] for c in json.load(open(os.path.join(ROOT, 'p-rec/product/data/cases.json'), encoding='utf-8'))}
    cases |= {p['id'] for p in json.load(open(os.path.join(ROOT, 'p-rec/product/data/products.json'), encoding='utf-8'))}   # 產品層も枠を持てる
    for cid in data:
        if cid not in cases: print(f'✗ {cid}: cases.json / products.json にない'); bad += 1
    json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(OUT)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
