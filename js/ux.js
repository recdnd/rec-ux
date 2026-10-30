// Rec UX 重做骨架(2026-10-30). data/cases.json 一則 = 一支 15 秒影片 + 三段說明; boards.json 給板塊名與產品網址.
// 選中的事例寫在 #<id>, 重整 / 分享連結都回到同一則. ↑↓ 換則.
(async () => {
  const [cases, boards] = await Promise.all(
    ["data/cases.json", "data/boards.json"].map((u) => fetch(u, { cache: "no-cache" }).then((r) => r.json())));
  const board = Object.fromEntries(boards.map((b) => [b.id, b]));
  const $ = (id) => document.getElementById(id);
  const list = $("list"), vid = $("vid"), go = $("go"), frame = $("live"), root = document.documentElement;
  // 每則兩種看法: 🕹️ 可玩(live 網址嵌進舞台)/ 🎞️ 影片. 預設可玩; 要先有狀態才看得到重點的(買過 / 有門票)在 cases.json 寫 default: "video".
  // 手機一律先放影片(整頁嵌進窄框太擠). 換過的記在 mode[id], 這一頁裡記得
  const phone = matchMedia("(max-width:760px)").matches;
  const mode = {};
  const modeOf = (c) => mode[c.id] || (c.live && c.video && (phone || c.default === "video") ? "video" : c.live ? "live" : "video");
  // 原寸: 錄影是 deviceScaleFactor 2, 所以影片像素 / 2 = 頁面上的原本大小
  const size = (w, h) => {
    root.style.setProperty("--r", `${w}/${h}`);
    root.style.setProperty("--nw", `${w / 2}px`);
  };
  vid.addEventListener("loadedmetadata", () => { if (vid.videoWidth) size(vid.videoWidth, vid.videoHeight); });

  let last = null, n = 0;
  const rows = cases.map((c) => {
    if (c.board !== last) {
      last = c.board; n = 0;
      const h = document.createElement("div");
      h.className = "bd";
      h.textContent = board[c.board] ? board[c.board].name : c.board;
      list.appendChild(h);
    }
    const r = document.createElement("button");
    r.className = "row";
    r.dataset.id = c.id;
    // v 欄: 影片做好了的那則打 ▶, 還沒做的空著(一支一支補, 看得出進度)
    if (c.live) r.classList.add("live");
    r.innerHTML = `<span class="n">${++n}</span><span class="t"></span><span class="m">${c.live ? '<i data-k="live">🕹️</i>' : "<b></b>"}${c.video ? '<i data-k="video">🎞️</i>' : "<b></b>"}</span>`;
    r.querySelector(".t").textContent = c.title;
    r.addEventListener("click", (e) => {
      const k = e.target.closest("i") && e.target.closest("i").dataset.k;
      if (k) mode[c.id] = k;
      show(c.id);
    });
    list.appendChild(r);
    return r;
  });

  // 每一行的 🕹️ / 🎞️: 這一則現在(或下次點開)會用的那個不透明
  const paint = () => rows.forEach((r, j) => r.querySelectorAll(".m i").forEach((m) => m.classList.toggle("cur", m.dataset.k === modeOf(cases[j]))));
  function show(id) {
    const i = Math.max(0, cases.findIndex((c) => c.id === id));
    const c = cases[i];
    rows.forEach((r, j) => r.classList.toggle("on", j === i));
    $("t").textContent = c.title;
    $("line").textContent = c.line;
    $("problem").textContent = c.problem;
    $("move").textContent = c.move;
    $("outcome").textContent = c.outcome;
    $("role").textContent = c.role.join(" / ");
    // 大小: 先用 cases.json 的 size(影片像素, 如 "1792x1120"), 影片 metadata 到了再照實際寬高改; 都沒有 = 2320x1450(錄影規格 1160x725 @2x, 主筆 10-30 交 agent 定)
    size(...(c.size || "2320x1450").split("x").map(Number));
    const embed = modeOf(c) === "live";
    paint();
    vid.hidden = !!embed; frame.hidden = !embed;
    if (embed) {
      vid.removeAttribute("src"); vid.load();
      if (frame.getAttribute("src") !== c.live) frame.src = c.live;
    } else {
      frame.removeAttribute("src");
      if (c.video) { vid.src = c.video; vid.play().catch(() => {}); }
      else { vid.removeAttribute("src"); vid.load(); }
    }
    const url = board[c.board] && board[c.board].url;
    go.hidden = !url;
    if (url) go.href = url;
    history.replaceState(null, "", "#" + c.id);
    rows[i].scrollIntoView({ block: "nearest" });
    return i;
  }

  let cur = show(location.hash.slice(1));
  // 手打 / 貼上另一個 #id(同一頁不會重載)也要換過去
  addEventListener("hashchange", () => { cur = show(location.hash.slice(1)); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const j = cur + (e.key === "ArrowDown" ? 1 : -1);
    if (j >= 0 && j < cases.length) cur = show(cases[j].id);
  });
  rows.forEach((r, j) => r.addEventListener("click", () => { cur = j; }));
})();
