import type { Route } from "../lib/types";

interface Point {
  x: number;
  y: number;
  label: string;
}

const WIDTH = 860;
const HEIGHT = 300;
const PAD = 70;
const MID = 150;
const WAVE = [0, -30, 24, -34, 30, -24, 30, 0];

function points(labels: string[]): Point[] {
  const step = (WIDTH - PAD * 2) / Math.max(1, labels.length - 1);
  return labels.map((label, index) => ({
    x: PAD + index * step,
    y: MID + (WAVE[index % WAVE.length] ?? 0),
    label,
  }));
}

function curve(pointsList: Point[]): string {
  if (pointsList.length < 2) return "";
  let d = `M ${pointsList[0].x} ${pointsList[0].y}`;
  for (let i = 0; i < pointsList.length - 1; i += 1) {
    const p0 = pointsList[i - 1] ?? pointsList[i];
    const p1 = pointsList[i];
    const p2 = pointsList[i + 1];
    const p3 = pointsList[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function lines(label: string): string[] {
  const words = label.split(" ");
  if (words.length < 3) return [label];
  const split = Math.ceil(words.length / 2);
  return [words.slice(0, split).join(" "), words.slice(split).join(" ")];
}

export function RouteAtlas({ route, account }: { route: Route; account: string }) {
  const nodes = points(route.labels);
  const path = curve(nodes);
  const last = nodes.length - 1;
  const beforeCut = nodes[last - 1];
  const cut = nodes[last];
  const cutX = beforeCut.x + (cut.x - beforeCut.x) * 0.76;
  const cutY = beforeCut.y + (cut.y - beforeCut.y) * 0.76;

  return (
    <div className="atlas">
      <svg
        className="atlas-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Shortest route in ${account}: ${route.labels.join(" to ")}, ${route.hops} hops`}
      >
        <defs>
          <marker id="atlas-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#1a1aff" />
          </marker>
        </defs>

        <g className="atlas-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <line key={index} x1={PAD + index * ((WIDTH - PAD * 2) / 7)} y1="36" x2={PAD + index * ((WIDTH - PAD * 2) / 7)} y2={HEIGHT - 30} />
          ))}
          {Array.from({ length: 16 }, (_, index) => (
            <rect key={index} x={PAD + index * ((WIDTH - PAD * 2) / 15)} y="26" width="2" height="6" />
          ))}
        </g>

        <path className="atlas-path-shadow" d={path} />
        <path className="atlas-path" d={path} markerEnd="url(#atlas-arrow)" />
        <path className="atlas-path-core" d={path} />

        {nodes.slice(0, -1).map((point, index) => {
          const next = nodes[index + 1];
          const x = (point.x + next.x) / 2;
          const y = (point.y + next.y) / 2 - 18;
          return (
            <g key={`hop-${index}`} className="atlas-hop">
              <rect x={x - 8} y={y - 8} width="16" height="16" />
              <text x={x} y={y + 3} textAnchor="middle">{String(index + 1).padStart(2, "0")}</text>
            </g>
          );
        })}

        <g className="atlas-cut">
          <rect x={cutX - 10} y={cutY - 10} width="20" height="20" transform={`rotate(45 ${cutX} ${cutY})`} />
          <line x1={cutX - 6} y1={cutY - 6} x2={cutX + 6} y2={cutY + 6} />
          <line x1={cutX + 6} y1={cutY - 6} x2={cutX - 6} y2={cutY + 6} />
        </g>

        {nodes.map((point, index) => {
          const above = index % 2 === 1;
          const labelLines = lines(point.label);
          const role = index === 0 ? "start" : index === last ? "admin" : "step";
          return (
            <g key={point.label} className={`atlas-node ${role}`}>
              <title>{point.label}</title>
              <circle cx={point.x} cy={point.y} r="14" />
              <rect x={point.x - 6} y={point.y - 6} width="12" height="12" transform={`rotate(45 ${point.x} ${point.y})`} />
              <text className="atlas-label" x={point.x} y={above ? point.y - 28 : point.y + 38} textAnchor="middle">
                {labelLines.map((line, lineIndex) => (
                  <tspan key={line} x={point.x} dy={lineIndex === 0 ? 0 : 12}>{line}</tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="atlas-legend" aria-hidden="true">
        <span><i className="key blue" />Closest route</span>
        <span><i className="key white" />Administrator</span>
        <span><i className="key outline" />Identity</span>
      </div>

      <ol className="hoplist">
        {route.steps.map((step, index) => (
          <li key={`${step.edge}-${index}`} title={step.technique.replaceAll("_", " ")}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{step.name}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
