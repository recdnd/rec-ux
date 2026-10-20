// 事例ごとの録画手順. id = data/cards.json の id = movies/<id>.mp4
// url / viewport / crop(切る要素)/ before(録画前の準備)/ act(録画中の操作)

const sleep = (page, ms) => page.waitForTimeout(ms);

async function keys(page, seq, gap = 260) {
  for (const k of seq) {
    await page.keyboard.press(k);
    await sleep(page, gap);
  }
}

async function toLang(page, sel, want) {
  // 語言鈕を押して want(en など)の表示になるまで回す
  const b = page.locator(sel).first();
  for (let i = 0; i < 4; i++) {
    const t = ((await b.innerText().catch(() => "")) || "").trim().toLowerCase();
    if (t === want) return;
    await b.click();
    await sleep(page, 500);
  }
}

// 特效の canvas が上に被さっている頁があるので, 要素の中心へ実際にマウスを動かして押す
async function center(loc) {
  const b = await loc.boundingBox();
  if (!b) throw new Error("not visible: " + loc);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

async function hoverAt(page, loc, wait = 600) {
  const c = await center(loc);
  await page.mouse.move(c.x, c.y, { steps: 12 });
  await sleep(page, wait);
}

async function hoverClick(page, loc, wait = 700, steps = 12) {
  const c = await center(loc);
  await page.mouse.move(c.x, c.y, { steps });
  await sleep(page, 250);
  await page.mouse.click(c.x, c.y);
  await sleep(page, wait);
}

export const scenarios = {
  "dungeons-no-manual": {
    url: "https://rec.ooo/dungeons/",
    async before(page) {
      // 英語表示に(ZH -> EN). 表示がもう EN なら押さない
      const lang = page.locator("#d-lang");
      for (let i = 0; i < 3; i++) {
        if (((await lang.innerText()) || "").trim().toUpperCase() === "EN") break;
        await lang.click();
        await sleep(page, 400);
      }
    },
    async act(page) {
      // 岩漿(橘)を避ける道: 告示牌を読む -> 下へ回って 🪢 と 🎲 を拾う(_dbg3 の地図で確認, 10-20)
      await sleep(page, 900);
      await keys(page, ["ArrowLeft"], 1600);
      await keys(page, ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowLeft", "ArrowLeft", "ArrowUp", "ArrowUp", "ArrowUp", "ArrowLeft"], 380);
      await sleep(page, 900);
      await keys(page, ["ArrowUp", "ArrowUp"], 380);
    },
  },

  "dungeons-desks": {
    // 線上の desks は 308 で閉じているので本機 2828 から(このページに 🎀 リンクは無い)
    url: "http://localhost:2828/desks/NPC%E8%A1%A8.html",
    async act(page) {
      await sleep(page, 900);
      for (const i of [0, 3, 10, 12, 15, 5]) {
        await hoverClick(page, page.locator("button.chip").nth(i), 1000);
      }
      await page.locator("input#qName").click();
      await page.keyboard.type("00", { delay: 140 });
      await sleep(page, 1400);
    },
  },

  "band-no-account": {
    url: "https://rec.ooo/band/",
    async before(page) {
      await toLang(page, "#lang", "en");
    },
    async act(page) {
      await sleep(page, 700);
      await hoverClick(page, page.locator("button.chip").nth(1), 1200);
      await hoverClick(page, page.locator("button.rel").nth(1), 1200);
      // 左下の CD に乗ると棚が開いて買う鈕が出る(押さない: 線上は本物の Stripe)
      await hoverAt(page, page.locator("canvas#cd"), 1500);
      for (const sel of ["#buyA", "#buy1"]) {
        const b = page.locator(sel);
        if (await b.isVisible().catch(() => false)) await hoverAt(page, b, 1700);
      }
    },
  },

  "band-owned-shelf": {
    // 買う前 -> テスト用の所有データ(devbuy と同じ形)を入れて再読込 -> 💽 が出る. 本物の購入ではない
    url: "https://rec.ooo/",
    async before(page) {
      await toLang(page, "#lang", "en");
      await page.goto("https://rec.ooo/band/", { waitUntil: "networkidle" });
      await sleep(page, 1200);
      page.__rel = await page.evaluate(() => (window.RELEASES || [])[0] && window.RELEASES[0].id);
      await page.goto("https://rec.ooo/", { waitUntil: "networkidle" });
      await sleep(page, 1200);
    },
    async act(page) {
      await sleep(page, 1800);
      await page.evaluate((r) => {
        const at = new Date().toISOString();
        const s = { own: {}, seen: {}, tickets: {} };
        s.own[r + "|album"] = { at };
        s.tickets["demo-1"] = { at, src: "album" };
        localStorage.setItem("rec.owned.v1", JSON.stringify(s));
      }, page.__rel);
      await page.reload({ waitUntil: "networkidle" });
      await sleep(page, 2200);
      const shelf = page.locator("a.icon:visible", { hasText: "💽" }).first();
      if (await shelf.count()) await hoverAt(page, shelf, 1500);
    },
  },

  "rec-dock": {
    url: "https://rec.ooo/",
    async before(page) {
      await toLang(page, "#lang", "en");
    },
    async act(page) {
      await sleep(page, 800);
      // 見えている行の ＋ だけ(隠し条目には触らない)
      for (let i = 0; i < 6; i++) {
        const pl = page.locator("a.row:visible .row-pm:visible", { hasText: "＋" }).first();
        if (!(await pl.count())) break;
        await hoverClick(page, pl, 800);
      }
      await sleep(page, 900);
      await hoverAt(page, page.locator("a.icon:visible").first(), 700);
      await hoverClick(page, page.locator("a.icon:visible").first().getByText("✕"), 1300);
    },
  },

  "rec-no-error-text": {
    // 鎖は career(「名前を知っている人だけ」). doujin(18+)は使わない. 正解は打たない
    url: "https://rec.ooo/",
    async before(page) {
      await toLang(page, "#lang", "en");
    },
    async act(page) {
      await sleep(page, 900);
      await hoverClick(page, page.locator("text=/career/i").first(), 1300);
      // 行の上を通ると黒い枠の説明が変わるので, 入力欄へは一気に飛ぶ
      await hoverClick(page, page.locator("#gateIn"), 400, 1);
      await page.keyboard.type("Z", { delay: 220 });
      await page.keyboard.press("Enter");
      await sleep(page, 1500);
      await page.keyboard.press("Backspace");
      await page.keyboard.type("Q", { delay: 220 });
      await page.keyboard.press("Enter");
      await sleep(page, 1800);
    },
  },

  "rec-short-copy": {
    url: "https://rec.ooo/m/",
    mobile: true,
    box: { x: 0, y: 0, width: 375, height: 262 }, // 黒い枠と一段目だけ(二段目に doujin があるので切る)
    async act(page) {
      await sleep(page, 1500);
      for (const want of ["en", "ja", "zh"]) {
        await toLang(page, "#lang, button[id*=lang]", want);
        await sleep(page, 1300);
      }
    },
  },

  "kiln-same-result": {
    url: "https://kiln.rec.ooo/",
    async act(page) {
      await sleep(page, 800);
      await hoverClick(page, page.locator(".frag-card").nth(1), 1400);
      // 同じ入力をプリセットごとに投影し直す. 最後に「預設」へ戻すと最初と同じ結果になる
      for (const i of [1, 2, 0, 1, 0]) {
        await hoverClick(page, page.locator("button.aux-preset-chip").nth(i), 1300);
      }
    },
  },

  "ruvia-format-first": {
    url: "https://ruvia.dev/",
    async before(page) {
      const t = page.locator("#trayCollapseBtn");
      if (await t.isVisible().catch(() => false)) await t.click();
      await sleep(page, 600);
    },
    async act(page) {
      await sleep(page, 900);
      // 結び目を伸ばす -> 新しい結び目は ID(knot-a-d)が先に付き, 中身はあとから書く
      for (const [knot, text] of [[0, "start with a baseline"], [6, "keep a held-out set"]]) {
        const ids0 = await page.evaluate(() => [...document.querySelectorAll("article.knot")].map((a) => a.dataset.knotId));
        await hoverAt(page, page.locator("textarea.knot-content-input").nth(knot), 500);
        await hoverClick(page, page.locator("button.side-add.right").nth(knot), 900);
        // 新しい結び目は内容が畳まれて生まれる -> 見出しを押して開いてから書く
        const nid = await page.evaluate((ids0) => [...document.querySelectorAll("article.knot")].map((a) => a.dataset.knotId).find((i) => !ids0.includes(i)), ids0);
        if (!nid) continue;
        const art = page.locator(`article.knot[data-knot-id="${nid}"]`);
        await hoverClick(page, art.locator(".knot-header"), 500);
        await art.locator("textarea").focus();
        await page.keyboard.type(text, { delay: 55 });
        await sleep(page, 900);
      }
      await hoverClick(page, page.locator("#zoomOutBtn"), 800);
      await hoverClick(page, page.locator("#zoomInBtn"), 1000);
    },
  },
};
