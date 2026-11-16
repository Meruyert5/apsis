import type { GraphNode } from "./types";

/* The arch survey. Administrators sit at the crown; every other identity hangs
   on a concentric arch matching its hop distance to an administrator. Pure and
   deterministic: positions come from a stable id hash, never Math.random(), so
   a reload draws the same map. Coordinates are stage pixels. */

export interface ArchPoint {
  x: number;
  y: number;
  depth: number;
}

/** One arch: a half-ellipse hung from the crown, wider than it is tall so the
 * set of arches spans the stage. */
export interface ArchRing {
  depth: number;
  rx: number;
  ry: number;
}

export interface ArchLayout {
  origin: { x: number; y: number };
  rx: number;
  ry: number;
  positions: Map<string, ArchPoint>;
  rings: ArchRing[];
}

export function hashIndex(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) % 997;
  }
  return h;
}

/** BFS hop-depth over undirected edges from every administrator. Nodes that
 * cannot reach one land a ring out. */
function assignRings(
  nodes: Pick<GraphNode, "id" | "admin">[],
  edges: { source: string; target: string }[],
): { rings: Map<number, string[]>; maxRing: number } {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  const depth = new Map<string, number>();
  const queue = nodes.filter((node) => node.admin).map((node) => node.id);
  for (const id of queue) depth.set(id, 0);
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    const from = depth.get(current) ?? 0;
    for (const next of adjacency.get(current) ?? []) {
      if (!depth.has(next)) {
        depth.set(next, from + 1);
        queue.push(next);
      }
    }
  }

  const maxDepth = Math.max(0, ...Array.from(depth.values()));
  const rings = new Map<number, string[]>();
  for (const node of nodes) {
    const ring = depth.get(node.id) ?? maxDepth + 1;
    const members = rings.get(ring);
    if (members) members.push(node.id);
    else rings.set(ring, [node.id]);
  }
  return { rings, maxRing: Math.max(0, ...Array.from(rings.keys())) };
}

/** The arch geometry for a stage of `width` by `height` pixels. The crown sits
 * high; the outermost arch spans nearly the full width and reaches down to the
 * bottom of the stage. Inner arches shrink toward the crown on both axes. */
export function archLayout(
  nodes: Pick<GraphNode, "id" | "admin">[],
  edges: { source: string; target: string }[],
  width: number,
  height: number,
): ArchLayout {
  const { rings, maxRing } = assignRings(nodes, edges);
  const wide = width > 900;
  const origin = { x: width / 2, y: Math.max(wide ? 196 : 96, height * (wide ? 0.26 : 0.17)) };
  const rxMax = Math.max(wide ? 200 : 100, width / 2 - (wide ? 64 : 24));
  const ryMax = Math.max(wide ? 160 : 120, height - origin.y - (wide ? 104 : 96));
  const rxMin = Math.max(wide ? 140 : 70, rxMax * 0.34);
  const ryMin = Math.max(wide ? 120 : 90, ryMax * 0.34);
  const positions = new Map<string, ArchPoint>();
  const ringList: ArchRing[] = [];

  for (const [ring, members] of rings) {
    if (ring === 0) {
      members.forEach((id, i) =>
        positions.set(id, {
          x: origin.x + (i - (members.length - 1) / 2) * 104,
          y: origin.y,
          depth: 0,
        }),
      );
      continue;
    }
    const t = maxRing <= 1 ? 1 : (ring - 1) / (maxRing - 1);
    const rx = rxMin + (rxMax - rxMin) * t;
    const ry = ryMin + (ryMax - ryMin) * t;
    ringList.push({ depth: ring, rx, ry });
    const ordered = [...members].sort(
      (a, b) => hashIndex(a) - hashIndex(b) || a.localeCompare(b),
    );
    ordered.forEach((id, i) => {
      const s = (i + 1) / (ordered.length + 1);
      const theta = Math.PI * (1 - s);
      positions.set(id, {
        x: origin.x + rx * Math.cos(theta),
        y: origin.y + ry * Math.sin(theta),
        depth: ring,
      });
    });
  }

  ringList.sort((a, b) => a.depth - b.depth);
  return { origin, rx: rxMax, ry: ryMax, positions, rings: ringList };
}

/** The lower half of an arch: from the left end, through the bottom, to the
 * right end. Sweep 0 takes the bottom run, which is the one we want. */
export function archPath(origin: { x: number; y: number }, ring: ArchRing): string {
  const { rx, ry } = ring;
  return `M ${(origin.x - rx).toFixed(1)} ${origin.y.toFixed(1)} A ${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 0 ${(origin.x + rx).toFixed(1)} ${origin.y.toFixed(1)}`;
}

/** Radial tick marks along one arch, drawn as one path. */
export function ringTicks(ring: ArchRing, origin: { x: number; y: number }, count = 72): string {
  const parts: string[] = [];
  for (let k = 1; k < count; k += 1) {
    const theta = Math.PI * (1 - k / count);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const grow = k % 6 === 0 ? 8 : 4;
    const ix = ring.rx - grow * (ring.rx / ring.ry);
    const iy = ring.ry - grow;
    const ox = ring.rx + grow * (ring.rx / ring.ry);
    const oy = ring.ry + grow;
    parts.push(
      `M ${(origin.x + ix * cos).toFixed(1)} ${(origin.y + iy * sin).toFixed(1)} L ${(origin.x + ox * cos).toFixed(1)} ${(origin.y + oy * sin).toFixed(1)}`,
    );
  }
  return parts.join(" ");
}

/** A cubic edge that bows toward the crown. `bow` offsets the control points
 * sideways so bundles fan apart instead of overlapping. */
export function arcPath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  origin: { x: number; y: number },
  bow: number,
): { d: string; mid: { x: number; y: number } } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * bow;
  const py = (dx / len) * bow;
  const c1x = a.x + (origin.x - a.x) * 0.5 + px;
  const c1y = a.y + (origin.y - a.y) * 0.5 + py;
  const c2x = b.x + (origin.x - b.x) * 0.5 + px;
  const c2y = b.y + (origin.y - b.y) * 0.5 + py;
  return {
    d: `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
    mid: {
      x: (a.x + 3 * c1x + 3 * c2x + b.x) / 8,
      y: (a.y + 3 * c1y + 3 * c2y + b.y) / 8,
    },
  };
}

export function bowFor(index: number, length: number): number {
  return (index % 2 ? -1 : 1) * Math.min(42, length * 0.14);
}

/** Deterministic starfield for the stage: integer arithmetic over the index. */
export function starDots(width: number, height: number, count: number) {
  const dots: { x: number; y: number; r: number; delay: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    dots.push({
      x: (((i * 149 + 17) % 1000) / 1000) * width,
      y: (((i * 263 + 61) % 1000) / 1000) * height,
      r: 0.8 + (i % 3) * 0.5,
      delay: -((i * 0.37) % 4.2),
    });
  }
  return dots;
}
