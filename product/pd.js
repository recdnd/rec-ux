// Rec Product Design(2026-11-05).
//   data/products.json 一筆 = 一個產品(プロダクト層: 課題 / 提供 / 運営 / 体制), 點產品名就出這一層.
//   data/cases.json 一則 = 一個決定(課題 / 検討 / 決定 / 確認 / 次), type "note" = 自己的標籤(進め方 / 提供のしかた).
// 舞台四種(media / stage): video = movies/<檔> / live = 真頁面 iframe / image = img/ 截圖 / figure = index.html 的 <template>.
// 只有 ja. 選中的寫在 #<id>, 重整 / 分享連結回到同一個. ↑↓ 在所有可選的之間走.
// 路徑全部相對(掛在哪個子路徑都能動); index.html 開頭那一行照網址補 <base>, 所以 fetch / src 不用再處理.
(async () => {
  const [products, cases] = await Promise.all(
    ["data/products.json", "data/cases.json"].map((u) => fetch(u, { cache: "no-cache" }).then((r) => r.json())));
  const $ = (id) => document.getElementById(id);
  const list = $("list"), vid = $("vid"), frame = $("live"), pic = $("pic"), fig = $("fig"), dl = $("dl"), root = document.documentElement;
  const P_LABEL = [["issue", "課題"], ["offer", "提供"], ["run", "運営"], ["team", "体制"]];
  const C_LABEL = [["issue", "課題"], ["options", "検討"], ["decision", "決定"], ["check", "確認"], ["next", "次"]];

  // 原寸: 錄影是 deviceScaleFactor 2, 影片像素 / 2 = 頁面上的原本大小
  const size = (w, h) => {
    root.style.setProperty("--r", `${w}/${h}`);
    root.style.setProperty("--nw", `${w / 2}px`);
  };
  vid.addEventListener("loadedmetadata", () => { if (vid.videoWidth) size(vid.videoWidth, vid.videoHeight); });

  // 🔗 一顆: 靜置只有符號, hover 長出網址(手機一直顯示)
  const link = (url) => {
    const lk = document.createElement("a");
    lk.className = "lk";
    lk.href = url; lk.target = "_blank"; lk.rel = "noopener";
    lk.innerHTML = `🔗<span></span>`;
    lk.querySelector("span").textContent = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return lk;
  };

  const items = [];   // {key, el, kind: "product" | "case", ref}
  products.forEach((p) => {
    const h = document.createElement("div");
    h.className = "bd";
    h.innerHTML = `<span class="t"></span><span class="k"></span>`;
    h.querySelector(".t").textContent = p.name;
    h.querySelector(".k").textContent = p.kind || "";
    if (!p.group) {
      h.classList.add("go");
      h.setAttribute("role", "button");
      h.tabIndex = 0;
      if (p.stage && p.stage.live) h.insertAdjacentHTML("beforeend", `<span class="p">🕹️</span>`);
      h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); h.click(); } });
      items.push({ key: p.id, el: h, kind: "product", ref: p });
    }
    if (p.url) {
      const lk = link(p.url);
      lk.addEventListener("click", (e) => e.stopPropagation());
      h.appendChild(lk);
    }
    list.appendChild(h);
    let n = 0;
    cases.filter((c) => c.product === p.id).forEach((c) => {
      const r = document.createElement("button");
      r.className = "row";
      r.innerHTML = `<span class="n">${++n}</span><span class="t"></span>`;
      r.querySelector(".t").textContent = c.title + (c.media && c.media.phone ? " 📱" : "");
      items.push({ key: c.id, el: r, kind: "case", ref: c });
      list.appendChild(r);
    });
  });
  items.forEach((it, j) => it.el.addEventListener("click", () => { cur = show(j); }));

  // 說明欄: 標題 + 一行 + 標籤 / 文 + 職能
  const text = (t, line, rows, role) => {
    $("t").textContent = t;
    $("line").textContent = line || "";
    dl.textContent = "";
    rows.forEach(([k, v]) => {
      if (!v) return;
      const dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = k; dd.textContent = v;
      dl.append(dt, dd);
    });
    $("role").textContent = (role || []).join(" / ");
  };

  // 舞台: 一次只開一種, 其餘收起(影片停, iframe 清掉)
  const stage = (m) => {
    const isV = !!m.video, isL = !!m.live, isI = !!m.image, isF = !!m.figure;
    vid.hidden = !isV; frame.hidden = !isL; pic.hidden = !isI; fig.hidden = !isF;
    if (isV) {
      size(...(m.size || "2000x1600").split("x").map(Number));
      const src = "movies/" + m.video + (m.v ? "?v=" + m.v : "");
      if (vid.getAttribute("src") !== src) vid.src = src;
      vid.play().catch(() => {});
    } else { vid.pause(); vid.removeAttribute("src"); vid.load(); }
    if (isL) { if (frame.getAttribute("src") !== m.live) frame.src = m.live; } else frame.removeAttribute("src");
    if (isI) {
      const img = pic.querySelector("img");
      img.src = m.image; img.alt = m.alt || "";
      pic.querySelector("figcaption").textContent = m.caption || "";
    }
    if (isF) {
      fig.textContent = "";
      const tpl = document.getElementById(m.figure);
      if (tpl) fig.appendChild(tpl.content.cloneNode(true));
      fig.scrollTop = 0;
    }
  };

  // 說明欄只填字(show 用, reserve 量高也用)
  const fill = (it) => {
    if (it.kind === "product") {
      const p = it.ref;
      text(p.name, p.line, P_LABEL.map(([f, l]) => [l, p[f]]), null);
    } else {
      const c = it.ref;
      const rows = c.type === "note" ? c.notes : C_LABEL.map(([f, l]) => [l, c[f]]);
      text(c.title + (c.media && c.media.phone ? " 📱" : ""), null, rows, c.role);
    }
  };

  // 右欄垂直置中(主筆 11-05「右側板垂直居中」), 但換則時不跳(11-03「走 B 固定盒」):
  // 說明欄的高先留到最長的那一則(放不下就留到右欄剩下的高), 整塊(引導 + 列表 + 說明)再由 CSS 在右欄裡置中. 手機不留.
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
    fill(it);
    stage((it.kind === "product" ? it.ref.stage : it.ref.media) || {});
    // 網址只換 #, 路徑照舊(有 <base> 時 "#x" 會被解到 base 上, 所以寫完整路徑)
    history.replaceState(null, "", location.pathname + location.search + "#" + it.key);
    it.el.scrollIntoView({ block: "nearest" });
    return j;
  }
  // 沒有 # 或對不到: products.json 標 start 的那一個, 沒標就第一個
  const find = (k) => {
    const j = items.findIndex((x) => x.key === k);
    if (j >= 0) return j;
    const s = items.findIndex((x) => x.ref.start);
    return s >= 0 ? s : 0;
  };

  let cur = show(find(decodeURIComponent(location.hash.slice(1))));
  reserve();
  addEventListener("resize", reserve);
  addEventListener("hashchange", () => { cur = show(find(decodeURIComponent(location.hash.slice(1)))); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (e.target && e.target.closest && e.target.closest("#fig, #detail")) return;   // 示意圖 / 說明欄自己捲的時候不搶
    e.preventDefault();
    const j = cur + (e.key === "ArrowDown" ? 1 : -1);
    if (j >= 0 && j < items.length) cur = show(j);
  });
})();
