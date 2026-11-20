/* p-rec 全站前端密碼框(2026-11-15 主筆「p-rec全站和各子頁改為新訪問（只輸入一次後記憶）做一個前端密碼框，那種極簡密碼框的。再設定一個密碼」->「這兩包之外的鎖上，ok」).
   不鎖: 33b(選考中)/ v8q(選考中)/ uiux(選考中: 舊 ux.rec.ooo 整站, 11-15 解鎖)/ aeu(自己的鎖, rec7, 鍵名不同). resume/ + resume/ja/(2026-11-20 主筆 ok: 給搜名字的招募人員, 進 sitemap). 選考結束再把 33b / v8q 加上 <script src="/lock.js">.
   這個 repo 是 Public, 這裡只放 SHA-256, 碼不寫進 repo / 書. 過一次存 localStorage(全站同一個鍵, 輸入一次全站都開); 網址帶 ?k=碼 直接放行.
   樣式照 aeu 那一個(藍細線中心小框). 內容沒抽掉(前端鎖), 只擋直接走進來的人. */
(function(){var H="0dcd981920a7f422b950a04a6f9ae78f785efb347d53d4586e12d6558d325898",K="p-rec.gate";
try{if(localStorage.getItem(K)===H)return}catch(e){}
var st=document.createElement("style");st.textContent='html.lk body>*:not(#lk){display:none!important}#lk{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;width:96px;height:18px;box-sizing:border-box;padding:0 4px;border:1px solid #0000ff;background:transparent;outline:0;font:11px/16px ui-monospace,Menlo,monospace;letter-spacing:3px;color:#000;caret-color:#0000ff;border-radius:0}#lk.ng{border-color:#ff0000;caret-color:#ff0000}';
document.head.appendChild(st);document.documentElement.classList.add("lk");
function sha(t){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,"0")}).join("")})}
function ok(){try{localStorage.setItem(K,H)}catch(e){}document.documentElement.classList.remove("lk");var g=document.getElementById("lk");if(g)g.remove();dispatchEvent(new Event("resize"))}
var q=new URLSearchParams(location.search).get("k");if(q)sha(q).then(function(h){if(h===H)ok()});
document.addEventListener("DOMContentLoaded",function(){if(!document.documentElement.classList.contains("lk"))return;
var i=document.createElement("input");i.id="lk";i.type="password";i.autocomplete="off";i.spellcheck=false;i.setAttribute("aria-label","key");
document.body.appendChild(i);setTimeout(function(){i.focus()},0);
i.addEventListener("keydown",function(e){if(e.key!=="Enter")return;sha(i.value).then(function(h){if(h===H)return ok();i.value="";i.classList.add("ng");setTimeout(function(){i.classList.remove("ng")},200)})})})})();
