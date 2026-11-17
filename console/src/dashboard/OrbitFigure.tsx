interface OrbitPoint {
  x: number;
  y: number;
}

const CX = 170;
const CY = 134;
const RX = 120;
const RY = 55;
const ROTATION = -18;

function orbitPoint(angle: number): OrbitPoint {
  const radians = (angle * Math.PI) / 180;
  const x = CX + Math.cos(radians) * RX;
  const y = CY + Math.sin(radians) * RY;
  const rotation = (ROTATION * Math.PI) / 180;
  return {
    x: CX + (x - CX) * Math.cos(rotation) - (y - CY) * Math.sin(rotation),
    y: CY + (x - CX) * Math.sin(rotation) + (y - CY) * Math.cos(rotation),
  };
}

function arcPath(from: number, to: number): string {
  const points: OrbitPoint[] = [];
  const steps = 48;
  for (let index = 0; index <= steps; index += 1) {
    points.push(orbitPoint(from + ((to - from) * index) / steps));
  }
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}

export function OrbitFigure({
  shortest,
  deepest,
  accounts,
}: {
  shortest: number;
  deepest: number;
  accounts: number;
}) {
  const perigee = orbitPoint(148);
  const apogee = orbitPoint(326);
  const arc = arcPath(148, 326);
  const accountsOnOrbit = Array.from({ length: accounts }, (_, index) => orbitPoint((index * 360) / accounts));
  const hopTicks = Array.from({ length: deepest }, (_, index) =>
    orbitPoint(148 + ((index + 0.5) * (326 - 148)) / deepest),
  );

  return (
    <div className="orbit">
      <svg className="orbit-svg" viewBox="0 0 340 278" role="img" aria-label={`Orbit figure: perigee ${shortest} hop, apogee ${deepest} hops, ${accounts} accounts`}>
        <ellipse className="orbit-ellipse" cx={CX} cy={CY} rx={RX} ry={RY} transform={`rotate(${ROTATION} ${CX} ${CY})`} />
        <ellipse className="orbit-ellipse inner" cx={CX} cy={CY} rx={RX - 17} ry={RY - 9} transform={`rotate(${ROTATION} ${CX} ${CY})`} />

        {accountsOnOrbit.map((point, index) => (
          <circle key={`account-${index}`} className="orbit-account" cx={point.x} cy={point.y} r="1.7" />
        ))}

        <path className="orbit-arc" d={arc} />
        {hopTicks.map((point, index) => (
          <circle key={`hop-${index}`} className="orbit-tick" cx={point.x} cy={point.y} r="2.2" />
        ))}

        <line className="orbit-leader" x1={CX} y1={CY} x2={apogee.x} y2={apogee.y} />
        <line className="orbit-leader" x1={CX} y1={CY} x2={perigee.x} y2={perigee.y} />

        <circle className="orbit-core" cx={CX} cy={CY} r="34" />
        <text className="orbit-big" x={CX} y={CY + 2} textAnchor="middle">
          {String(deepest).padStart(2, "0")}
        </text>
        <text className="orbit-sub" x={CX} y={CY + 16} textAnchor="middle">
          DEEPEST
        </text>

        <circle className="orbit-point apogee" cx={apogee.x} cy={apogee.y} r="5" />
        <circle className="orbit-point perigee" cx={perigee.x} cy={perigee.y} r="5" />

        <text className="orbit-label end" x="300" y="55" textAnchor="end">
          <tspan className="orbit-key">APOGEE</tspan>
          <tspan x="300" dy="12">{String(deepest).padStart(2, "0")} hops</tspan>
        </text>
        <line className="orbit-rule" x1="238" y1="60" x2={apogee.x + 8} y2={apogee.y - 7} />

        <text className="orbit-label start" x="36" y="228">
          <tspan className="orbit-key">PERIGEE</tspan>
          <tspan x="36" dy="12">{String(shortest).padStart(2, "0")} hop</tspan>
        </text>
        <line className="orbit-rule" x1="96" y1="218" x2={perigee.x - 7} y2={perigee.y + 7} />
      </svg>

      <p className="orbit-caption">
        An <em>apsis</em> is an orbit&rsquo;s closest or farthest point. Perigee is the{" "}
        {String(shortest).padStart(2, "0")}-hop route; apogee is the{" "}
        {String(deepest).padStart(2, "0")}-hop route to the administrator.
      </p>

      <div className="orbit-metrics">
        <div><b>{String(shortest).padStart(2, "0")}</b><span>perigee</span></div>
        <div><b>{String(deepest).padStart(2, "0")}</b><span>apogee</span></div>
        <div><b>{accounts}</b><span>accounts</span></div>
      </div>
    </div>
  );
}
