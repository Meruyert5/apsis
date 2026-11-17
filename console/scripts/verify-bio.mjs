// End-to-end verification of the constellation rebuild: interactions, scroll spy,
// both motion-off channels, overflow, and console health.
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";

const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE_URL || "http://localhost:4180/";
const PORT = Number(process.env.CDP_PORT || 9419);
const ROOT = process.cwd();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await rm(join(ROOT, ".cdp-verify"), { recursive: true, force: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--no-first-run",
    "--force-device-scale-factor=1",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${join(ROOT, ".cdp-verify")}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const results = [];
const check = (name, condition, detail = "") => {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

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
  const errors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
    if (message.method === "Runtime.exceptionThrown") {
      errors.push(message.params.exceptionDetails.text ?? "exception");
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
      errors.push(message.params.entry.text);
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
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
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.text ?? "evaluation failed");
    return result.value;
  };

  const load = async (width, height) => {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      screenWidth: width,
      screenHeight: height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: BASE });
    await sleep(2000);
    await evaluate("document.fonts.ready.then(() => true)");
    await sleep(500);
  };

  const scrollTo = async (id) => {
    await evaluate(`(() => {
      const el = document.getElementById(${JSON.stringify(id)});
      if (!el) return false;
      window.scrollTo(0, Math.round(el.getBoundingClientRect().top + window.scrollY) - 60);
      return true;
    })()`);
    await sleep(800);
  };

  await send("Runtime.enable");
  await send("Log.enable");


  await load(1440, 950);
  const shell = await evaluate(`(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    topbar: !!document.querySelector('.bio-topbar'),
    sections: ['signal','map','decide','prove'].filter(id => !!document.getElementById(id)),
    skip: document.querySelector('.skip')?.getAttribute('href'),
    h1: document.querySelectorAll('h1').length,
    active: document.querySelector('.bio-actlink[aria-current="true"]')?.textContent?.trim(),
    canvases: document.querySelectorAll('.bio-stage canvas, .bio-corewrap canvas').length,
  }))()`);
  check("no horizontal overflow at 1440", shell.overflow <= 0, `${shell.overflow}px`);
  check("top bar present", shell.topbar);
  check("all four acts present", shell.sections.length === 4, shell.sections.join(","));
  check("skip link targets signal", shell.skip === "#signal", shell.skip);
  check("one h1 on the page", shell.h1 === 1, String(shell.h1));
  check("signal is the active act", shell.active === "01 Signal", shell.active);
  check("map and decide canvases render", shell.canvases === 2, String(shell.canvases));

  const signal = await evaluate(`(() => ({
    bus: document.querySelectorAll('.bio-process-node').length,
    h1: document.querySelector('h1')?.textContent?.replace(/\\s+/g,' ').trim(),
    fleet: [...document.querySelectorAll('.bio-fleet b')].map(el => el.textContent),
  }))()`);
  check("five process nodes", signal.bus === 5, String(signal.bus));
  check("signal names the apsis", signal.h1?.includes("apsis"), signal.h1);
  check("fleet readout has four values", signal.fleet.length === 4, signal.fleet.join(","));

  const instrument = await evaluate(`(() => ({
    live: document.querySelector('.bio-instrument-head b')?.dataset.playing,
    button: !!document.querySelector('.bio-scrubplay'),
    curve: !!document.querySelector('#lc-stroke') && !!document.querySelector('#lc-fill'),
    observer: !!document.querySelector('.bio-observer .mission-figure'),
    readout: [...document.querySelectorAll('.lc-readout b')].map((el) => el.textContent).join(","),
  }))()`);
  check("signal instrument is live", instrument.live === "true", String(instrument.live));
  check("signal has a gradient light curve", instrument.curve);
  check("signal observer renders", instrument.observer);
  check("signal light curve reports a phase", /%$/.test((instrument.readout ?? "").split(",").pop() ?? ""), instrument.readout);

  await scrollTo("map");
  const map = await evaluate(`(() => ({
    rows: document.querySelectorAll('.bio-prow').length,
    hops: document.querySelectorAll('.bio-hop').length,
    title: document.querySelector('.bio-readout h2')?.textContent,
    canvas: !!document.querySelector('.bio-stage canvas'),
  }))()`);
  check("games studio has nine principal rows", map.rows === 9, String(map.rows));
  check("signature route has seven hops", map.hops === 7, String(map.hops));
  check("map readout starts on Tools intern", map.title === "Tools intern", map.title);
  check("map canvas renders", map.canvas);

  const replay = await evaluate(`(async () => {
    const progress = document.querySelector('.bio-hops')?.style.getPropertyValue('--hop-progress');
    document.querySelector('.bio-play')?.click();
    await new Promise((resolve) => setTimeout(resolve, 160));
    const current = document.querySelector('.bio-hop[aria-current="true"]')?.textContent;
    const playing = document.querySelector('.bio-hopbar')?.dataset.playing;
    document.querySelector('.bio-play')?.click();
    return { progress, current, playing };
  })()`);
  check("hop rail reports full progress", replay.progress === "100%", String(replay.progress));
  check("play restarts the walk from the first hop", replay.current === "01", replay.current);
  check("hopbar exposes its playing state", replay.playing === "true", String(replay.playing));

  await evaluate(`document.querySelectorAll('.bio-prow')[2]?.click()`);
  await sleep(400);
  const rowTitle = await evaluate(`document.querySelector('.bio-readout h2')?.textContent`);
  check("selecting a principal changes the readout", rowTitle === "Live-ops engineer", rowTitle);

  await evaluate(`document.querySelector('.bio-sever')?.click()`);
  await sleep(400);
  const cut = await evaluate(`(() => ({
    title: document.querySelector('.bio-readout h2')?.textContent,
    live: document.querySelector('.bio-live')?.textContent,
    stat: document.querySelector('#app-stat-routes')?.textContent,
    bar: [...document.querySelectorAll('.bio-entry span')].map(el => el.textContent).join(" "),
  }))()`);
  check("sever shows zero routes", cut.title === "0 routes remain.", cut.title);
  check("sever announces the closed account", cut.live?.includes("Account closed"), cut.live);
  check("sever shows the edge and action counts", cut.live?.includes("edges cut") && cut.live?.includes("actions revoked"), cut.live);

  await evaluate(`document.querySelector('.bio-sever')?.click()`);
  await sleep(300);
  const restored = await evaluate(`document.querySelector('.bio-readout h2')?.textContent`);
  check("restore returns to the route", restored === "Live-ops engineer", restored);

  await evaluate(`(() => {
    const select = document.querySelector('.bio-account select');
    if (!select) return false;
    select.value = 'ci-cd';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await sleep(500);
  const clean = await evaluate(`(() => ({
    rows: document.querySelectorAll('.bio-prow').length,
    disabled: document.querySelector('.bio-sever')?.disabled,
    live: document.querySelector('.bio-live')?.textContent,
  }))()`);
  check("clean account has no principal rows", clean.rows === 0, String(clean.rows));
  check("clean account disables sever", clean.disabled === true, String(clean.disabled));
  check("clean account says no route", clean.live?.includes("No route"), clean.live);

  await scrollTo("decide");
  const decide = await evaluate(`(() => ({
    rows: document.querySelectorAll('.bio-trow').length,
    ring: document.querySelectorAll('.bio-ringbtn').length,
    view: document.querySelector('.bio-corewrap')?.dataset.view,
    canvas: !!document.querySelector('.bio-corewrap canvas'),
  }))()`);
  check("decide has eighteen technique rows", decide.rows === 18, String(decide.rows));
  check("decide has sixteen account rings", decide.ring === 16, String(decide.ring));
  check("decide defaults to the 3D specimen", decide.view === "3d", decide.view);
  check("decide specimen canvas renders", decide.canvas);

  await evaluate(`document.querySelectorAll('.bio-trow')[3]?.click()`);
  await sleep(300);
  const techTitle = await evaluate(`document.querySelector('.bio-card h3')?.textContent`);
  check("technique selection updates the card", techTitle === "Attach a policy to yourself", techTitle);

  await evaluate(`document.querySelector('[data-core-view="2d"], .bio-coretools button')?.click()`);
  await sleep(200);
  const twoD = await evaluate(`document.querySelector('.bio-corewrap')?.dataset.view`);
  check("2D radial toggle works", twoD === "2d", twoD);

  await scrollTo("prove");
  const prove = await evaluate(`(() => ({
    verbs: document.querySelectorAll('.bio-verb').length,
    revs: document.querySelectorAll('.bio-rev').length,
    zero: document.querySelector('.bio-zero')?.textContent,
    diver: !!document.querySelector('.bio-crew .mission-figure--diver'),
  }))()`);
  check("four command verbs", prove.verbs === 4, String(prove.verbs));
  check("six revocation rows", prove.revs === 6, String(prove.revs));
  check("zero renders", prove.zero === "0", prove.zero);
  check("diver renders", prove.diver);

  const diverDetail = await evaluate(`(() => ({
    parts: document.querySelectorAll('.bio-crew .mission-figure--diver *').length,
    gradients: document.querySelectorAll('.bio-crew .mission-figure--diver linearGradient, .bio-crew .mission-figure--diver radialGradient').length,
  }))()`);
  check("diver is built from many parts", diverDetail.parts >= 60, String(diverDetail.parts));
  check("diver has suit and visor gradients", diverDetail.gradients >= 5, String(diverDetail.gradients));

  const waveSeek = await evaluate(`(async () => {
    const input = document.querySelector('.bio-waveseek');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '0.5');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 120));
    const line = document.querySelector('.bio-waveread b')?.textContent;
    const cursor = document.querySelector('.bio-wavecursor')?.style.left;
    document.querySelector('.bio-waveplay')?.click();
    await new Promise((resolve) => setTimeout(resolve, 160));
    const active = !!document.querySelector('.bio-line[data-active="true"]');
    document.querySelector('.bio-waveplay')?.click();
    return { line, cursor, active };
  })()`);
  check("waveform seek moves the cursor", waveSeek.cursor === "50%", String(waveSeek.cursor));
  check("waveform seek reads a middle line", waveSeek.line !== "01", String(waveSeek.line));
  check("playing the waveform highlights a line", waveSeek.active);

  await evaluate(`document.querySelectorAll('.bio-verb')[1]?.click()`);
  await sleep(300);
  const sevCmd = await evaluate(`document.querySelector('.bio-cmd')?.textContent`);
  check("sever command is composed", sevCmd?.includes("apsis sever"), sevCmd);

  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))`);
  await sleep(300);
  const palette = await evaluate(`!!document.querySelector('.bio-palette')`);
  check("command palette opens", palette);
  await evaluate(`document.querySelector('.bio-palette')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(200);

  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await load(1440, 950);
  await scrollTo("decide");
  const reduced = await evaluate(`(() => ({ reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, view: document.querySelector('.bio-corewrap')?.dataset.view }))()`);
  check("reduced motion is emulated", reduced.reduce);
  check("reduced motion defaults to the 2D core", reduced.view === "2d", reduced.view);
  await send("Emulation.setEmulatedMedia", { features: [] });

  await load(390, 844);
  const mobile = await evaluate(`(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    topbar: !!document.querySelector('.bio-topbar'),
    stage: Math.round(document.querySelector('.bio-stage')?.getBoundingClientRect().width ?? 0),
    rail: getComputedStyle(document.querySelector('.bio-rail') ?? document.body).display,
  }))()`);
  check("no horizontal overflow at 390", mobile.overflow <= 0, `${mobile.overflow}px`);
  check("mobile keeps the top bar", mobile.topbar);
  check("mobile hides the mission rail", mobile.rail === "none", mobile.rail);
  check("mobile stage fills the content width", mobile.stage > 300, String(mobile.stage));

  check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) process.exitCode = 1;
} finally {
  try {
    socket?.close();
  } catch {
    // ignore
  }
  chrome.kill();
}
