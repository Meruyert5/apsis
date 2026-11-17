import { useEffect, useState } from "react";
import { byKey, bundles, index, techniques, totals } from "../lib/data";
import { scrollToSection } from "../lib/useSection";
import { OrbitHero } from "../signal/OrbitHero";
import { MissionFigure } from "../components/MissionFigure";

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

const CURVE_Y = (t: number) =>
  46 - Math.sin(t * Math.PI * 2.4) * 10 - Math.exp(-Math.pow((t - 0.72) * 18, 2)) * 28;

const curveFor = (centre: number) =>
  Array.from({ length: 120 }, (_, i) => {
    const t = i / 119;
    const y = 46 - Math.sin(t * Math.PI * 2.4) * 10 - Math.exp(-Math.pow((t - centre) * 18, 2)) * 28;
    return `${(t * 600).toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

export function Signal() {
  const featured = byKey.get(FEATURED);
  const labels = featured?.signature?.labels ?? ["No route", "Apsis"];
  const [phase, setPhase] = useState(0.56);
  const [playing, setPlaying] = useState(
    () => !(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches),
  );

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPhase((value) => (value >= 0.999 ? 0 : Math.min(1, value + 0.006)));
    }, 42);
    return () => window.clearInterval(timer);
  }, [playing]);

  const curve = curveFor(0.72);
  const echo = curveFor(0.34);
  const area = `0,92 ${curve} 600,92`;
  const scrub = (value: number) => {
    setPlaying(false);
    setPhase(value);
  };
  const phaseLabel = phase > 0.96 ? "apsis · transfer" : phase > 0.7 ? "approach · rising" : "inbound · observing";

  return (
    <section className="bio-act bio-signal-act" id="signal" aria-labelledby="signal-title">
      <div className="bio-observatory">
        <OrbitHero labels={labels} phase={phase} />

        <div className="bio-observatory-copy">
          <p className="bio-eyebrow"><b>01</b> / Signal <i /></p>
          <h1 className="bio-title" id="signal-title">
            Every route reaches its <em>apsis.</em>
          </h1>
          <p className="bio-lede">
            Apsis reads an AWS account as an orbital system: bodies on hop shells,
            the administrator at the primary. It finds every route a stolen
            credential could walk, then the fewest actions that close them all.
          </p>
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

        <div className="bio-observatory-meta">
          <b>{totals.accounts}</b> accounts<br />
          <b>{totals.routes}</b> routes<br />
          <b>{EDGES_CUT}</b> edges cut
        </div>
      </div>

      <div className="bio-instrument">
        <div className="bio-lightcurve">
          <div className="bio-instrument-head">
            <span>Light curve / signature transfer</span>
            <b data-playing={playing ? "true" : undefined}>{playing ? "live" : "held"}</b>
          </div>
          <svg viewBox="0 0 600 92" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="lc-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffd27a" />
                <stop offset=".48" stopColor="#ff8fa3" />
                <stop offset="1" stopColor="#4fe3c1" />
              </linearGradient>
              <linearGradient id="lc-echo" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#8b7bff" stopOpacity=".55" />
                <stop offset="1" stopColor="#4fe3c1" stopOpacity=".15" />
              </linearGradient>
              <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff8fa3" stopOpacity=".34" />
                <stop offset=".55" stopColor="#4fe3c1" stopOpacity=".12" />
                <stop offset="1" stopColor="#4fe3c1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={area} fill="url(#lc-fill)" />
            <polyline points={echo} fill="none" stroke="url(#lc-echo)" strokeWidth="1.2" strokeDasharray="4 6" />
            <polyline points={curve} fill="none" stroke="url(#lc-stroke)" strokeWidth="2" strokeLinecap="round" />
            <line x1={phase * 600} y1="8" x2={phase * 600} y2="84" stroke="rgba(255,210,122,.6)" strokeWidth="1" />
            <circle cx={phase * 600} cy={CURVE_Y(phase)} r="4" fill="#ffd27a" />
            <circle cx={phase * 600} cy={CURVE_Y(phase)} r="9" fill="none" stroke="rgba(255,210,122,.45)" />
          </svg>
          <div className="lc-readout">
            <span>T− <b>{((1 - phase) * 10).toFixed(1)}s</b> / phase <b>{String(Math.round(phase * 100)).padStart(2, "0")}%</b></span>
            <span>{phaseLabel}</span>
          </div>
        </div>
        <label className="bio-scrub">
          <span>T−</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={phase}
            onChange={(event) => scrub(Number(event.target.value))}
            aria-label="Scrub the signature transfer"
          />
          <span>APSIS</span>
          <button
            type="button"
            className="bio-scrubplay"
            data-playing={playing ? "true" : undefined}
            aria-pressed={playing}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? "Hold" : "Play"}
          </button>
        </label>
        <div className="bio-observer" aria-hidden="true">
          <MissionFigure variant="observer" />
          <p>Observer / AP-01</p>
        </div>
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
