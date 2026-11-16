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
  const structure = await evaluate(`(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    mast: !!document.querySelector('.mast'),
    sections: ['start','survey','atlas','commands','close'].filter(id => !!document.getElementById(id)),
    skip: document.querySelector('.skip')?.getAttribute('href'),
    h1: document.querySelectorAll('h1').length,
    active: document.querySelector('.mast__link[aria-current="true"]')?.textContent?.trim(),
    canvas: document.querySelectorAll('.constellation__canvas, .planet-hero__canvas').length,
  }))()`);
  check("no horizontal overflow at 1440", structure.overflow <= 0, `${structure.overflow}px`);
  check("masthead present", structure.mast);
  check("all five sections present", structure.sections.length === 5, structure.sections.join(","));
  check("skip link targets the start section", structure.skip === "#start", structure.skip);
  check("one h1 on the page", structure.h1 === 1, String(structure.h1));
  check("start is the active section", structure.active === "Start", structure.active);
  check("two field canvases render", structure.canvas === 2, String(structure.canvas));

  await scrollTo("atlas");
  const spy = await evaluate(
    `document.querySelector('.mast__link[aria-current="true"]')?.textContent?.trim()`,
  );
  check("scroll spy selects Atlas", spy === "Atlas", spy);

  await scrollTo("survey");
  await sleep(500);
  const graph = await evaluate(`(() => ({
    nodes: document.querySelectorAll('.survey .constellation__label').length,
    hops: document.querySelectorAll('.hoprail__hop').length,
    routes: document.querySelectorAll('.dossier__route').length,
    stamp: !!document.querySelector('.survey__stamp'),
  }))()`);
  check("survey draws 16 node buttons", graph.nodes === 16, String(graph.nodes));
  check("games-studio signature route has 7 hops", graph.hops === 7, String(graph.hops));
  check("nine reachable principals listed", graph.routes === 9, String(graph.routes));

  const switched = await evaluate(`(() => {
    const sel = document.querySelector('.survey__select select');
    if (!sel) return false;
    const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    set.call(sel, 'startup');
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await sleep(700);
  const account = await evaluate(`(() => ({
    title: document.querySelector('.survey__scenarioName')?.textContent,
    nodes: document.querySelectorAll('.survey .constellation__label').length,
    hops: document.querySelectorAll('.hoprail__hop').length,
    routes: document.querySelectorAll('.dossier__route').length,
  }))()`);
  check("account switch applied", switched && account.title.includes("Series A"), account.title);
  check("series A draws 12 nodes", account.nodes === 12, String(account.nodes));
  check("series A route is 4 hops", account.hops === 4, String(account.hops));
  check("series A lists six reachable principals", account.routes === 6, String(account.routes));

  const hopWalk = await evaluate(`(() => {
    const hop = document.querySelector('.hoprail__hops li:nth-child(2) button');
    if (!hop) return false;
    hop.click();
    return true;
  })()`);
  await sleep(350);
  const walked = await evaluate(`(() => ({
    current: document.querySelector('.hoprail__hop[aria-current="true"]')?.textContent?.trim(),
    count: document.querySelector('.dossier__card--walk .dossier__count')?.textContent?.trim(),
    detail: document.querySelector('.dossier__detailHead')?.textContent?.trim(),
  }))()`);
  check("hop scrubber lights hop 02", hopWalk && walked.current === "02", walked.current);
  check("walk counter reads 02 / 04", /02\s*\/\s*04/.test(walked.count ?? ""), walked.count);
  check("walk detail follows the hop", Boolean(walked.detail), walked.detail);

  const nextHop = await evaluate(`(() => {
    const buttons = [...document.querySelectorAll('.dossier__hop')];
    const next = buttons.find((b) => b.textContent.includes('Next'));
    if (!next || next.disabled) return false;
    next.click();
    return true;
  })()`);
  await sleep(300);
  const advanced = await evaluate(
    `document.querySelector('.hoprail__hop[aria-current="true"]')?.textContent?.trim()`,
  );
  check("Next advances the walk", nextHop && advanced === "03", advanced);

  await evaluate(`document.querySelector('.survey__sever')?.click()`);
  await sleep(700);
  const closed = await evaluate(`(() => ({
    stamp: document.querySelector('.survey__stamp')?.innerText.replace(/\\s+/g, ' ').trim(),
    rail: !!document.querySelector('.hoprail'),
    card: !!document.querySelector('.dossier__card--closed'),
    live: document.querySelector('.survey__live')?.textContent,
  }))()`);
  check("sever stamps the field", /ACCOUNT CLOSED/i.test(closed.stamp ?? ""), closed.stamp);
  check("sever removes the hop rail", !closed.rail);
  check("sever opens the closed dossier", closed.card);
  check("sever announces the closure", /Account closed/.test(closed.live ?? ""), closed.live);

  await evaluate(`document.querySelector('.dossier__restore')?.click()`);
  await sleep(500);
  const restored = await evaluate(`!document.querySelector('.survey__stamp')`);
  check("restore clears the stamp", restored);

  await scrollTo("atlas");
  await evaluate(`document.querySelector('.atlas__filters button:nth-child(3)')?.click()`);
  await sleep(450);
  const atlas = await evaluate(`(() => ({
    rows: document.querySelectorAll('.atlas__row').length,
    pressed: document.querySelector('.atlas__filter[aria-pressed="true"]')?.textContent?.trim(),
    tech: document.querySelector('.atlas__inspect h3')?.textContent?.trim(),
  }))()`);
  check("atlas compute filter yields seven rows", atlas.rows === 7, String(atlas.rows));
  check("atlas filter is pressed", (atlas.pressed ?? "").includes("Compute"), atlas.pressed);
  check("atlas inspector has a technique", Boolean(atlas.tech), atlas.tech);

  const picked = await evaluate(`(() => {
    const cell = document.querySelector('.atlas__cell[data-on="true"]');
    if (!cell) return false;
    cell.click();
    return true;
  })()`);
  await sleep(400);
  const pickedState = await evaluate(`(() => ({
    cell: document.querySelectorAll('.atlas__cell[data-picked="true"]').length,
    clear: !!document.querySelector('.atlas__clear'),
  }))()`);
  check("atlas cell selection is marked", picked && pickedState.cell === 1);
  check("atlas shows the picked account", pickedState.clear);

  await scrollTo("commands");
  await sleep(900);
  const commandsLoaded = await evaluate(`(() => ({
    builder: !!document.querySelector('.commands__builder'),
    terminal: !!document.querySelector('.terminal__pre'),
    verb: document.querySelector('.commands__verb[aria-pressed="true"]')?.textContent?.trim(),
  }))()`);
  check("commands lazy chunk rendered", commandsLoaded.builder && commandsLoaded.terminal);
  check("scan is the default verb", commandsLoaded.verb === "Scan", commandsLoaded.verb);

  await evaluate(`document.querySelector('.commands__verb:nth-child(2)')?.click()`);
  await sleep(500);
  const commandState = await evaluate(`(() => ({
    text: document.querySelector('.commands__cmd')?.textContent?.trim(),
    formats: [...document.querySelectorAll('.commands__format')].map((b) => b.textContent.trim()),
    key: document.querySelector('.terminal__receipt')?.textContent?.trim(),
  }))()`);
  check("sever command is composed", commandState.text.includes("sever"), commandState.text);
  check("sever offers text and JSON", commandState.formats.join(",") === "Text,JSON", commandState.formats.join(","));
  check("recorded output key follows the verb", (commandState.key ?? "").includes("|sever|"), commandState.key);

  await evaluate(`document.querySelector('.commands__copy')?.click()`);
  await sleep(350);
  const copied = await evaluate(`document.querySelector('.commands__copy')?.textContent?.trim()`);
  check("copy gives feedback", copied === "Copied" || copied === "Copy", copied);

  await scrollTo("close");
  const faq = await evaluate(`(() => {
    const item = document.querySelectorAll('.faq')[2];
    if (!item) return null;
    item.querySelector('summary')?.click();
    return item.open;
  })()`);
  await sleep(250);
  check("FAQ item opens", faq === true);

  const beforeMotion = await evaluate(`(() => ({
    chrome: getComputedStyle(document.querySelector('.mast__status'), '::after').animationName,
    reveal: getComputedStyle(document.querySelector('.reveal')).opacity,
  }))()`);
  const toggled = await evaluate(`(() => {
    document.querySelector('.mast__toggle')?.click();
    return document.documentElement.dataset.motion;
  })()`);
  await sleep(300);
  const motionOff = await evaluate(`(() => {
    const node = document.querySelector('.constellation__label');
    const chrome = document.querySelector('.mast__status');
    const reveal = document.querySelector('.reveal');
    const css = node ? getComputedStyle(node) : null;
    return {
      attr: document.documentElement.dataset.motion,
      animation: node ? css.animationName : null,
      transition: css?.transitionDuration,
      chromeAnimation: chrome ? getComputedStyle(chrome, '::after').animationName : null,
      revealOpacity: reveal ? getComputedStyle(reveal).opacity : null,
      scan: getComputedStyle(document.querySelector('.hero__scan')).display,
      pressed: document.querySelector('.mast__toggle')?.getAttribute('aria-pressed'),
    };
  })()`);
  check("motion toggle sets the attribute", toggled === "off" && motionOff.attr === "off", motionOff.attr);
  check("motion off kills canvas node transitions", motionOff.transition === "0s", motionOff.transition);
  check("motion off kills chrome sheen", motionOff.chromeAnimation === "none", motionOff.chromeAnimation);
  check("motion off leaves reveals visible", motionOff.revealOpacity === "1", motionOff.revealOpacity);
  check("motion off hides the scanline", motionOff.scan === "none", motionOff.scan);
  check("motion toggle reports off", motionOff.pressed === "false", motionOff.pressed);
  check(
    "motion was on before the toggle",
    beforeMotion.chrome !== "none",
    `chrome=${beforeMotion.chrome} reveal=${beforeMotion.reveal}`,
  );

  await scrollTo("survey");
  await evaluate(`document.querySelector('.hoprail__play')?.click()`);
  await sleep(300);
  const playState = await evaluate(`(() => {
    const hops = [...document.querySelectorAll('.hoprail__hop')];
    return {
      current: document.querySelector('.hoprail__hop[aria-current="true"]')?.textContent?.trim(),
      last: hops[hops.length - 1]?.textContent?.trim(),
      pressed: document.querySelector('.hoprail__play')?.getAttribute('aria-pressed'),
    };
  })()`);
  check(
    "motion off completes the walk instantly",
    playState.current === playState.last && playState.pressed === "false",
    `${playState.current} / ${playState.last}`,
  );

  await evaluate(`localStorage.setItem('apsis-motion', 'on')`);
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await load(1440, 950);
  await scrollTo("survey");
  await sleep(700);
  const reduced = await evaluate(`(() => {
    const chrome = document.querySelector('.mast__status');
    const reveal = document.querySelector('.reveal');
    return {
      media: matchMedia('(prefers-reduced-motion: reduce)').matches,
      chromeAnimation: getComputedStyle(chrome, '::after').animationName,
      revealOpacity: reveal ? getComputedStyle(reveal).opacity : null,
      scan: getComputedStyle(document.querySelector('.hero__scan')).display,
      motionAttr: document.documentElement.dataset.motion,
    };
  })()`);
  check("prefers-reduced-motion is emulated", reduced.media);
  check("reduced motion kills chrome sheen", reduced.chromeAnimation === "none", reduced.chromeAnimation);
  check("reduced motion leaves reveals visible", reduced.revealOpacity === "1", reduced.revealOpacity);
  check("reduced motion hides the scanline", reduced.scan === "none", reduced.scan);

  await send("Emulation.setEmulatedMedia", { features: [] });

  await load(390, 844);
  await evaluate(`document.querySelector('.survey__map')?.scrollIntoView({ block: "center" })`);
  await sleep(900);
  const mobile = await evaluate(`(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    mast: !!document.querySelector('.mast'),
    hud: getComputedStyle(document.querySelector('.survey__hud')).display,
    map: Math.round(document.querySelector('.survey__map').getBoundingClientRect().height),
    labels: [...document.querySelectorAll('.survey .constellation__label')].filter((el) => getComputedStyle(el).display !== 'none').length,
  }))()`);
  check("no horizontal overflow at 390", mobile.overflow <= 0, `${mobile.overflow}px`);
  check("mobile keeps the masthead", mobile.mast);
  check("mobile hides the survey HUD", mobile.hud === "none", mobile.hud);
  check("mobile field is 600px tall", mobile.map === 600, String(mobile.map));
  check("mobile keeps only the selected label", mobile.labels >= 1 && mobile.labels <= 2, String(mobile.labels));

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
