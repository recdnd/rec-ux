// 7xw = Mercari 型 UX 版(2026-11-20 主筆「ux.rec.ooo需要指定轉址到一個帶編號的特定ux版」「對mercari進行精準建模並且默認英語 可以日語切換」): y2p から複製.
//   違い: 預設英語(瀏覽器是日語也先英語, 燈泡切), 事例順 = 買う / 払う / 持つ が先, How I work 一列(products.json の rows).
// y2p 標準作品集(2026-11-20 主筆「改為一份標準的portfolio（帶密碼，從recooo站才知道，自動複製進密碼）非純uiux，也非純運維，也不純向product」):
//   從 uiux/ 複製. 事例(影片 + 課題 / 設計 / 結果)照舊; 板塊名可以按, 按了右邊出產品層(課題 / 提供 / 運営 / 体制, data/products.json, 日文 = aeu 原文),
//   舞台放那個產品的真頁面, 沒有就放那一組第一支影片.
// Rec UX 重做骨架(2026-10-30). data/cases.json 一則 = 一支影片 + 三段說明; boards.json 給板塊名, 一行說明與產品網址.
// 看法(主筆 10-30「🕹️只要一個按鈕在小標題右側比較好，默認播放影片的」->「標題本身可選擇，對應互動版」):
//   點事例 = 放那一則的影片; 點板塊名(右邊標 🕹️)= 那個產品的真頁面嵌進舞台, 可以直接玩.
//   可玩頁一個產品一個(band 四則都是 rec.ooo/band), 所以跟著板塊名, 不跟著每一則.
// 選中的寫在 #<事例 id> 或 #<板塊 id>, 重整 / 分享連結回到同一個. ↑↓ 在所有可選的(板塊名 + 事例)之間走.
(async () => {
  const [cases, boards, pj] = await Promise.all(
    ["data/cases.json", "data/boards.json", "data/products.json"].map((u) => fetch(u, { cache: "no-cache" }).then((r) => r.json())));
  const prod = Object.fromEntries(pj.products.map((p) => [p.id, p]));
  const board = Object.fromEntries(boards.map((b) => [b.id, b]));
  const $ = (id) => document.getElementById(id);
  const list = $("list"), vid = $("vid"), frame = $("live"), dl = document.querySelector("#detail dl"), root = document.documentElement;
  // 語言(主筆 10-31「做成自動檢測語言對齊為日語版的, 並且右上角一個燈泡按鈕可切換語言」): ja / en.
  // 首次照瀏覽器: 認得 ja 就日語, 其餘英語. 按過燈泡之後以按的為準(rec.ux.lang). 文案在 cases.json / boards.json 的 ja 欄, 沒有就退回英文.
  const LANGS = ["en", "ja"], LKEY = "rec.ux.lang.7xw";
  const auto = () => "en";   // 7xw: 預設英語
  let lang = (() => { let v; try { v = localStorage.getItem(LKEY); } catch (e) {} return LANGS.includes(v) ? v : auto(); })();
  const tx = (o, k) => (lang === "ja" && o.ja && o.ja[k]) || o[k];
  const LABEL = { ja: ["課題", "設計", "結果"], en: ["Problem", "Design", "Outcome"] };
  const PLABEL = { ja: ["課題", "提供", "運営", "体制"], en: ["Problem", "Offer", "Operation", "Team"] }, PK = ["issue", "offer", "run", "team"];
  const bulb = $("lang");
  // 類型標(主筆 11-02「要不要標每個案件是什麼類型」-> 三個試版選 A「做成A吧」): 板塊名那一行最右邊灰字寫類型(boards.json kind / ja.kind).
  //   跟著產品走, 不是每一則. 不用圖標(B / C 沒選).
  //   🧊 Singles 雪藏(主筆 11-02「決定不再採用singles這個操作」「singles這個功能和相關代碼雪藏comment out，以後我想做再說」):
  //   原本 Singles 一則一個產品, 類型寫在事例上(cases.json c.kind)放那一則右邊, 網址用事例自己的 c.url 掛在說明標題後. 相關程式下面標 🧊 註解掉, 要開回就拿掉註解.
  // 原寸: 錄影是 deviceScaleFactor 2, 所以影片像素 / 2 = 頁面上的原本大小
  const size = (w, h) => {
    root.style.setProperty("--r", `${w}/${h}`);
    root.style.setProperty("--nw", `${w / 2}px`);
  };
  vid.addEventListener("loadedmetadata", () => { if (vid.videoWidth) size(vid.videoWidth, vid.videoHeight); });

  // 🔗 一顆: 靜置只有符號, hover 長出網址. 板塊名用 b.url. (🧊 Singles 時期(主筆 11-01「類似單曲, 來補全我做的範圍」)也用在事例自己的 c.url, 見 text())
  const link = (url) => {
    const lk = document.createElement("a");
    lk.className = "lk";
    lk.href = url; lk.target = "_blank"; lk.rel = "noopener";
    lk.innerHTML = `🔗<span></span>`;
    lk.querySelector("span").textContent = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return lk;
  };

  // 板塊的可玩網址 = 那一組第一則的 live
  const liveOf = {};
  cases.forEach((c) => { if (c.live && !liveOf[c.board]) liveOf[c.board] = c.live; });
  pj.products.forEach((p) => { if (p.live && !liveOf[p.id]) liveOf[p.id] = p.live; });
  const firstOf = {};   // 沒有真頁面的板塊: 舞台放那一組第一支影片
  cases.forEach((c) => { if (c.video && !firstOf[c.board]) firstOf[c.board] = c; });

  // items: 列表上所有可選的, 照畫面順序. {key, el, kind: "board" | "case", ref}
  const items = [];
  let last = null, n = 0;
  cases.forEach((c) => {
    if (c.board !== last) {
      last = c.board; n = 0;
      const b = board[c.board] || { id: c.board, name: c.board };
      // 板塊名一行: 名字 + 🕹️(有可玩頁才有, 整條可按)+ 🔗(有產品網址才有).
      // 🔗(主筆 10-30「改為小標題右側一個🔗按鈕，hover🔗就出藍字底色框按鈕點擊可以直接跳走」): 靜置只有 🔗, hover 才長出藍字底色框的連結, 點了開新分頁.
      // 🔗 在可按的板塊名裡面, 所以板塊名不能是 <button>(button 裡不能放 a): 用 div + role=button + tabindex, Enter / 空白鍵也能按.
      const h = document.createElement("div");
      h.className = "bd";
      h.innerHTML = `<span class="t"></span><span class="k"></span>`;
      h.querySelector(".t").textContent = b.name;
      h.kind = b;
      if (liveOf[c.board] || prod[c.board]) {
        h.classList.add("live");
        h.setAttribute("role", "button");
        h.tabIndex = 0;
        if (liveOf[c.board]) h.insertAdjacentHTML("beforeend", `<span class="p">🕹️</span>`);
        h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); h.click(); } });
        items.push({ key: c.board, el: h, kind: "board", ref: b });
      }
      if (b.url) {
        // 🔗 和 hover 出來的網址是同一個 <a>: 點 🔗 本身也跳(主筆 10-30「hover時，🔗按鈕本身也是可點擊跳轉範圍」)
        const lk = link(b.url);
        lk.addEventListener("click", (e) => e.stopPropagation());   // 點連結不要順便切到互動版
        h.appendChild(lk);
      }
      list.appendChild(h);
    }
    const r = document.createElement("button");
    r.className = "row";
    r.innerHTML = `<span class="n">${++n}</span><span class="t"></span>`;
    // 🧊 Singles: 事例自己的類型(c.kind)放那一則右邊. 開回時上一行補 <span class="k"></span>, paint() 的選擇器加回 ".row"
    // if (c.kind) r.kind = c;
    // 標題在 paint() 寫(換語言時重寫). 📱 = 手機介面(直式影片, tools/stamp.py 判定)
    items.push({ key: c.id, el: r, kind: "case", ref: c });
    list.appendChild(r);
  });
  boards.forEach((b) => {
    if (!prod[b.id] || cases.some((c) => c.board === b.id)) return;
    const h = document.createElement("div");
    h.className = "bd live"; h.setAttribute("role", "button"); h.tabIndex = 0;
    h.innerHTML = `<span class="t"></span><span class="k"></span>`;
    h.querySelector(".t").textContent = b.name; h.kind = b;
    h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); h.click(); } });
    items.push({ key: b.id, el: h, kind: "board", ref: b });
    list.appendChild(h);
  });
  items.forEach((it, j) => it.el.addEventListener("click", () => { cur = show(j); }));

  const pdl = $("prod");
  let pb = null;   // 現在選的板塊 id(產品層用)
  const text = (t, line, c) => {
    $("t").textContent = t;
    // 🧊 Singles: 事例自己的產品網址掛在說明標題後
    // if (c && c.url) $("t").append(" ", link(c.url));
    $("line").textContent = line || "";
    dl.hidden = !c;
    const p = !c && pb ? prod[pb] : null;
    pdl.hidden = !p;
    pdl.textContent = "";
    if (p) {
      // rows(How I work)= 標籤自帶; 沒有 rows = 產品層四欄
      const rows = p.rows ? p.rows.map((r) => [r.k[lang] || r.k.en, r.v[lang] || r.v.en]) : PK.map((k, i) => [PLABEL[lang][i], tx(p, k) || ""]);
      rows.filter((r) => r[1]).forEach(([k, v]) => {
        const dt = document.createElement("dt"), dd = document.createElement("dd");
        dt.textContent = k; dd.textContent = v; pdl.append(dt, dd);
      });
    }
    $("problem").textContent = c ? tx(c, "problem") : "";
    $("move").textContent = c ? tx(c, "move") : "";
    $("outcome").textContent = c ? tx(c, "outcome") : "";
    $("role").textContent = c ? tx(c, "role").join(" / ") : "";
  };
  // 換語言: 列表的事例標題, 說明的三個標籤, 燈泡的字, <html lang>; 說明欄由 show() 重畫
  const paint = () => {
    root.lang = lang;
    bulb.textContent = lang === "ja" ? "日" : "EN";
    bulb.setAttribute("aria-label", lang === "ja" ? "日本語" : "English");
    document.querySelectorAll("#detail dl:not(#prod) dt").forEach((d, i) => { d.textContent = LABEL[lang][i]; });
    items.forEach((it) => { if (it.kind === "case") it.el.querySelector(".t").textContent = tx(it.ref, "title") + (it.ref.phone ? " 📱" : ""); });
    // 🧊 Singles 時期選擇器是 ".bd, .row"(事例列也有類型)
    list.querySelectorAll(".bd").forEach((el) => { el.querySelector(".k").textContent = el.kind && el.kind.kind ? tx(el.kind, "kind") : ""; });
  };
  bulb.addEventListener("click", () => {
    lang = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
    try { localStorage.setItem(LKEY, lang); } catch (e) {}
    paint();
    if (typeof cur === "number") { show(cur); reserve(); }
  });
  paint();

  // 說明欄只填字(show 用, reserve 量高也用)
  const fill = (it) => {
    if (it.kind === "board") { pb = it.key; text(it.ref.name, tx(it.ref, "line"), null); }
    else (pb = null, text(tx(it.ref, "title") + (it.ref.phone ? " 📱" : ""), tx(it.ref, "line"), it.ref));
  };
  // 右欄垂直置中(主筆 11-05「右側板垂直居中」), 但換則時不跳(11-03「走 B 固定盒」):
  // 說明欄的高先留到最長的那一則(放不下就留到右欄剩下的高), 整塊(列表 + 說明)再由 CSS 在右欄裡置中. 換語言 / 視窗大小要重量. 手機不留.
  const side = $("side"), detail = $("detail"), desk = matchMedia("(min-width:761px)");
  const reserve = () => {
    detail.style.minHeight = "";
    if (!desk.matches) return;
    let h = 0;
    items.forEach((it) => { fill(it); h = Math.max(h, detail.scrollHeight); });
    const kids = [...side.children].filter((e) => e !== detail);
    const rest = side.clientHeight - kids.reduce((s, e) => s + e.scrollHeight, 0) - 4 * kids.length;
    detail.style.minHeight = Math.max(0, Math.min(h, rest)) + "px";
    fill(items[cur]);
  };

  function show(j) {
    const it = items[j];
    items.forEach((x, k) => x.el.classList.toggle("on", k === j));
    const bid = it.kind === "board" ? it.key : it.ref.board;
    fill(it);
    if (it.kind === "board" && !liveOf[bid] && firstOf[bid]) {
      // 沒有真頁面: 放那一組第一支影片
      const c = firstOf[bid];
      size(...(c.size || "2000x1600").split("x").map(Number));
      vid.hidden = false; frame.hidden = true; frame.removeAttribute("src");
      vid.src = c.video + (c.v ? "?v=" + c.v : ""); vid.play().catch(() => {});
    } else if (it.kind === "board" && !liveOf[bid]) {
      // 沒有頁面也沒有影片(How I work): 舞台空著
      vid.hidden = true; frame.hidden = true; vid.removeAttribute("src"); vid.load(); frame.removeAttribute("src");
    } else if (it.kind === "board") {
      // 互動版: 真頁面鋪滿盒, 不縮放
      vid.hidden = true; frame.hidden = false;
      vid.removeAttribute("src"); vid.load();
      if (frame.getAttribute("src") !== liveOf[bid]) frame.src = liveOf[bid];
    } else {
      const c = it.ref;
      // 大小: 先用 cases.json 的 size(影片像素, 如 "1792x1120"), 影片 metadata 到了再照實際寬高改; 都沒有 = 2000x1600(錄影規格 1000x800 @2x; band 例外 1160x725)
      size(...(c.size || "2000x1600").split("x").map(Number));
      vid.hidden = false; frame.hidden = true;
      frame.removeAttribute("src");
      if (c.video) { vid.src = c.video + (c.v ? "?v=" + c.v : ""); vid.play().catch(() => {}); }   // ?v = 內容雜湊(tools/stamp.py), 換了影片網址就換
      else { vid.removeAttribute("src"); vid.load(); }
    }
    history.replaceState(null, "", "#" + it.key);
    it.el.scrollIntoView({ block: "nearest" });
    return j;
  }
  // 沒有 # 或對不到: cases.json 標 start 的那一則(主筆 10-30 Livehouse「作為默認播放的, 因為比較長」), 沒標就第一則
  const find = (k) => {
    const j = items.findIndex((x) => x.key === k);
    if (j >= 0) return j;
    const s = items.findIndex((x) => x.kind === "case" && x.ref.start);
    return s >= 0 ? s : items.findIndex((x) => x.kind === "case");
  };

  let cur = show(find(location.hash.slice(1)));
  reserve();
  addEventListener("resize", reserve);
  // 手打 / 貼上另一個 #id(同一頁不會重載)也要換過去
  addEventListener("hashchange", () => { cur = show(find(location.hash.slice(1))); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const j = cur + (e.key === "ArrowDown" ? 1 : -1);
    if (j >= 0 && j < items.length) cur = show(j);
  });
})();
