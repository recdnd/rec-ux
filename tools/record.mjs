// 事例動画の自動録画. 用法: node record.mjs <scenario> [...]   (node record.mjs list で一覧)
// 流れ: 本機 Chrome(headless)で開く -> CDP screencast で幀を集める -> 対象要素の枠で切る -> ffmpeg で H.264 mp4.
// 出力: ../movies/<id>.mp4 と ../movies/<id>.jpg(poster). 画面は公開サイトから撮る(本機 2828 は 🎀 が写る).
// 尺寸は Spiral の録画に揃える(主筆 10-20): 桌面 960x600 @2x = 1920x1200(16:10), 手機 iPhone SE 375x667 @2x = 750x1334.
import { chromium } from "playwright-core";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { scenarios } from "./scenarios.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const FRAMES = ROOT + "tools/_frames/";
const DPR = 2;

// cards.json の media.v に動画の雜湊を書く -> 頁は ?v= を付けて読むので, 撮り直すと必ず新しい方が出る
function stampVersion(id, mp4) {
  const file = ROOT + "data/cards.json";
  const cards = JSON.parse(readFileSync(file, "utf8"));
  const v = createHash("sha1").update(readFileSync(mp4)).digest("hex").slice(0, 8);
  const c = cards.find((x) => x.id === id);
  if (!c) return;
  c.media = Object.assign({}, c.media, { type: "video", poster: "movies/" + id + ".jpg", v });
  writeFileSync(file, JSON.stringify(cards, null, 2) + "\n");
}

async function record(id, sc) {
  const dir = FRAMES + id + "/";
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext(
    sc.mobile
      ? {
          viewport: { width: 375, height: 667 },
          deviceScaleFactor: DPR,
          isMobile: true,
          hasTouch: true,
          locale: "en-US",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        }
      : { viewport: sc.viewport || { width: 960, height: 600 }, deviceScaleFactor: DPR, locale: "en-US" }
  );
  if (sc.init) await context.addInitScript(sc.init);
  const page = await context.newPage();
  await page.goto(sc.url, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(sc.settle ?? 2000);
  if (sc.before) await sc.before(page);

  // 切る枠(CSS px). 要素なら bbox + pad, 決め打ちなら sc.box
  let box = sc.box;
  if (!box && sc.crop) {
    const b = await page.locator(sc.crop).first().boundingBox();
    if (!b) throw new Error(id + ": crop target not found " + sc.crop);
    const pad = sc.pad ?? 12;
    box = { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + pad * 2, height: b.height + pad * 2 };
  }
  const vp = page.viewportSize();
  box = box || { x: 0, y: 0, width: vp.width, height: vp.height };

  const cdp = await context.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    const n = String(frames.length).padStart(5, "0");
    writeFileSync(dir + n + ".jpg", Buffer.from(f.data, "base64"));
    frames.push({ file: n + ".jpg", t: f.metadata.timestamp });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1, maxWidth: vp.width * DPR, maxHeight: vp.height * DPR });
  await page.waitForTimeout(600);
  await sc.act(page);
  await page.waitForTimeout(sc.tail ?? 1200);
  const tEnd = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  await browser.close();
  if (frames.length < 2) throw new Error(id + ": no frames");

  // 変化した時だけ幀が来るので, 次の幀までの時間をそのまま表示時間にする
  const lines = [];
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : Math.max(tEnd, f.t + 0.5);
    lines.push(`file '${f.file}'`, `duration ${Math.max(0.02, next - f.t).toFixed(3)}`);
  });
  lines.push(`file '${frames[frames.length - 1].file}'`);
  writeFileSync(dir + "list.txt", lines.join("\n") + "\n");

  // 幀の実寸は要求どおりとは限らない(上限で縮む)ので, 1 枚目の実寸から倍率を出す
  const dims = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", dir + frames[0].file]).toString().trim().split(",").map(Number);
  const sx = dims[0] / vp.width;
  const sy = dims[1] / vp.height;
  const c = [box.width * sx, box.height * sy, box.x * sx, box.y * sy].map((v) => Math.round(v));
  c[0] -= c[0] % 2;
  c[1] -= c[1] % 2;
  // sc.out = 出力の寸法(内容が 960x600 に入らない頁は大きい窓で撮って 1920x1200 に縮める)
  const outW = sc.out ? sc.out.w : Math.round(box.width * DPR) - (Math.round(box.width * DPR) % 2);
  const outH = sc.out ? sc.out.h : Math.round(box.height * DPR) - (Math.round(box.height * DPR) % 2);
  const vf = `crop=${c[0]}:${c[1]}:${c[2]}:${c[3]},scale=${outW}:${outH}:flags=lanczos,fps=60,format=yuv420p`;
  const mp4 = ROOT + "movies/" + id + ".mp4";
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", dir + "list.txt", "-vf", vf,
    "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-movflags", "+faststart", "-an", mp4]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-sseof", "-0.1", "-i", mp4, "-frames:v", "1", "-q:v", "3", ROOT + "movies/" + id + ".jpg"]);
  stampVersion(id, mp4);
  const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=width,height", "-of", "csv=p=0", mp4]).toString().trim().replace(/\n/g, " ");
  console.log(`${id}: ${frames.length} frames -> movies/${id}.mp4 (${dur})`);
}

const args = process.argv.slice(2);
if (!args.length || args[0] === "list") {
  console.log(Object.keys(scenarios).join("\n"));
} else {
  for (const id of args[0] === "all" ? Object.keys(scenarios) : args) {
    if (!scenarios[id]) throw new Error("unknown scenario " + id);
    await record(id, scenarios[id]);
  }
}
