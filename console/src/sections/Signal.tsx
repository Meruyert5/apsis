import { byKey, bundles, index, techniques, totals } from "../lib/data";
import { ActHeader } from "../components/ActHeader";
import { scrollToSection } from "../lib/useSection";
import { OrbitHero } from "../signal/OrbitHero";

const FEATURED = "games-studio";

const STEPS = [
  { id: "ingest", name: "Ingest", value: String(totals.identities), unit: "identities", act: "map" },
  { id: "compose", name: "Compose", value: String(techniques.length), unit: "primitives", act: "decide" },
  { id: "find", name: "Find", value: String(totals.routes), unit: "routes", act: "map" },
  { id: "sever", name: "Sever", value: String(bundles.reduce((sum, entry) => sum + entry.bundle.sever.permissionSteps.length, 0)), unit: "actions", act: "prove" },
  { id: "prove", name: "Prove", value: "5", unit: "outputs", act: "prove" },
] as const;

const EDGES_CUT = bundles.reduce((sum, entry) => sum + entry.bundle.sever.edgeCut.edges.length, 0);
const REVOCATIONS = bundles.reduce((sum, entry) => sum + entry.bundle.sever.permissionSteps.length, 0);

function routePath(labels: string[]) {
  const points = labels.map((_, i) => ({
    x: 48 + i * 66,
    y: 322 - i * 25 + Math.sin(i * 1.15) * 18,
  }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const point = points[i];
    d += ` Q ${(prev.x + point.x) / 2} ${Math.min(prev.y, point.y) - 20} ${point.x} ${point.y}`;
  }
  return { points, d };
}

function HeroRoute() {
  const bundle = byKey.get(FEATURED);
  const route = bundle?.signature ?? null;
  const labels = route?.labels ?? ["No route", "Administrator"];
  const { points, d } = routePath(labels);
  const last = points[points.length - 1];

  return (
    <div className="bio-routefield" aria-label={route ? `Signature route: ${labels.join(" to ")}` : "No route to an administrator"}>
      <span className="tag">Signature transfer / {FEATURED}</span>
      <svg viewBox="0 0 600 400" role="img" aria-hidden="true">
        <ellipse cx="300" cy="210" rx="238" ry="148" fill="none" stroke="rgba(79,227,193,.12)" />
        <ellipse cx="300" cy="210" rx="188" ry="112" fill="none" stroke="rgba(79,227,193,.08)" />
        <ellipse cx="300" cy="210" rx="132" ry="76" fill="none" stroke="rgba(79,227,193,.06)" />
        <path d={d} fill="none" stroke="rgba(79,227,193,.24)" strokeWidth="9" strokeLinecap="round" />
        <path d={d} fill="none" stroke="#d6fff2" strokeWidth="1.5" strokeLinecap="round" />
        {points.map((point, i) => (
          <g key={`${labels[i]}-${i}`}>
            <circle cx={point.x} cy={point.y} r={i === points.length - 1 ? 9 : 5.5} fill={i === points.length - 1 ? "#ffd27a" : "#d6fff2"} />
            <circle cx={point.x} cy={point.y} r={i === points.length - 1 ? 20 : 12} fill="none" stroke={i === points.length - 1 ? "rgba(255,210,122,.35)" : "rgba(79,227,193,.28)"} />
            <title>{labels[i]}</title>
          </g>
        ))}
        <circle r="3.4" fill="#ffd27a">
          <animateMotion dur="4.6s" repeatCount="indefinite" path={d} />
        </circle>
        <text x={points[0].x} y={points[0].y + 26} fill="#a9e6d6" fontFamily="IBM Plex Mono" fontSize="14" textAnchor="middle">
          {labels[0]}
        </text>
        <text x={last.x} y={last.y - 22} fill="#ffd27a" fontFamily="IBM Plex Mono" fontSize="14" textAnchor="middle">
          Apsis
        </text>
      </svg>
    </div>
  );
}

export function Signal() {
  const featured = byKey.get(FEATURED);
  const labels = featured?.signature?.labels ?? ["No route", "Apsis"];
  return (
    <section className="bio-act" id="signal" aria-labelledby="signal-title">
      <ActHeader
        as="h1"
        index="01"
        label="Signal"
        title={
          <span id="signal-title">
            Every route reaches its <em>apsis.</em>
          </span>
        }
        lede={
          <>
            Apsis reads an AWS account as an orbital system: bodies on hop shells,
            the administrator at the primary. It finds every route a stolen
            credential could walk, then the fewest actions that close them all.
          </>
        }
        meta={
          <>
            <b>{totals.accounts}</b> accounts<br />
            <b>{totals.routes}</b> routes<br />
            <b>{EDGES_CUT}</b> edges cut
          </>
        }
      />

      <div className="bio-signal-grid">
        <div className="bio-signal-copy">
          <div className="bio-actions">
            <button type="button" className="bio-btn bio-btn--solid" onClick={() => scrollToSection("map")}>
              Open the map →
            </button>
            <button type="button" className="bio-btn" onClick={() => scrollToSection("prove")}>
              Read the evidence
            </button>
          </div>

          <div className="bio-fleet">
            <div><b>{totals.accounts}</b><span>accounts</span></div>
            <div><b>{totals.identities}</b><span>identities</span></div>
            <div><b>{totals.routes}</b><span>routes</span></div>
            <div><b>{REVOCATIONS}</b><span>revocations</span></div>
          </div>
        </div>

        <OrbitHero labels={labels} />
      </div>

      <div className="bio-process" aria-label="The five stages">
        {STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            className="bio-process-node"
            onClick={() => scrollToSection(step.act)}
          >
            <b>{step.name}</b>
            <span>{step.value} {step.unit}</span>
            <em>{step.id === "sever" ? `${EDGES_CUT} edges` : "engine export"}</em>
          </button>
        ))}
      </div>

      <p className="bio-footer" style={{ border: 0, marginTop: 18, paddingTop: 0 }}>
        <span>Source: {index.engine.name} {index.engine.version} / {index.generated.slice(0, 10)}</span>
        <span>{bundles.length} synthetic fixtures · no customer data</span>
      </p>
    </section>
  );
}
