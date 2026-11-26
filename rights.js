/* Shared portfolio licensing dock. Summary of /licensing/; portfolio-specific rights reservation. */
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
#portfolio-rights .rights-links a{color:#0000ff}
#portfolio-rights .rights-links{grid-column:1/-1;display:flex;justify-content:flex-end;gap:4px}
@media(max-width:400px){#portfolio-rights .rights-card{grid-template-columns:1fr}}
@media print{#portfolio-rights{position:static;background:none;backdrop-filter:none}#portfolio-rights .rights-card{display:none!important}}
`;
  document.head.append(style);
  const dock = document.createElement('aside');
  dock.id = 'portfolio-rights';
  dock.innerHTML = '<div class="rights-card" id="portfolio-license-summary" hidden><p></p><p></p><div class="rights-links"><a target="_blank" rel="noopener" href="https://rec.ooo/licensing"></a></div></div><button type="button" aria-controls="portfolio-license-summary" aria-expanded="false">© 2026 rec dungeons · All rights reserved · Licensing</button>';
  document.body.append(dock);
  const button = dock.querySelector('button'), card = dock.querySelector('.rights-card');
  const text = {
    en: ['Portfolio and original design works: all rights reserved. For viewing and recruitment review only; no license to reuse the case studies, UI, artwork, text, media or code.', 'No unauthorized copying, adaptation, cloning, redistribution, resale, AI ingestion, training or generation. Attribution does not replace permission. Subject to applicable law and expressly stated separate licenses.', 'Read full terms ↗'],
    ja: ['作品集とオリジナルのデザイン作品の権利を留保します。閲覧・採用審査用であり、事例、UI、絵、文章、映像・音声、コードの再利用は許諾しません。', '無断複製・翻案・模倣制作・再配布・転売・AIへの取込み、学習、生成への利用を認めません。出典表示だけでは許諾になりません。適用法令と明示された個別ライセンスは優先します。', '全文を読む ↗'],
    zh: ['作品集與原創設計作品保留所有權利。僅供瀏覽與招聘審閱；案例、UI、插畫、文字、影音及程式碼均未授予再利用權。', '禁止未經許可的複製、改作、仿製、再散布、轉售，以及 AI 匯入、訓練與生成用途。署名不代替許可；依法允許的使用與明示個別授權除外。', '閱讀全文 ↗']
  };
  const translate = () => {
    const lang = (document.documentElement.lang || 'en').toLowerCase().slice(0,2), t = text[lang] || text.en;
    card.querySelectorAll('p').forEach((p,i) => p.textContent=t[i]);
    const link=card.querySelector('a'); link.textContent=t[2];
    link.href='/licensing/?lang='+(text[lang]?lang:'en');
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
