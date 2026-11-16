import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ListTree,
  ScanSearch,
  Scissors,
  ShieldCheck,
} from "lucide-react";
import rawCommands from "../data/commands.json";
import { bundles } from "../lib/data";
import type { CommandRecord } from "../lib/types";
import { Reveal } from "../components/Reveal";

type Verb = CommandRecord["verb"];
type Format = CommandRecord["format"];

const RECORDS = (rawCommands as { records: CommandRecord[] }).records;
const RECORD_BY_KEY = new Map(RECORDS.map((record) => [record.key, record]));

const VERBS: {
  id: Verb;
  label: string;
  blurb: string;
  icon: typeof ScanSearch;
}[] = [
  {
    id: "scan",
    label: "Scan",
    blurb:
      "Reads the account export and reports every route from a principal to an administrator, with the grant behind each hop.",
    icon: ScanSearch,
  },
  {
    id: "sever",
    label: "Sever",
    blurb:
      "Computes the minimum set of grants to remove, re-runs the graph without them, and proves the account closes.",
    icon: Scissors,
  },
  {
    id: "check",
    label: "Check",
    blurb:
      "The CI gate. Exit 0 when no identity reaches administrator; exit non-zero with the route that remains.",
    icon: ShieldCheck,
  },
  {
    id: "techniques",
    label: "Techniques",
    blurb:
      "Prints the registry of escalation primitives, each tied to MITRE ATT&CK and the IAM actions that create it.",
    icon: ListTree,
  },
];

const FORMATS: Record<Verb, Format[]> = {
  scan: ["text", "json", "sarif", "mermaid"],
  sever: ["text", "json"],
  check: ["text"],
  techniques: ["text", "json"],
};

const FORMAT_LABEL: Record<Format, string> = {
  text: "Text",
  json: "JSON",
  sarif: "SARIF",
  mermaid: "Mermaid",
};

const SCENARIOS = bundles.map((entry) => ({
  key: entry.key,
  title: entry.bundle.scenario.title,
}));

function keyFor(verb: Verb, scenario: string, format: Format): string {
  return `${verb === "techniques" ? "all" : scenario}|${verb}|${format}`;
}

export function Commands() {
  const [verb, setVerb] = useState<Verb>("scan");
  const [scenario, setScenario] = useState("games-studio");
  const [format, setFormat] = useState<Format>("text");
  const [copied, setCopied] = useState(false);

  const meta = VERBS.find((item) => item.id === verb) ?? VERBS[0];
  const record = useMemo(
    () =>
      RECORD_BY_KEY.get(keyFor(verb, scenario, format)) ??
      RECORD_BY_KEY.get(keyFor(verb, scenario, FORMATS[verb][0])) ??
      RECORDS[0],
    [verb, scenario, format],
  );

  useEffect(() => {
    if (FORMATS[verb].includes(format)) return;
    setFormat(FORMATS[verb][0]);
  }, [verb, format]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(record.command);
    } catch {
      const area = document.createElement("textarea");
      area.value = record.command;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
  }

  const lines = record.output.split("\n");
  const lineCount = lines.length;
  const scenarioTitle = SCENARIOS.find((item) => item.key === scenario)?.title ?? scenario;

  return (
    <section className="commands" id="commands" aria-labelledby="commands-title">
      <div className="shell">
        <Reveal className="commands__head">
          <div>
            <p className="kicker">04 / Mission log</p>
            <h2 id="commands-title" aria-label="The output is the evidence.">
              The output is
              <br />
              <span className="accent-text">the evidence.</span>
            </h2>
          </div>
          <div className="commands__headSide">
            <p className="commands__lede">
              Nothing here is hand-typed. Build a command, copy it, and read the exact record
              the engine printed for this fixture account.
            </p>
            <p className="commands__source">Mission log 01 / recorded from the apsis engine / {RECORDS.length} invocations</p>
          </div>
        </Reveal>

        <Reveal className="commands__body" delay={80}>
          <div className="commands__grid">
            <div className="commands__builder">
              <p className="commands__label">Verb</p>
              <div className="commands__verbs" role="group" aria-label="Choose a verb">
                {VERBS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="commands__verb"
                      aria-pressed={verb === item.id}
                      onClick={() => setVerb(item.id)}
                    >
                      <Icon size={18} strokeWidth={1.9} aria-hidden />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {verb !== "techniques" ? (
                <div className="commands__field">
                  <label className="commands__row" htmlFor="commands-scenario">
                    <span className="commands__label">Scenario</span>
                    <span className="commands__hint">{SCENARIOS.length} accounts</span>
                  </label>
                  <span className="commands__select">
                    <select
                      id="commands-scenario"
                      value={scenario}
                      onChange={(event) => setScenario(event.target.value)}
                    >
                      {SCENARIOS.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} strokeWidth={2} aria-hidden />
                  </span>
                </div>
              ) : (
                <div className="commands__field">
                  <p className="commands__row">
                    <span className="commands__label">Scope</span>
                    <span className="commands__hint">whole registry</span>
                  </p>
                  <p className="commands__scope">
                    The registry is identical across every account, so this command ignores{" "}
                    <code>--scenario</code>.
                  </p>
                </div>
              )}

              <div className="commands__field">
                <p className="commands__label">Format</p>
                <div className="commands__formats" role="group" aria-label="Choose an output format">
                  {FORMATS[verb].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="commands__format"
                      aria-pressed={format === item}
                      onClick={() => setFormat(item)}
                    >
                      {FORMAT_LABEL[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="commands__command">
                <div className="commands__commandBar">
                  <p className="commands__commandLabel">Command</p>
                  <button
                    type="button"
                    className="commands__copy"
                    data-copied={copied ? "true" : undefined}
                    onClick={copyCommand}
                  >
                    {copied ? (
                      <Check size={14} strokeWidth={2.4} aria-hidden />
                    ) : (
                      <Copy size={14} strokeWidth={2} aria-hidden />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="commands__cmd" key={record.command}>
                  <span className="commands__prompt" aria-hidden="true">
                    ${" "}
                  </span>
                  {record.command}
                  <span className="commands__caret" aria-hidden="true" />
                </p>
              </div>

              <p className="commands__blurb">{meta.blurb}</p>

              <p className="commands__copied sr-only" aria-live="polite">
                {copied ? "Command copied to the clipboard." : ""}
              </p>

              <p className="commands__builderFoot">
                <strong>Not a sample.</strong> The {lineCount} lines beside this command are the
                recorded run for this exact invocation.
              </p>
            </div>

            <figure className="terminal">
              <figcaption className="terminal__bar">
                <span className="terminal__dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="terminal__rec">
                  <span aria-hidden="true" />
                  REC
                </span>
                <span className="terminal__title">apsis 0.2.0</span>
                <span className="terminal__chip data">
                  {verb === "techniques" ? "registry" : scenarioTitle}
                </span>
              </figcaption>

              <div className="terminal__body" key={record.key} tabIndex={0} role="region" aria-label="Recorded output">
                <pre className="terminal__pre">
                  {lines.map((line, index) => {
                    const tone = line.startsWith("Account closed")
                      ? "signal"
                      : line.startsWith("apsis: clean")
                        ? "clean"
                        : line.startsWith("No identity")
                          ? "signal"
                          : line.trimStart().startsWith("arn:aws:iam")
                            ? "arn"
                            : /^\s{2,}\w+\s+.*allows/.test(line)
                              ? "grant"
                              : /\s->\s/.test(line)
                                ? "path"
                                : undefined;
                    return (
                      <span className="terminal__line" key={index} data-tone={tone}>
                        {line}
                      </span>
                    );
                  })}
                </pre>
              </div>

              <div className="terminal__foot">
                <span>
                  <strong>{lineCount}</strong> lines
                </span>
                <span>
                  <strong>{FORMAT_LABEL[record.format]}</strong> output
                </span>
                <span>
                  recorded <strong>{rawCommands.generated.slice(0, 10)}</strong>
                </span>
                <span className="terminal__receipt data">{record.key}</span>
              </div>
            </figure>
          </div>
        </Reveal>

        <div className="commands__note">
          <span className="commands__noteMark" aria-hidden="true">
            <ShieldCheck size={18} strokeWidth={2} />
          </span>
          <div>
            <p className="commands__noteTitle">Read-only by construction</p>
            <p className="commands__noteText">
              The scan exports identity and policy metadata and never writes to the account. The
              only mutations Apsis proposes are the severed grants, printed for a human to
              apply — <code>apsis check</code> is the gate that keeps them closed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
