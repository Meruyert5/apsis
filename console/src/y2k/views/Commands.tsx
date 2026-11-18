import { useEffect, useMemo, useRef, useState } from "react";
import type { CommandRecord } from "../../lib/types";
import {
  commands,
  commandGenerated,
  commandScenarios,
  commandVerbs,
  engineLabel,
  scenarioTitle,
} from "../model";
import { Chip, FigurePanel, Icon, Panel } from "../ui";

type VerbFilter = "all" | CommandRecord["verb"];
type FormatFilter = "all" | CommandRecord["format"];

export function Commands({
  commandKey,
  setCommandKey,
  motion,
  notify,
}: {
  commandKey: string;
  setCommandKey: (key: string) => void;
  motion: boolean;
  notify: (message: string) => void;
}) {
  const [verb, setVerb] = useState<VerbFilter>("all");
  const [scenario, setScenario] = useState("all");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [query, setQuery] = useState("");
  const [replay, setReplay] = useState(0);
  const [typed, setTyped] = useState(0);
  const preRef = useRef<HTMLPreElement>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return commands.filter((record) => {
      const verbOk = verb === "all" || record.verb === verb;
      const scenarioOk = scenario === "all" || record.scenario === scenario;
      const formatOk = format === "all" || record.format === format;
      const queryOk =
        !term ||
        `${record.command} ${record.output} ${record.verb} ${record.format}`
          .toLowerCase()
          .includes(term);
      return verbOk && scenarioOk && formatOk && queryOk;
    });
  }, [verb, scenario, format, query]);

  const current = filtered.find((record) => record.key === commandKey) ?? filtered[0] ?? commands[0];
  const text = current?.output ?? "";

  useEffect(() => {
    if (filtered.length && !filtered.some((record) => record.key === commandKey)) {
      setCommandKey(filtered[0].key);
    }
  }, [filtered, commandKey, setCommandKey]);

  useEffect(() => {
    if (!motion) {
      setTyped(text.length);
      return;
    }
    setTyped(0);
    let value = 0;
    const increment = Math.max(1, Math.ceil(text.length / 140));
    const timer = window.setInterval(() => {
      value = Math.min(text.length, value + increment);
      setTyped(value);
      if (value >= text.length) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [current?.key, replay, motion, text]);

  useEffect(() => {
    if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight;
  }, [typed]);

  const copy = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.command);
      notify("Command copied");
    } catch {
      notify("Copy blocked by the browser");
    }
  };

  const verbCount = (value: CommandRecord["verb"]) =>
    commands.filter((record) => record.verb === value).length;

  return (
    <>
      <section className="view-hero commands-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span>06</span> Commands / Recorded runs</p>
          <h1>Recorded runs. <em>Replayable.</em></h1>
          <p className="lede">
            {commands.length} captured CLI invocations, the exact arguments and the output they
            produced. Nothing executes here; the terminal is a recording, not a shell.
          </p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => setReplay((value) => value + 1)}>
              <Icon name="play" />Replay output
            </button>
            <button type="button" className="btn" onClick={copy}>
              <Icon name="copy" />Copy command
            </button>
          </div>
          <div className="meta-line">
            <span><i />Recorded {commandGenerated.slice(0, 10)}</span>
            <span>{engineLabel}</span>
            <span>{commandScenarios.length} scenarios</span>
          </div>
        </div>
        <FigurePanel
          variant="prism"
          index="FIG. 06"
          title="Command core"
          meta="Recorded output / read-only"
          tags={[`${commands.length} runs`, `${commandVerbs.length} verbs`, `${commandScenarios.length} scenarios`]}
          note="Auto: the beam reads the core"
          foot={current?.format ?? "text"}
          motion={motion}
          focus={commandVerbs.indexOf(current?.verb ?? "scan")}
        />
      </section>

      <div className="commands-layout">
        <Panel
          title="Run library"
          meta={`${filtered.length} of ${commands.length}`}
          className="command-library"
        >
          <div className="command-filters">
            <div className="field">
              <Icon name="search" size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search commands and output…"
                aria-label="Search recorded commands"
              />
            </div>
            <div className="chip-row">
              <Chip active={verb === "all"} onClick={() => setVerb("all")} count={commands.length}>all</Chip>
              {commandVerbs.map((item) => (
                <Chip key={item} active={verb === item} onClick={() => setVerb(item)} count={verbCount(item)}>
                  {item}
                </Chip>
              ))}
            </div>
            <div className="select-wrap">
              <select value={scenario} onChange={(event) => setScenario(event.target.value)} aria-label="Scenario">
                <option value="all">All scenarios</option>
                {commandScenarios.map((item) => (
                  <option key={item} value={item}>{scenarioTitle(item)}</option>
                ))}
              </select>
              <Icon name="chevron" size={13} />
            </div>
            <div className="chip-row compact">
              {(["all", "text", "json", "sarif", "mermaid"] as FormatFilter[]).map((item) => (
                <Chip key={item} active={format === item} onClick={() => setFormat(item)}>{item}</Chip>
              ))}
            </div>
          </div>

          <div className="command-list">
            {filtered.map((record) => (
              <button
                key={record.key}
                type="button"
                className={`command-item ${record.key === current?.key ? "is-active" : ""}`}
                onClick={() => {
                  setCommandKey(record.key);
                  setReplay((value) => value + 1);
                }}
              >
                <span className={`verb ${record.verb}`}>{record.verb}</span>
                <span className="command-copy">
                  <b>{record.command}</b>
                  <em>{scenarioTitle(record.scenario)} / {record.format}</em>
                </span>
              </button>
            ))}
            {filtered.length === 0 ? <p className="empty-note">No recorded run matches those filters.</p> : null}
          </div>
        </Panel>

        <div className="terminal-stack">
          <Panel
            title="Terminal"
            meta={current ? `${current.verb} / ${current.format}` : "recorded"}
            className="terminal-panel"
            actions={
              <div className="terminal-actions">
                <button type="button" onClick={() => setReplay((value) => value + 1)}><Icon name="reset" size={13} />Replay</button>
                <button type="button" onClick={copy}><Icon name="copy" size={13} />Copy</button>
              </div>
            }
          >
            {current ? (
              <>
                <div className="terminal-command">
                  <span className="prompt">PS&gt;</span>
                  <code>{current.command}</code>
                </div>
                <pre className="terminal-output" ref={preRef}>
                  {text.slice(0, typed)}
                  {typed < text.length ? <span className="cursor" aria-hidden="true" /> : null}
                </pre>
                <div className="terminal-foot">
                  <span><i />Recorded output</span>
                  <span>{engineLabel} / {current.format}</span>
                  <span>Nothing executes</span>
                </div>
              </>
            ) : (
              <p className="empty-note">Select a run.</p>
            )}
          </Panel>

          <div className="commands-lower">
            <Panel title="Verb mix" meta="recorded runs">
              <div className="verb-bars">
                {commandVerbs.map((item) => (
                  <div key={item}>
                    <span className={`verb ${item}`}>{item}</span>
                    <span className="verb-track"><i style={{ width: `${(verbCount(item) / commands.length) * 100}%` }} /></span>
                    <b>{verbCount(item)}</b>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Run notes" meta="read-only">
              <ul className="note-list">
                <li>Output is captured from the shipped fixtures with apsis 0.2.0.</li>
                <li>No AWS client runs in the console. The terminal cannot mutate an account.</li>
                <li>JSON, SARIF and Mermaid formats are included for the same run.</li>
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}

