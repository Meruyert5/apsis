import { useEffect, useRef } from "react";
import { bundles } from "../lib/data";

/**
 * The living field behind the console: the real fleet graph as filaments and
 * plankton. It is decorative, pauses when hidden, and draws a static frame
 * when motion is off.
 */
export function BioSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points: { x: number; y: number; r: number; violet: boolean }[] = [];
    const edges: { a: number; b: number }[] = [];
    const byKey = new Map(bundles.map((entry) => [entry.key, entry]));
    for (const { bundle } of bundles) {
      const nodes = bundle.nodes;
      const offset = points.length;
      for (const node of nodes) {
        points.push({
          x: node.x,
          y: node.y,
          r: node.admin ? 1.8 : 0.7 + Math.min(1.4, node.degree * 0.18),
          violet: node.kind === "user" || node.admin,
        });
      }
      for (const edge of bundle.edges) {
        const a = nodes.findIndex((node) => node.id === edge.source);
        const b = nodes.findIndex((node) => node.id === edge.target);
        if (a >= 0 && b >= 0) edges.push({ a: offset + a, b: offset + b });
      }
      if (byKey.size === 0) break;
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let start = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionOff = document.documentElement.dataset.motion === "off";
    let animate = !reduced && !motionOff;

    const resize = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = animate ? (now - start) / 1000 : 0;
      const drift = animate ? Math.sin(t * 0.08) * 8 : 0;
      const coords = points.map((point, index) => {
        const wobble = Math.sin(t * 0.12 + index * 1.7) * 4;
        return {
          x: point.x * (width - 80) + 40 + drift + wobble,
          y: point.y * (height - 80) + 40 + Math.cos(t * 0.1 + index) * 3,
          r: point.r,
          violet: point.violet,
        };
      });

      ctx.lineWidth = 1;
      edges.forEach((edge, index) => {
        const a = coords[edge.a];
        const b = coords[edge.b];
        if (!a || !b) return;
        ctx.strokeStyle = index % 7 === 0 ? "rgba(139,123,255,.10)" : "rgba(79,227,193,.06)";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      coords.forEach((point, index) => {
        const pulse = animate ? 0.55 + 0.45 * Math.sin(t * 0.7 + index) : 0.7;
        ctx.fillStyle = point.violet
          ? `rgba(139,123,255,${0.13 * pulse})`
          : `rgba(120,255,220,${0.12 * pulse})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (animate && !document.hidden) {
        frame = requestAnimationFrame(draw);
      }
    };

    const sync = () => {
      animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        document.documentElement.dataset.motion !== "off";
      cancelAnimationFrame(frame);
      start = performance.now();
      draw(performance.now());
    };

    resize();
    draw(performance.now());
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("apsis:motion", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("apsis:motion", sync);
    };
  }, []);

  return (
    <div className="bio-sky" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
