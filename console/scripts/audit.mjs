// Accessibility audit against the built page, measured in the browser.
// Checks: computed text contrast (with alpha), heading order, accessible names,
// target size, horizontal overflow, and font-size floors. Prints findings.
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE_URL || "http://localhost:4180/";
const PORT = Number(process.env.CDP_PORT || 9399);
const ROOT = process.cwd();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await rm(join(ROOT, ".cdp-audit"), { recursive: true, force: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--force-device-scale-factor=1",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${join(ROOT, ".cdp-audit")}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const AUDIT = String.raw`
(() => {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const parse = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((n) => parseFloat(n));
    return { rgb: parts.slice(0, 3), a: parts.length > 3 ? parts[3] : 1 };
  };
  const over = (fg, bg) => fg.map((c, i) => c * fg.a + bg[i] * (1 - fg.a));
  const ratio = (a, b) => {
    const la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  const bgOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0.92) return bg.rgb;
      node = node.parentElement;
    }
    return [230, 230, 220];
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05;
  };

  const contrast = [];
  const sizes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || seen.has(el) || !visible(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    if (!fg) continue;
    const bg = bgOf(el);
    const r = ratio(over(fg.rgb, bg), bg);
    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = px >= 24 || (bold && px >= 18.66);
    const need = large ? 3 : 4.5;
    if (r < need) {
      contrast.push({ text: text.slice(0, 48), cls: (el.className || '').toString().slice(0, 40), r: +r.toFixed(2), need, px: +px.toFixed(1) });
    }
    sizes.push({ px, text: text.slice(0, 30), cls: (el.className || '').toString().slice(0, 30) });
  }

  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
    level: +h.tagName[1],
    text: h.textContent.trim().slice(0, 40),
  }));
  const order = [];
  let previous = 0;
  for (const h of headings) {
    if (previous && h.level > previous + 1) order.push({ from: previous, to: h.level, text: h.text });
    previous = h.level;
  }

  const unnamed = [...document.querySelectorAll('button, a[href], input, [role="tab"]')]
    .filter((el) => visible(el))
    .filter((el) => {
      const label = (el.getAttribute('aria-label') || el.textContent || '').trim();
      return label.length === 0;
    })
    .map((el) => el.outerHTML.slice(0, 80));

  const small = [...document.querySelectorAll('button, [role="tab"], a[href]')]
    .filter((el) => visible(el))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), cls: (el.className || '').toString().slice(0, 34) };
    })
    .filter((x) => x.h > 0 && x.h < 24);

  const tiny = sizes.filter((s) => s.px < 14);

  return {
    overflow: { sw: document.documentElement.scrollWidth, iw: window.innerWidth },
    contrastFailures: contrast.slice(0, 40),
    headingSkips: order,
    headings: headings.map((h) => h.level + ' ' + h.text),
    unnamed: unnamed.slice(0, 20),
    smallTargets: small.slice(0, 20),
    belowFourteen: [...new Map(tiny.map((t) => [t.px + t.cls, t])).values()].slice(0, 20),
  };
})()
`;

let socket;
try {
  let target;
  for (let attempt = 0; attempt < 100 && !target; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await response.json();
      target = targets.find((item) => item.type === "page");
    } catch {
      // starting
    }
    if (!target) await sleep(250);
  }
  if (!target) throw new Error("chrome did not open a page target");

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) =>
        message.error ? reject(new Error(message.error.message)) : resolve(message.result),
      );
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const { result } = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return result.value;
  };

  for (const width of [1440, 390]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: width === 390 ? 844 : 950,
      screenWidth: width,
      screenHeight: width === 390 ? 844 : 950,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: BASE });
    await sleep(2400);
    await evaluate("document.fonts.ready.then(() => true)");
    // Walk the page so every scroll-revealed block is rendered.
    await evaluate(`(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 300));
    })()`);
    const report = await evaluate(AUDIT);
    console.log(`\n=== ${width}px ===`);
    console.log(JSON.stringify(report, null, 1));
  }
} finally {
  try {
    socket?.close();
  } catch {
    chrome.kill();
  }
  chrome.kill();
}
