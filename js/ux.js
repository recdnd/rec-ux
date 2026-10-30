// Rec UX 重做骨架(2026-10-30). data/cases.json 一則 = 一支 15 秒影片 + 三段說明; boards.json 給板塊名與產品網址.
// 選中的事例寫在 #<id>, 重整 / 分享連結都回到同一則. ↑↓ 換則.
(async () => {
  const [cases, boards] = await Promise.all(
    ["data/cases.json", "data/boards.json"].map((u) => fetch(u, { cache: "no-cache" }).then((r) => r.json())));
  const board = Object.fromEntries(boards.map((b) => [b.id, b]));
  const $ = (id) => document.getElementById(id);
  const list = $("list"), vid = $("vid"), go = $("go"), root = document.documentElement;
  vid.addEventListener("loadedmetadata", () => {
    if (vid.videoWidth) root.style.setProperty("--r", `${vid.videoWidth}/${vid.videoHeight}`);
  });

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
    r.innerHTML = `<span class="n">${++n}</span><span class="t"></span><span class="v">${c.video ? "▶" : ""}</span>`;
    r.querySelector(".t").textContent = c.title;
    r.addEventListener("click", () => show(c.id));
    list.appendChild(r);
    return r;
  });

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
    // 比例: 先用 cases.json 的 ratio(如 "896/560"), 影片 metadata 到了再照實際寬高改; 都沒有 = 16/10
    root.style.setProperty("--r", c.ratio || "16/10");
    if (c.video) { vid.src = c.video; vid.play().catch(() => {}); }
    else { vid.removeAttribute("src"); vid.load(); }
    const url = board[c.board] && board[c.board].url;
    go.hidden = !url;
    if (url) go.href = url;
    history.replaceState(null, "", "#" + c.id);
    rows[i].scrollIntoView({ block: "nearest" });
    return i;
  }

  let cur = show(location.hash.slice(1));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const j = cur + (e.key === "ArrowDown" ? 1 : -1);
    if (j >= 0 && j < cases.length) cur = show(cases[j].id);
  });
  rows.forEach((r, j) => r.addEventListener("click", () => { cur = j; }));
})();
