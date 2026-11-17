import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ActHeader } from "../components/ActHeader";
import { FieldCollapse } from "../prove/FieldCollapse";
import { MissionFigure } from "../components/MissionFigure";
import rawCommands from "../data/commands.json";
import { bundles, index, totals } from "../lib/data";
import { uniqueGuardrails } from "../lib/guardrails";
import type { CommandRecord } from "../lib/types";

type Verb = CommandRecord["verb"];
type Format = CommandRecord["format"];

const RECORDS = (rawCommands as { records: CommandRecord[] }).records;
const BY_KEY = new Map(RECORDS.map((record) => [record.key, record]));
const VERBS: { id: Verb; label: string }[] = [
  { id: "scan", label: "Scan" },
  { id: "sever", label: "Sever" },
  { id: "check", label: "Check" },
  { id: "techniques", label: "Techniques" },
];
const FORMATS: Record<Verb, Format[]> = {
  scan: ["text", "json", "sarif", "mermaid"],
  sever: ["text", "json"],
  check: ["text"],
  techniques: ["text", "json"],
};
const FORMAT_LABEL: Record<Format, string> = { text: "Text", json: "JSON", sarif: "SARIF", mermaid: "Mermaid" };
const SCENARIOS = bundles.map((entry) => ({ key: entry.key, title: entry.bundle.scenario.title }));

const EDGES_CUT = bundles.reduce((sum, entry) => sum + entry.bundle.sever.edgeCut.edges.length, 0);
const REVOCATIONS = bundles.reduce((sum, entry) => sum + entry.bundle.sever.permissionSteps.length, 0);

const revocations = (() => {
  const map = new Map<string, { action: string; edges: number; routes: number; accounts: number }>();
  for (const { bundle } of bundles) {
    for (const step of bundle.sever.permissionSteps) {
      const row = map.get(step.action) ?? { action: step.action, edges: 0, routes: 0, accounts: 0 };
      row.edges += step.edgesRemoved;
      row.routes += step.routesKilled;
      row.accounts += 1;
      map.set(step.action, row);
    }
  }
  return [...map.values()].sort((a, b) => b.edges - a.edges || a.action.localeCompare(b.action));
})();

const FAQ = [
  {
    q: "What Apsis actually reads",
    a: "An export of the account's identity and policy metadata: users, roles, groups, what trusts them, and which IAM actions each one may perform. It never writes to the account.",
  },
  {
    q: "How a route differs from a finding",
    a: "A finding names one risky grant. A route is a walk: every hop is a permission the principal can use, and the last hop lands on an administrator. The Map lights the shortest route for each cell.",
  },
  {
    q: "What makes the cut minimum",
    a: "The engine removes the fewest grants that leave no principal able to reach an administrator, then re-runs every source against the reduced graph. The Proof act lists the actions a human can revoke.",
  },
];

export function Prove() {
  const [verb, setVerb] = useState<Verb>("scan");
  const [scenario, setScenario] = useState("games-studio");
  const [format, setFormat] = useState<Format>("text");
  const [copied, setCopied] = useState(false);
  const [handoffCopied, setHandoffCopied] = useState(false);
  const [playingWave, setPlayingWave] = useState(false);
  const [waveIndex, setWaveIndex] = useState(0.18);
  const outputRef = useRef<HTMLDivElement>(null);

  const record = useMemo(() => {
    const key = `${verb === "techniques" ? "all" : scenario}|${verb}|${format}`;
    return BY_KEY.get(key) ?? BY_KEY.get(`${verb === "techniques" ? "all" : scenario}|${verb}|${FORMATS[verb][0]}`) ?? RECORDS[0];
  }, [verb, scenario, format]);

  useEffect(() => {
    if (!FORMATS[verb].includes(format)) setFormat(FORMATS[verb][0]);
  }, [verb, format]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyAlert = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(alert, null, 2));
      setHandoffCopied(true);
      window.setTimeout(() => setHandoffCopied(false), 1600);
    } catch {
      setHandoffCopied(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record.command);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const lines = record.output.split("\n");
  const wavePoints = Array.from({ length: 160 }, (_, i) => {
    const x = (i / 159) * 600;
    const y = 30 + Math.sin(i * 0.52) * 8 + Math.sin(i * 1.71) * 4 + (i % 23 === 0 ? -12 : 0);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const wave = wavePoints.join(" ");
  const waveArea = `0,60 ${wave} 600,60`;
  const activeLine = Math.min(lines.length - 1, Math.max(0, Math.floor(waveIndex * lines.length)));

  useEffect(() => {
    if (!playingWave) return;
    const timer = window.setInterval(() => {
      setWaveIndex((value) => (value >= 0.999 ? 0 : Math.min(1, value + 0.0045)));
    }, 50);
    return () => window.clearInterval(timer);
  }, [playingWave]);

  useEffect(() => {
    if (!playingWave) return;
    const box = outputRef.current;
    if (!box) return;
    const ratio = activeLine / Math.max(1, lines.length - 1);
    box.scrollTop = ratio * Math.max(0, box.scrollHeight - box.clientHeight);
  }, [playingWave, activeLine, lines.length]);

  const seekWave = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setWaveIndex(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
  };
  const focusBundle = bundles.find((entry) => entry.key === scenario)?.bundle ?? bundles[0].bundle;
  const signature = focusBundle.signature;
  const alert = {
    schema: "penumbra.alert/v1",
    kind: "path.opened",
    source: "apsis",
    generated: index.generated,
    account: focusBundle.scenario.accountId,
    principal: signature?.nodes?.[0] ?? null,
    route: signature?.labels ?? [],
    edges: signature?.steps?.map((step) => step.edge) ?? [],
    cut: focusBundle.sever.permissionSteps.map((step) => step.action),
    guardrails: uniqueGuardrails(focusBundle.sever.permissionSteps.map((step) => step.action)).map((item) => item.control),
    evidence: "evidence.json",
  };

  return (
    <section className="bio-act" id="prove" aria-labelledby="prove-title">
      <ActHeader
        index="04"
        label="Prove"
        title={
          <span id="prove-title">
            The output is <em>the evidence.</em>
          </span>
        }
        lede={
          <>
            Build a command, copy it, read the record the engine printed. The
            account on the right is closed by {EDGES_CUT} edges and {REVOCATIONS} actions.
            Nothing here is hand-typed.
          </>
        }
        meta={
          <>
            <b>{RECORDS.length}</b> recorded invocations<br />
            read-only / 0 writes<br />
            export {index.generated.slice(0, 10)}
          </>
        }
      />

      <div className="bio-prove-stage">
        <div className="bio-abyss" aria-hidden="true">
          <FieldCollapse />
          <span className="bio-wavering" />
          <span className="bio-wavering" />
          <span className="bio-wavering" />
        </div>

        <div className="bio-terminal-wrap">
          <article className="bio-terminal">
          <div className="bar">
            <span className="dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="bio-rec"><i />REC</span>
            <b>apsis {index.engine.version}</b>
            <em>{verb === "techniques" ? "registry" : SCENARIOS.find((item) => item.key === scenario)?.title}</em>
          </div>
          <div className="bio-build">
            <div className="bio-verbs" role="group" aria-label="Choose a verb">
              {VERBS.map((item) => (
                <button key={item.id} type="button" className="bio-verb" aria-pressed={verb === item.id} onClick={() => setVerb(item.id)}>
                  <i aria-hidden="true" />{item.label}
                </button>
              ))}
            </div>
            <div className="bio-fields">
              {verb !== "techniques" ? (
                <label className="bio-field">
                  SCENARIO
                  <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
                    {SCENARIOS.map((item) => <option key={item.key} value={item.key}>{item.title}</option>)}
                  </select>
                </label>
              ) : (
                <span className="bio-field">SCOPE <b>whole registry</b></span>
              )}
              <span className="bio-field">FORMAT <b>{FORMAT_LABEL[format]}</b></span>
            </div>
            <div className="bio-cmd">
              <span className="p">$</span>
              <span>{record.command}</span>
              <button type="button" className="copy" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
            </div>
            <div className="bio-output" ref={outputRef} tabIndex={0} role="region" aria-label="Recorded output">
              {lines.map((line, lineIndex) => {
                const tone = line.startsWith("Account closed") ? "ok"
                  : line.startsWith("apsis: clean") ? "ok"
                    : line.includes("->") ? "path"
                      : line.trimStart().startsWith("arn:aws:iam") ? "arn"
                        : /^\s{2,}\w+\s+.*allows/.test(line) ? "grant"
                          : undefined;
                return (
                  <span
                    key={lineIndex}
                    className={`bio-line${tone ? ` ${tone}` : ""}`}
                    data-active={playingWave && lineIndex === activeLine ? "true" : undefined}
                  >
                    {line || " "}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="bio-termfoot">
            <span><b>{lines.length}</b> lines</span>
            <span><b>{FORMAT_LABEL[record.format]}</b> output</span>
            <span>recorded <b>{rawCommands.generated.slice(0, 10)}</b></span>
            <em>{record.key}</em>
          </div>
          <div className="bio-wave">
            <div className="bio-wavehead">
              <span>Waveform / recorded output</span>
              <div className="bio-reels" data-playing={playingWave ? "true" : undefined} aria-hidden="true"><span /><span /></div>
              <button
                type="button"
                className="bio-waveplay"
                data-playing={playingWave ? "true" : undefined}
                aria-pressed={playingWave}
                onClick={() => setPlayingWave((value) => !value)}
              >
                {playingWave ? "Pause" : "Play"}
              </button>
            </div>
            <div className="bio-wavetrack" onPointerDown={seekWave}>
              <svg viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="wave-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#ff6f91" />
                    <stop offset=".52" stopColor="#ff8a6b" />
                    <stop offset="1" stopColor="#ffc46b" />
                  </linearGradient>
                  <linearGradient id="wave-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ff6f91" stopOpacity=".3" />
                    <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((mark) => (
                  <line key={mark} x1={mark * 600} y1="0" x2={mark * 600} y2="60" stroke="rgba(255,138,107,.1)" strokeWidth="1" />
                ))}
                <polygon points={waveArea} fill="url(#wave-fill)" />
                <polyline points={wave} fill="none" stroke="url(#wave-stroke)" strokeWidth="1.6" />
              </svg>
              <span className="bio-wavescan" data-playing={playingWave ? "true" : undefined} />
              <span className="bio-wavecursor" style={{ left: `${waveIndex * 100}%` }} aria-hidden="true" />
            </div>
            <input
              className="bio-waveseek"
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={waveIndex}
              onChange={(event) => setWaveIndex(Number(event.target.value))}
              aria-label="Seek the recorded waveform"
            />
            <div className="bio-waveread">
              <span>line <b>{String(activeLine + 1).padStart(2, "0")}</b> / {String(lines.length).padStart(2, "0")}</span>
              <span>{lines[activeLine]?.trim().slice(0, 72) || "—"}</span>
            </div>
          </div>
          </article>
          <p className="bio-prove-foot">
            <span>Fig. 04 — Recorded invocation</span>
            <span>{lines.length} lines · {FORMAT_LABEL[record.format]} · {record.key}</span>
          </p>
        </div>

        <aside className="bio-closure" aria-label="Closure">
          <p className="bio-zero" aria-label="0 routes remain">0</p>
          <p className="bio-zerolabel"><i /> routes remain</p>
          <p className="bio-zerofine">verified at the cut</p>
          <div className="bio-count">
            <b>{totals.routes}</b><span>→</span><b>0</b>
            <span className="linebar" />
            <span>routes</span>
          </div>
          <div className="bio-crew">
            <MissionFigure variant="diver" />
            <div className="bio-crewmeta">
              <p className="bio-kick">Crew / EVA</p>
              <h3>DIVE-01</h3>
              <dl>
                <div><dt>Role</dt><dd>abyss observer</dd></div>
                <div><dt>Depth</dt><dd>07 shells</dd></div>
                <div><dt>Tether</dt><dd>secure</dd></div>
                <div><dt>Status</dt><dd>read-only</dd></div>
              </dl>
              <p>Records the field, never touches the account.</p>
            </div>
          </div>
          <div className="bio-revledger">
            <h3>Revocations / {REVOCATIONS} actions</h3>
            <p className="sub">{EDGES_CUT} edges cut across {totals.accounts} accounts</p>
            {revocations.slice(0, 6).map((row) => (
              <div className="bio-rev" key={row.action}>
                <span className="action">{row.action}</span>
                <span className="tr"><i style={{ width: `${(row.edges / Math.max(1, revocations[0]?.edges ?? 1)) * 100}%` }} /></span>
                <em>{row.edges}</em>
              </div>
            ))}
            <p className="bio-meta" style={{ marginTop: 12 }}>Printed, not applied. One action can remove several edges.</p>
          </div>

          <div className="bio-guardrails">
            <h3>Guardrails</h3>
            <p className="sub">Prevent recurrence</p>
            {uniqueGuardrails(focusBundle.sever.permissionSteps.map((step) => step.action)).slice(0, 3).map((item) => (
              <div className="bio-guardrail-row" key={item.control}>
                <span>{item.control}</span>
                <em>{item.label}</em>
                <p>{item.note}</p>
              </div>
            ))}
          </div>

          <div className="bio-handoff">
            <h3>Penumbra handoff</h3>
            <p className="sub">path.opened · schema v1 · {signature?.hops ?? 0} hops</p>
            <button type="button" className="bio-btn" onClick={copyAlert}>
              {handoffCopied ? "Copied" : "Copy alert JSON"}
            </button>
          </div>


        </aside>
      </div>

      <div className="bio-notes">
        <div>
          <p className="bio-eyebrow"><b>Notes</b> / limits</p>
          <h2>Questions the <em>map raises.</em></h2>
          <p>Short answers, in the same order as the page: what is read, how a route is found, and what the cut costs.</p>
        </div>
        <div className="bio-faq">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary><span>{item.q}</span><b>+</b></summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <footer className="bio-footer">
        <span><b>Apsis</b> / living account survey</span>
        <span>{index.engine.name} {index.engine.version} / {index.totals.fixtures} fixtures / MIT code · design reserved</span>
        <span>Designed and built by Meruyert Oshayeva</span>
      </footer>
    </section>
  );
}
