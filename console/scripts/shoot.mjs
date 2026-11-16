// Capture the built site section by section over the DevTools protocol.
// The plain --screenshot flag cannot scroll, and a tall window would render
// text at a size nobody reads. CDP clips precisely at both widths.
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE_URL || "http://localhost:4180/";
const PORT = Number(process.env.CDP_PORT || 9344);
const ROOT = process.cwd();
const SHOTS = join(ROOT, "shots");
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;

const SECTIONS = ["start", "survey", "atlas", "commands", "close"];
const MAX = {
  start: 2000,
  survey: 1100,
  atlas: 3200,
  commands: 1400,
  close: 2200,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(SHOTS, { recursive: true });
await rm(join(ROOT, ".cdp-profile"), { recursive: true, force: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-crashpad",
    "--disable-crash-reporter",
    "--disable-extensions",
    "--hide-scrollbars",
    "--no-first-run",
    "--force-device-scale-factor=1",
    "--force-color-profile=srgb",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${join(ROOT, ".cdp-profile")}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const report = { desktop: {}, mobile: {} };
let socket;

try {
  let target;
  for (let attempt = 0; attempt < 100 && !target; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await response.json();
      target = targets.find((item) => item.type === "page");
    } catch {
      // chrome is still starting
    }
    if (!target) await sleep(250);
  }
  if (!target) throw new Error("chrome did not expose a page target");

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
        message.error
          ? reject(new Error(`${method}: ${message.error.message}`))
          : resolve(message.result),
      );
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails));
    return result.value;
  };

  const shot = async (name, clip) => {
    const { data } = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
    });
    await writeFile(join(SHOTS, `${name}.png`), Buffer.from(data, "base64"));
    console.log(`shot ${name}${clip ? ` ${clip.width}x${clip.height}@y${clip.y}` : ""}`);
  };

  const metrics = async (width, height) => {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      screenWidth: width,
      screenHeight: height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  };

  const layout = async () =>
    JSON.parse(
      await evaluate(`JSON.stringify({
        overflow: { sw: document.documentElement.scrollWidth, iw: window.innerWidth },
        body: Math.round(document.body.scrollHeight),
        sections: ${JSON.stringify(SECTIONS)}.map(id => {
          const el = document.getElementById(id);
          if (!el) return { id, missing: true };
          const r = el.getBoundingClientRect();
          return { id, top: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
        })
      })`),
    );

  const load = async (width, height) => {
    await metrics(width, height);
    await send("Page.navigate", { url: BASE });
    await sleep(2200);
    await evaluate("document.fonts.ready.then(() => true)");
    await sleep(600);
  };

  const wanted = (id) => !ONLY || ONLY.includes(id);

  /** Scroll a section below the fixed rail, let its entrance settle, then clip. */
  const captureSection = async (label, id, width, maxHeight, suffix = "") => {
    const railH = await evaluate(
      "(() => { const r = document.querySelector('.mast'); return r ? Math.round(r.getBoundingClientRect().height) : 0; })()",
    );
    const found = await evaluate(`(() => {
      const el = document.getElementById(${JSON.stringify(id)});
      if (!el) return false;
      window.scrollTo(0, Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY) - ${railH}));
      return true;
    })()`);
    if (!found) return;
    await sleep(1000);
    const box = JSON.parse(
      await evaluate(`(() => {
        const el = document.getElementById(${JSON.stringify(id)});
        const r = el.getBoundingClientRect();
        return JSON.stringify({ top: Math.round(r.top + window.scrollY), height: Math.round(r.height) });
      })()`),
    );
    // Tall sections reveal their stages only as they enter the viewport, and a
    // beyond-viewport capture never scrolls. Sweep the section once, then clip
    // it from the top so every stage shows in its settled state.
    const vh = await evaluate("window.innerHeight");
    const stride = Math.max(280, Math.round(vh * 0.72));
    for (let offset = 0; offset < box.height; offset += stride) {
      await evaluate(`window.scrollTo(0, ${box.top + offset})`);
      await sleep(120);
    }
    await evaluate(`window.scrollTo(0, ${Math.max(0, box.top - railH)})`);
    await sleep(1000);
    await evaluate("(() => { const r = document.querySelector('.mast'); if (r) r.style.visibility = 'hidden'; })()");
    await shot(`${label}-${id}${suffix}`, {
      x: 0,
      y: box.top,
      width,
      height: Math.min(box.height, maxHeight),
    });
    await evaluate("(() => { const r = document.querySelector('.mast'); if (r) r.style.visibility = ''; })()");
  };

  const flow = async (label, id, width, maxHeight, name, script) => {
    try {
      await evaluate(script);
      await sleep(1100);
      await captureSection(label, id, width, maxHeight, `-${name}`);
    } catch (error) {
      console.log(`flow ${id}/${name} skipped: ${error.message}`);
    }
  };

  const FLOWS = {
    start: [],
    survey: [
      ["walk", "document.querySelector('.hoprail__hops li:nth-child(2) button')?.click()"],
      ["route", "document.querySelector('.dossier__routes li:nth-child(4) .dossier__route')?.click()"],
      ["sever", "document.querySelector('.survey__sever')?.click()"],
    ],
    atlas: [
      ["select", "document.querySelector('.atlas__row:nth-child(6) .atlas__tech')?.click()"],
      ["filter", "document.querySelector('.atlas__filters button:nth-child(3)')?.click()"],
    ],
    commands: [
      ["sever", "document.querySelector('.commands__verb:nth-child(2)')?.click()"],
      ["copy", "document.querySelector('.commands__copy')?.click()"],
    ],
    close: [["faq", "document.querySelectorAll('.faq')[3]?.setAttribute('open', '')"]],
  };

  // ------------------------------------------------------------- desktop
  await load(1440, 950);
  const desktop = await layout();
  report.desktop = desktop;
  console.log("desktop overflow", JSON.stringify(desktop.overflow));
  await shot("1440-masthead", { x: 0, y: 0, width: 1440, height: 950 });

  for (const section of desktop.sections) {
    if (!wanted(section.id) || section.missing) continue;
    await captureSection("1440", section.id, 1440, MAX[section.id] ?? 1700);
    for (const [name, script] of FLOWS[section.id] ?? []) {
      await flow("1440", section.id, 1440, MAX[section.id] ?? 1700, name, script);
    }
    // Reset any state a flow left behind before the next section.
    await load(1440, 950);
  }

  // Mobile first paint of the page, then every section at 390.
  await load(390, 844);
  const mobile = await layout();
  report.mobile = mobile;
  console.log("mobile overflow", JSON.stringify(mobile.overflow));
  await shot("390-masthead", { x: 0, y: 0, width: 390, height: 844 });

  for (const section of mobile.sections) {
    if (!wanted(section.id) || section.missing) continue;
    await captureSection("390", section.id, 390, 2800);
  }

  console.log("report", JSON.stringify(report));
} finally {
  try {
    socket?.close();
  } catch {
    // ignore
  }
  chrome.kill();
}
