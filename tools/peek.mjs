// 錄影前偵察: 開一頁, 列出看得見的互動元件和大塊容器的位置. 用法: node peek.mjs <url> [w] [h]
import { chromium } from "playwright-core";

const [url, w = "1440", h = "900"] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
await page.waitForTimeout(2500);
const out = await page.evaluate(() => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight;
  };
  const desc = (el) => {
    const r = el.getBoundingClientRect();
    const id = el.id ? "#" + el.id : "";
    const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    const t = (el.innerText || el.value || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] ${t}`;
  };
  const inter = [...document.querySelectorAll("button, a, input, textarea, select, [role=button], [onclick], canvas")].filter(vis).slice(0, 60).map(desc);
  const big = [...document.querySelectorAll("body *")].filter((el) => {
    const r = el.getBoundingClientRect();
    return vis(el) && r.width > 250 && r.height > 200;
  }).slice(0, 25).map(desc);
  return { title: document.title, inter, big };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
