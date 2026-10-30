// Rec UX 重做骨架(2026-10-30). data/cases.json 一則 = 一支影片 + 三段說明; boards.json 給板塊名, 一行說明與產品網址.
// 看法(主筆 10-30「🕹️只要一個按鈕在小標題右側比較好，默認播放影片的」->「標題本身可選擇，對應互動版」):
//   點事例 = 放那一則的影片; 點板塊名(右邊標 🕹️)= 那個產品的真頁面嵌進舞台, 可以直接玩.
//   可玩頁一個產品一個(band 四則都是 rec.ooo/band), 所以跟著板塊名, 不跟著每一則.
// 選中的寫在 #<事例 id> 或 #<板塊 id>, 重整 / 分享連結回到同一個. ↑↓ 在所有可選的(板塊名 + 事例)之間走.
(async () => {
  const [cases, boards] = await Promise.all(
    ["data/cases.json", "data/boards.json"].map((u) => fetch(u, { cache: "no-cache" }).then((r) => r.json())));
  const board = Object.fromEntries(boards.map((b) => [b.id, b]));
  const $ = (id) => document.getElementById(id);
  const list = $("list"), vid = $("vid"), go = $("go"), frame = $("live"), dl = document.querySelector("#detail dl"), root = document.documentElement;
  // 原寸: 錄影是 deviceScaleFactor 2, 所以影片像素 / 2 = 頁面上的原本大小
  const size = (w, h) => {
    root.style.setProperty("--r", `${w}/${h}`);
    root.style.setProperty("--nw", `${w / 2}px`);
  };
  vid.addEventListener("loadedmetadata", () => { if (vid.videoWidth) size(vid.videoWidth, vid.videoHeight); });

  // 板塊的可玩網址 = 那一組第一則的 live
  const liveOf = {};
  cases.forEach((c) => { if (c.live && !liveOf[c.board]) liveOf[c.board] = c.live; });

  // items: 列表上所有可選的, 照畫面順序. {key, el, kind: "board" | "case", ref}
  const items = [];
  let last = null, n = 0;
  cases.forEach((c) => {
    if (c.board !== last) {
      last = c.board; n = 0;
      const b = board[c.board] || { id: c.board, name: c.board };
      if (liveOf[c.board]) {
        const h = document.createElement("button");
        h.className = "bd live";
        h.innerHTML = `<span class="t"></span><span class="p">🕹️</span>`;
        h.querySelector(".t").textContent = b.name;
        items.push({ key: c.board, el: h, kind: "board", ref: b });
        list.appendChild(h);
      } else {
        const h = document.createElement("div");
        h.className = "bd";
        h.textContent = b.name;
        list.appendChild(h);
      }
    }
    const r = document.createElement("button");
    r.className = "row";
    r.innerHTML = `<span class="n">${++n}</span><span class="t"></span>`;
    r.querySelector(".t").textContent = c.title;
    items.push({ key: c.id, el: r, kind: "case", ref: c });
    list.appendChild(r);
  });
  items.forEach((it, j) => it.el.addEventListener("click", () => { cur = show(j); }));

  const text = (t, line, c) => {
    $("t").textContent = t;
    $("line").textContent = line || "";
    dl.hidden = !c;
    $("problem").textContent = c ? c.problem : "";
    $("move").textContent = c ? c.move : "";
    $("outcome").textContent = c ? c.outcome : "";
    $("role").textContent = c ? c.role.join(" / ") : "";
  };

  function show(j) {
    const it = items[j];
    items.forEach((x, k) => x.el.classList.toggle("on", k === j));
    const bid = it.kind === "board" ? it.key : it.ref.board;
    if (it.kind === "board") {
      // 互動版: 真頁面鋪滿盒, 不縮放
      text(it.ref.name, it.ref.line, null);
      vid.hidden = true; frame.hidden = false;
      vid.removeAttribute("src"); vid.load();
      if (frame.getAttribute("src") !== liveOf[bid]) frame.src = liveOf[bid];
    } else {
      const c = it.ref;
      text(c.title, c.line, c);
      // 大小: 先用 cases.json 的 size(影片像素, 如 "1792x1120"), 影片 metadata 到了再照實際寬高改; 都沒有 = 2320x1450(錄影規格 1160x725 @2x)
      size(...(c.size || "2320x1450").split("x").map(Number));
      vid.hidden = false; frame.hidden = true;
      frame.removeAttribute("src");
      if (c.video) { vid.src = c.video; vid.play().catch(() => {}); }
      else { vid.removeAttribute("src"); vid.load(); }
    }
    const url = board[bid] && board[bid].url;
    go.hidden = !url;
    if (url) go.href = url;
    history.replaceState(null, "", "#" + it.key);
    it.el.scrollIntoView({ block: "nearest" });
    return j;
  }
  // 沒有 # 或對不到: 第一則事例(預設放影片)
  const find = (k) => { const j = items.findIndex((x) => x.key === k); return j >= 0 ? j : items.findIndex((x) => x.kind === "case"); };

  let cur = show(find(location.hash.slice(1)));
  // 手打 / 貼上另一個 #id(同一頁不會重載)也要換過去
  addEventListener("hashchange", () => { cur = show(find(location.hash.slice(1))); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const j = cur + (e.key === "ArrowDown" ? 1 : -1);
    if (j >= 0 && j < items.length) cur = show(j);
  });
})();
