/* track.js -- 作品集の追蹤(主筆 2026-11-16「我想知道通過p-rec有多少人點各種網站，要是能追蹤具體作品集更好」).
   開いた頁(pv)と, 外のサイトへのクリック(out)を rec.ooo/api/pay?op=go へ beacon で送る. リンクも遷移も変えない.
   代號 f = パスの 1 段目(/33b/ -> 33b, トップ -> top). IP・cookie は送らない / 持たない(後端 rec-rec/home/api/pay.mjs の go()).
   主筆自己: ?self=1 で一度開くと, この端末は以後 self を付けて送る(後端がその IP を 60 日数えない; band の ?self=1 と同じ仕組み).
   読む: python3 rec-band/tools/訪客資料.py(「作品集」の段). 壊れても頁には影響させない. */
(function () {
  try {
    var E = 'https://rec.ooo/api/pay?op=go';
    var f = (location.pathname.split('/')[1] || 'top').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 12) || 'top';
    if (/\.html?$/.test(f)) f = 'top';
    var self = false;
    try { if (/[?&]self=1\b/.test(location.search)) localStorage.setItem('rec.self', '1'); self = localStorage.getItem('rec.self') === '1'; } catch (e) {}
    var send = function (o) {
      o.f = f; if (self) o.self = true;
      var b = JSON.stringify(o);
      try { if (navigator.sendBeacon && navigator.sendBeacon(E, new Blob([b], { type: 'text/plain' }))) return; } catch (e) {}
      try { fetch(E, { method: 'POST', body: b, mode: 'no-cors', keepalive: true }); } catch (e) {}
    };
    var ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    send({ ev: 'pv', ref: ref });
    document.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest && ev.target.closest('a[href]'); if (!a) return;
      var u; try { u = new URL(a.href, location.href); } catch (e) { return; }
      if (!/^https?:$/.test(u.protocol) || u.hostname === location.hostname) return;
      send({ ev: 'out', h: u.hostname, p: u.pathname.slice(0, 60) });
    }, true);
  } catch (e) {}
})();
