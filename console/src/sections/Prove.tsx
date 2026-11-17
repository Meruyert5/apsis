import { useEffect, useMemo, useState } from "react";
import { ActHeader } from "../components/ActHeader";
import rawCommands from "../data/commands.json";
import { bundles, index, totals } from "../lib/data";
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record.command);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const lines = record.output.split("\n");

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
          <span className="glow" /><span className="swirl" /><span className="rays" />
          <span className="core" /><span className="ring" />
        </div>

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
            <div className="bio-output" tabIndex={0} role="region" aria-label="Recorded output">
              {lines.map((line, lineIndex) => {
                const tone = line.startsWith("Account closed") ? "ok"
                  : line.startsWith("apsis: clean") ? "ok"
                    : line.includes("->") ? "path"
                      : line.trimStart().startsWith("arn:aws:iam") ? "arn"
                        : /^\s{2,}\w+\s+.*allows/.test(line) ? "grant"
                          : undefined;
                return <span key={lineIndex} className={`bio-line${tone ? ` ${tone}` : ""}`}>{line || " "}</span>;
              })}
            </div>
          </div>
          <div className="bio-termfoot">
            <span><b>{lines.length}</b> lines</span>
            <span><b>{FORMAT_LABEL[record.format]}</b> output</span>
            <span>recorded <b>{rawCommands.generated.slice(0, 10)}</b></span>
            <em>{record.key}</em>
          </div>
        </article>

        <aside className="bio-closure" aria-label="Closure">
          <p className="bio-zero" aria-label="0 routes remain">0</p>
          <p className="bio-zerolabel"><i /> routes remain</p>
          <p className="bio-zerofine">verified at the cut</p>
          <div className="bio-count">
            <b>{totals.routes}</b><span>→</span><b>0</b>
            <span className="linebar" />
            <span>routes</span>
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

          <div className="bio-diver" aria-hidden="true">
            <svg viewBox="0 0 170 210" fill="none" stroke="#bfffe9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="86" cy="46" r="24" />
              <path d="M70 42 Q86 33 102 42" stroke="rgba(214,255,242,.75)" />
              <rect x="70" y="70" width="32" height="44" rx="10" />
              <rect x="52" y="70" width="14" height="34" rx="5" />
              <path d="M70 82 L50 102 L54 124" />
              <path d="M102 82 L122 102 L118 124" />
              <path d="M76 114 L72 146 L54 164 L76 154" />
              <path d="M96 114 L100 146 L118 164 L96 154" />
              <path d="M86 22 L86 34" />
              <circle cx="86" cy="16" r="2.5" fill="#bfffe9" />
              <circle cx="104" cy="46" r="3.5" fill="#ffd27a" stroke="none" />
              <path d="M52 78 Q28 94 8 82" stroke="rgba(191,255,233,.35)" strokeDasharray="3 6" />
              <path d="M60 140 Q30 176 0 154" stroke="rgba(191,255,233,.32)" strokeDasharray="3 6" />
            </svg>
            <p>DIVE-01<br />read-only</p>
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
