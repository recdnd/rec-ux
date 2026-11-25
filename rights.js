/* Shared portfolio licensing dock. Summary of rec.ooo/licensing; no new grant. */
(() => {
  if (document.getElementById('portfolio-rights')) return;
  const style = document.createElement('style');
  style.textContent = `
#portfolio-rights{position:fixed;left:2px;bottom:2px;z-index:1000;max-width:calc(100vw - 4px);color:#111;background:rgba(0,0,0,.08);backdrop-filter:blur(12px);font:11px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:left}
#portfolio-rights button{display:block;margin:0;padding:2px 4px;border:0;border-radius:0;background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:left}
#portfolio-rights button:hover{background:rgba(0,0,0,.08)}
#portfolio-rights button:focus-visible,#portfolio-rights a:focus-visible{outline:1px solid currentColor;outline-offset:-1px}
#portfolio-rights .rights-card{box-sizing:border-box;width:460px;max-width:calc(100vw - 4px);padding:4px;display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px}
#portfolio-rights .rights-card[hidden]{display:none}
#portfolio-rights p{margin:0;font:inherit}
#portfolio-rights a{color:inherit;text-decoration:underline;font:inherit}
#portfolio-rights .rights-links{grid-column:1/-1;display:flex;justify-content:space-between;gap:4px}
@media(max-width:400px){#portfolio-rights .rights-card{grid-template-columns:1fr}}
@media print{#portfolio-rights{position:static;background:none;backdrop-filter:none}#portfolio-rights .rights-card{display:none!important}}
`;
  document.head.append(style);
  const dock = document.createElement('aside');
  dock.id = 'portfolio-rights';
  dock.innerHTML = '<div class="rights-card" id="portfolio-license-summary" hidden><p></p><p></p><div class="rights-links"><a target="_blank" rel="noopener" href="https://rec.ooo/licensing"></a><a href="mailto:hi@rec.ooo">hi@rec.ooo</a></div></div><button type="button" aria-controls="portfolio-license-summary" aria-expanded="false">© 2026 rec dungeons · All rights reserved · Licensing</button>';
  document.body.append(dock);
  const button = dock.querySelector('button'), card = dock.querySelector('.rights-card');
  const text = {
    en: ['Original work: all rights reserved. Viewing this portfolio does not grant a license to reuse its art, design or code.', 'Music has separate free-with-credit and paid licenses. Separate licenses and third-party credits take precedence where stated.', 'Full licensing terms ↗'],
    ja: ['オリジナル作品の権利は留保されています。閲覧によって、絵・デザイン・コードの再利用が許諾されるものではありません。', '音楽にはクレジット付き無料利用と有料ライセンスがあります。個別のライセンスや第三者の権利表記がある場合は、そちらが優先されます。', 'ライセンス全文 ↗'],
    zh: ['原創作品保留所有權利。瀏覽本作品集不代表取得插畫、設計或程式碼的再利用授權。', '音樂另有署名免費使用及付費授權。作品另載的授權與第三方權利標示優先適用。', '完整授權條款 ↗']
  };
  const translate = () => {
    const lang = (document.documentElement.lang || 'en').slice(0,2), t = text[lang] || text.en;
    card.querySelectorAll('p').forEach((p,i) => p.textContent=t[i]);
    const link=card.querySelector('a'); link.textContent=t[2];
    link.href='https://rec.ooo/licensing?lang='+(text[lang]?lang:'en');
  };
  translate();
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  let pinned=false;
  const show = value => { card.hidden=!value; button.setAttribute('aria-expanded',String(value)); };
  dock.addEventListener('pointerenter',()=>show(true));
  dock.addEventListener('pointerleave',()=>{if(!pinned&&!dock.contains(document.activeElement))show(false);});
  dock.addEventListener('focusin',()=>show(true));
  dock.addEventListener('focusout',e=>{if(!pinned&&!dock.contains(e.relatedTarget))show(false);});
  button.addEventListener('click',()=>{pinned=!pinned;show(pinned);});
  document.addEventListener('pointerdown',e=>{if(!dock.contains(e.target)){pinned=false;show(false);}});
  dock.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=false;show(false);button.focus();show(false);}});
})();
