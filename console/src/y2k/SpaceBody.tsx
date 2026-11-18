import { useEffect, useRef } from "react";
import type { ViewId } from "./model";

type BodyKind = "planet" | "ringed" | "star" | "hole" | "binary" | "gas" | "moon" | "cluster";

interface BodySpec {
  kind: BodyKind;
  accent: string;
  x: number;
  y: number;
  r: number;
  alpha: number;
  tilt: number;
}

const SPECS: Record<ViewId, BodySpec> = {
  overview: { kind: "planet", accent: "#7ce7ff", x: 1.06, y: 0.58, r: 0.27, alpha: 0.42, tilt: -0.18 },
  survey: { kind: "ringed", accent: "#9ff0c8", x: 1.02, y: 0.62, r: 0.28, alpha: 0.38, tilt: -0.22 },
  path: { kind: "star", accent: "#ffb26b", x: 1.07, y: 0.26, r: 0.24, alpha: 0.36, tilt: 0 },
  atlas: { kind: "cluster", accent: "#a78bfa", x: 1.02, y: 0.62, r: 0.27, alpha: 0.35, tilt: 0 },
  drift: { kind: "binary", accent: "#ff9ecb", x: 1.02, y: 0.6, r: 0.25, alpha: 0.38, tilt: 0 },
  commands: { kind: "gas", accent: "#9ff0c8", x: 1.02, y: 0.62, r: 0.29, alpha: 0.35, tilt: 0.1 },
  extensions: { kind: "moon", accent: "#a78bfa", x: 1.02, y: 0.6, r: 0.23, alpha: 0.38, tilt: 0 },
  blueprint: { kind: "hole", accent: "#ffb26b", x: 1.02, y: 0.62, r: 0.26, alpha: 0.4, tilt: 0.1 },
};

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function hashView(view: string) {
  let value = 7;
  for (let i = 0; i < view.length; i += 1) value = (value * 31 + view.charCodeAt(i)) % 2147483647;
  return value;
}

function shadeSphere(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  light = "#8a8f95",
  mid = "#42474d",
  dark = "#0b0d10",
) {
  const g = ctx.createRadialGradient(cx - r * 0.36, cy - r * 0.42, r * 0.05, cx, cy, r * 1.12);
  g.addColorStop(0, light);
  g.addColorStop(0.42, mid);
  g.addColorStop(0.78, dark);
  g.addColorStop(1, "#050608");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function rim(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, accent: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, r * 0.006);
  ctx.shadowColor = accent;
  ctx.shadowBlur = r * 0.16;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.995, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function terminator(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angle = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(cx - r, cy - r * 0.4, cx + r * 1.05, cy + r * 0.5);
  g.addColorStop(0, "rgba(2,3,5,0)");
  g.addColorStop(0.52, "rgba(2,3,5,0.28)");
  g.addColorStop(0.82, "rgba(2,3,5,0.86)");
  g.addColorStop(1, "rgba(2,3,5,0.98)");
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(-cx, -cy);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 1.1, cy - r * 1.1, r * 2.2, r * 2.2);
  ctx.restore();
}

function surface(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rand: () => number, bands = 7) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < bands; i += 1) {
    const y = cy - r + (i / bands) * r * 2;
    const height = r * (0.06 + rand() * 0.08);
    ctx.globalAlpha = 0.05 + rand() * 0.06;
    ctx.fillStyle = i % 2 ? "#b9c1c8" : "#0a0c0f";
    ctx.beginPath();
    ctx.ellipse(cx + (rand() - 0.5) * r * 0.3, y, r * 1.15, height, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 140; i += 1) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * r;
    ctx.fillStyle = rand() > 0.5 ? "#d9dee3" : "#05070a";
    ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * 0.006, r * 0.006);
  }
  ctx.restore();
}

function craters(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rand: () => number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 22; i += 1) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * r * 0.88;
    const cr = r * (0.02 + rand() * 0.08);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    ctx.globalAlpha = 0.16 + rand() * 0.1;
    ctx.fillStyle = "#06080a";
    ctx.beginPath();
    ctx.arc(x, y, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#e6e9ec";
    ctx.lineWidth = Math.max(0.6, r * 0.004);
    ctx.beginPath();
    ctx.arc(x - cr * 0.12, y - cr * 0.12, cr * 0.95, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function rings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  tilt: number,
  accent: string,
  front: boolean,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.globalAlpha = front ? 0.42 : 0.26;
  ctx.strokeStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = r * 0.1;
  for (let i = 0; i < 5; i += 1) {
    ctx.lineWidth = Math.max(0.6, r * (0.006 + i * 0.002));
    ctx.globalAlpha = (front ? 0.36 : 0.2) - i * 0.03;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * (1.35 + i * 0.13), r * (0.38 + i * 0.035), 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  spec: BodySpec,
  rand: () => number,
  t: number,
  ringed = false,
) {
  if (ringed) rings(ctx, cx, cy, r, spec.tilt, spec.accent, false);
  shadeSphere(ctx, cx, cy, r);
  surface(ctx, cx, cy, r, rand, ringed ? 9 : 7);
  terminator(ctx, cx, cy, r, -0.18 + Math.sin(t * 0.05) * 0.02);
  rim(ctx, cx, cy, r, spec.accent, 0.55);
  if (ringed) rings(ctx, cx, cy, r, spec.tilt, spec.accent, true);
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number) {
  const pulse = 0.98 + Math.sin(t * 0.6) * 0.02;
  const corona = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 2.6);
  corona.addColorStop(0, "rgba(255,244,220,.55)");
  corona.addColorStop(0.18, "rgba(255,196,120,.32)");
  corona.addColorStop(0.46, "rgba(255,150,80,.1)");
  corona.addColorStop(0.75, "rgba(255,150,80,.025)");
  corona.addColorStop(1, "rgba(255,150,80,0)");
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.6 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = "#ffd9a8";
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2 + t * 0.04;
    const inner = r * (1.18 + (i % 3) * 0.06);
    const outer = r * (1.6 + (i % 4) * 0.13);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.restore();

  const core = ctx.createRadialGradient(cx - r * 0.08, cy - r * 0.1, r * 0.02, cx, cy, r * 1.02);
  core.addColorStop(0, "#fffdf4");
  core.addColorStop(0.46, "#ffe4b8");
  core.addColorStop(0.72, "rgba(255,196,126,.72)");
  core.addColorStop(0.9, "rgba(255,176,96,.28)");
  core.addColorStop(1, "rgba(255,176,96,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.02 * pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawHole(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, spec: BodySpec, t: number) {
  const halo = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.4);
  halo.addColorStop(0, "rgba(255,196,120,.18)");
  halo.addColorStop(0.4, "rgba(124,231,255,.08)");
  halo.addColorStop(1, "rgba(124,231,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spec.tilt);
  for (let i = 0; i < 7; i += 1) {
    const rr = r * (1.35 + i * 0.18);
    ctx.globalAlpha = 0.3 - i * 0.03;
    const g = ctx.createLinearGradient(-rr, 0, rr, 0);
    g.addColorStop(0, "rgba(255,178,107,0)");
    g.addColorStop(0.32, "rgba(255,196,140,.75)");
    g.addColorStop(0.62, "rgba(124,231,255,.55)");
    g.addColorStop(1, "rgba(124,231,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = r * 0.035;
    ctx.beginPath();
    ctx.ellipse(0, 0, rr, rr * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = "#fff4e0";
  ctx.lineWidth = Math.max(1.2, r * 0.012);
  ctx.shadowColor = "#ffd9a8";
  ctx.shadowBlur = r * 0.14;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.16, r * 0.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#020304";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,244,224,.75)";
  ctx.lineWidth = Math.max(1, r * 0.008);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.005, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.35 + Math.sin(t * 0.5) * 0.05;
  ctx.strokeStyle = "#7ce7ff";
  ctx.lineWidth = Math.max(1, r * 0.005);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.2, -0.6, 0.9);
  ctx.stroke();
  ctx.restore();
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  view: ViewId,
  spec: BodySpec,
  width: number,
  height: number,
  t: number,
  motion: boolean,
) {
  const rand = seeded(hashView(view));
  const base = Math.min(width, height);
  const cx = width * (width < 760 ? 0.86 : spec.x);
  const cy = height * (width < 760 ? 0.2 : spec.y);
  const r = base * (width < 760 ? spec.r * 0.72 : spec.r) * (1 + Math.sin(t * 0.16) * (motion ? 0.008 : 0));

  ctx.save();
  ctx.globalAlpha = spec.alpha;

  if (spec.kind === "planet") {
    const g = ctx.createRadialGradient(cx - r * 0.36, cy - r * 0.42, r * 0.05, cx, cy, r * 1.12);
    g.addColorStop(0, "#9aa0a5");
    g.addColorStop(0.45, "#4c5259");
    g.addColorStop(1, "#07090b");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    surface(ctx, cx, cy, r, rand, 6);
    terminator(ctx, cx, cy, r, -0.12);
    rim(ctx, cx, cy, r, spec.accent, 0.6);
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = spec.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.55, r * 0.2, spec.tilt, 0, Math.PI * 2);
    ctx.stroke();
  } else if (spec.kind === "ringed") {
    drawPlanet(ctx, cx, cy, r, spec, rand, t, true);
  } else if (spec.kind === "star") {
    drawStar(ctx, cx, cy, r * 0.72, t);
  } else if (spec.kind === "hole") {
    drawHole(ctx, cx, cy, r * 0.62, spec, t);
  } else if (spec.kind === "binary") {
    const r2 = r * 0.62;
    const cx2 = cx + r * 0.62;
    const cy2 = cy - r * 0.34;
    const g = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.05, cx, cy, r);
    g.addColorStop(0, "#a8adb2");
    g.addColorStop(0.5, "#545a61");
    g.addColorStop(1, "#07090b");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    terminator(ctx, cx, cy, r, 0.1);
    rim(ctx, cx, cy, r, spec.accent, 0.55);
    shadeSphere(ctx, cx2, cy2, r2, "#8b9096", "#3b4046", "#080a0c");
    terminator(ctx, cx2, cy2, r2, 0.2);
    rim(ctx, cx2, cy2, r2, "#ffb26b", 0.5);
  } else if (spec.kind === "gas") {
    shadeSphere(ctx, cx, cy, r, "#c6c0ae", "#6b6a60", "#0b0c0d");
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 12; i += 1) {
      const y = cy - r + (i / 12) * r * 2;
      ctx.globalAlpha = 0.06 + rand() * 0.06;
      ctx.fillStyle = i % 2 ? "#f1e8d2" : "#2b2c2a";
      ctx.beginPath();
      ctx.ellipse(cx, y, r * 1.1, r * (0.035 + rand() * 0.03), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#ffb26b";
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.32, cy + r * 0.18, r * 0.2, r * 0.1, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    terminator(ctx, cx, cy, r, -0.1);
    rim(ctx, cx, cy, r, spec.accent, 0.45);
  } else if (spec.kind === "moon") {
    shadeSphere(ctx, cx, cy, r, "#8f9296", "#484b4f", "#08090b");
    craters(ctx, cx, cy, r, rand);
    terminator(ctx, cx, cy, r, -0.2);
    rim(ctx, cx, cy, r, "#d9d5c9", 0.35);
  } else {
    const items = [
      { dx: 0, dy: 0, scale: 0.5, color: "#ffb26b" },
      { dx: r * 0.7, dy: -r * 0.42, scale: 0.28, color: "#7ce7ff" },
      { dx: -r * 0.52, dy: r * 0.44, scale: 0.2, color: "#a78bfa" },
      { dx: r * 0.42, dy: r * 0.5, scale: 0.14, color: "#9ff0c8" },
    ];
    items.forEach((item, index) => {
      const rr = r * item.scale;
      const px = cx + item.dx;
      const py = cy + item.dy;
      shadeSphere(ctx, px, py, rr, "#a9a49a", "#55524c", "#08090b");
      terminator(ctx, px, py, rr, -0.15);
      rim(ctx, px, py, rr, item.color, 0.5 - index * 0.06);
    });
  }

  ctx.restore();
}

export function SpaceBody({ view, motion }: { view: ViewId; motion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf = 0;
    let start = performance.now();
    let pointerX = 0;
    let targetX = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (now: number) => {
      pointerX += (targetX - pointerX) * 0.03;
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(pointerX, 0);
      drawBody(ctx, view, SPECS[view], width, height, t, motion);
      ctx.restore();
      if (motion) raf = requestAnimationFrame(frame);
    };

    const onMove = (event: PointerEvent) => {
      targetX = (event.clientX / width - 0.5) * -18;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    if (motion) raf = requestAnimationFrame(frame);
    else frame(start);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [view, motion]);

  return <canvas className="page-body" data-body={view} ref={canvasRef} aria-hidden="true" />;
}
