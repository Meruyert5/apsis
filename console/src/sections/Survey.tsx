import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scissors,
  ShieldCheck,
} from "lucide-react";
import { bundles, byKey } from "../lib/data";
import { indexGraph, principalRoutes } from "../lib/graph";
import { motionAllowed, MOTION_CHANGE } from "../lib/motion";
import { Constellation, type ConstellationHandle } from "../components/Constellation";
import { SurveyAside } from "./survey/SurveyAside";

const FEATURED = "games-studio";
const EMPTY = new Set<string>();

function firstPick(key: string): string | null {
  const bundle = byKey.get(key);
  if (!bundle) return null;
  return bundle.signature?.nodes[0] ?? bundle.nodes.find((node) => !node.admin)?.id ?? null;
}

export function Survey() {
  const [key, setKey] = useState(FEATURED);
  const bundle = byKey.get(key) ?? byKey.get(FEATURED)!;
  const [selected, setSelected] = useState<string | null>(() => firstPick(FEATURED));
  const [cutOn, setCutOn] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const controls = useRef<ConstellationHandle | null>(null);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    const map = mapRef.current;
    if (!map) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void map.requestFullscreen?.();
  }

  const index = useMemo(() => indexGraph(bundle), [bundle]);
  const cut = useMemo(
    () => (cutOn ? new Set(bundle.sever.edgeCut.edges) : EMPTY),
    [bundle, cutOn],
  );
  const rows = useMemo(() => principalRoutes(index, cut), [index, cut]);
  const row = selected ? rows.find((item) => item.id === selected) ?? null : null;
  const hops = row?.route.hops ?? 0;
  const litHop = hops === 0 ? -1 : step === null ? hops - 1 : Math.min(step, hops - 1);

  const activeNodes = useMemo(() => {
    if (cutOn) return new Set<string>();
    if (!row) return new Set(selected ? [selected] : []);
    return new Set(row.route.nodes.slice(0, litHop + 2));
  }, [row, selected, cutOn, litHop]);

  const activeEdges = useMemo(
    () =>
      cutOn || !row
        ? EMPTY
        : new Set(row.route.edges.slice(0, litHop + 1).map((edge) => edge.id)),
    [row, cutOn, litHop],
  );

  const cutEdges = useMemo(
    () => (cutOn ? new Set(bundle.sever.edgeCut.edges) : EMPTY),
    [bundle, cutOn],
  );

  const severable = bundle.sever.edgeCut.edges.length > 0;

  useEffect(() => {
    const stopForMotion = () => {
      if (!motionAllowed()) setPlaying(false);
    };
    window.addEventListener(MOTION_CHANGE, stopForMotion);
    return () => window.removeEventListener(MOTION_CHANGE, stopForMotion);
  }, []);

  useEffect(() => {
    if (!playing || !row) return;
    if (!motionAllowed()) {
      setStep(row.route.hops - 1);
      setPlaying(false);
      return;
    }
    if (step === null) {
      setStep(0);
      return;
    }
    if (step >= row.route.hops - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setStep((value) => Math.min((value ?? 0) + 1, row.route.hops - 1)),
      820,
    );
    return () => window.clearTimeout(timer);
  }, [playing, step, row]);

  function chooseAccount(next: string) {
    setKey(next);
    setCutOn(false);
    setSelected(firstPick(next));
    setStep(null);
    setPlaying(false);
  }

  function choose(id: string) {
    if (cutOn) return;
    setSelected(id);
    setStep(null);
    setPlaying(false);
  }

  function pickStep(next: number) {
    setPlaying(false);
    setStep(next);
  }

  function togglePlay() {
    if (!row) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (!motionAllowed()) {
      setStep(row.route.hops - 1);
      return;
    }
    if (step === null || step >= row.route.hops - 1) setStep(0);
    setPlaying(true);
  }

  const status = cutOn
    ? `Account closed. ${bundle.sever.edgeCut.edges.length} grants removed. No route to an administrator remains.`
    : `${rows.length} principal${rows.length === 1 ? "" : "s"} can reach an administrator in ${bundle.scenario.title}.`;

  return (
    <section className="survey" id="survey" aria-labelledby="survey-title">
      <div className="survey__bar">
        <div className="survey__scenario">
          <span className="survey__sev" data-sev={bundle.scenario.severity} aria-hidden="true" />
          <div>
            <p className="survey__scenarioName">{bundle.scenario.title}</p>
            <p className="survey__scenarioMeta data">
              {bundle.scenario.accountId} / {bundle.scenario.region}
            </p>
          </div>
        </div>

        <label className="survey__picker">
          <span className="survey__pickerLabel">Account</span>
          <span className="survey__select">
            <select
              value={key}
              onChange={(event) => chooseAccount(event.target.value)}
              aria-label="Switch account"
            >
              {bundles.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.bundle.scenario.title}
                </option>
              ))}
            </select>
            <ChevronDown size={15} strokeWidth={2} aria-hidden />
          </span>
        </label>

        <button
          type="button"
          className="survey__sever"
          aria-pressed={cutOn}
          disabled={!severable}
          title={severable ? undefined : "This account has no routes to sever"}
          onClick={() => {
            setCutOn((value) => !value);
            setStep(null);
            setPlaying(false);
          }}
        >
          {cutOn ? (
            <ShieldCheck size={16} strokeWidth={2} aria-hidden />
          ) : (
            <Scissors size={16} strokeWidth={2} aria-hidden />
          )}
          <span>{cutOn ? "Restore routes" : "Sever minimum cut"}</span>
        </button>

        <p className="survey__live sr-only" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="survey__body">
        <div className="survey__map" data-cut={cutOn ? "true" : undefined} ref={mapRef}>
          <Constellation
            key={bundle.scenario.name}
            bundle={bundle}
            activeNodes={activeNodes}
            activeEdges={activeEdges}
            cutEdges={cutEdges}
            selected={selected}
            onSelect={choose}
            variant="survey"
            controls={controls}
          />

          <span className="survey__frame" aria-hidden="true" />
          <span className="survey__sweep" aria-hidden="true" />

          <header className="survey__head">
            <p className="kicker">02 / Orbital survey</p>
            <h2 id="survey-title" aria-label="The account, in orbit.">
              The account,
              <br />
              <span className="accent-text">in orbit.</span>
            </h2>
            <p className="survey__lede">
              The administrator is the sun. Every identity is a planet on the orbit its hops
              allow. Drag to orbit, zoom to read the system, lift a planet to pull its grants with
              it — then sever the minimum cut and watch the system go dark.
            </p>
          </header>

          <div className="survey__hud" aria-hidden="true">
            <p className="survey__hudLabel">Live transits</p>
            <div className="survey__hudRow">
              <p className="survey__hudValue">
                {cutOn ? "00" : String(rows.length).padStart(2, "0")}
                <span> / {String(bundle.stats.sources).padStart(2, "0")}</span>
              </p>
              <dl className="survey__hudGrid">
                <div>
                  <dt>Walk</dt>
                  <dd>{row && !cutOn ? `${String(hops).padStart(2, "0")} hops` : "—"}</dd>
                </div>
                <div>
                  <dt>Cut</dt>
                  <dd data-off={cutOn ? undefined : "true"}>
                    {cutOn ? `${bundle.sever.edgeCut.edges.length} grants` : "armed"}
                  </dd>
                </div>
              </dl>
            </div>
            <span className="survey__hudBar">
              <span
                style={{
                  width: `${bundle.stats.sources === 0 ? 0 : ((cutOn ? 0 : rows.length) / bundle.stats.sources) * 100}%`,
                }}
              />
            </span>
          </div>

          <div className="survey__tip">
            <span className="survey__tipMark" aria-hidden="true" />
            <span className="survey__tipOrbit">
              Drag / hover / lift · ⌥ scroll to zoom
            </span>
            <button
              type="button"
              className="survey__reset"
              onClick={() => controls.current?.resetView()}
            >
              Reset view
            </button>
          </div>

          <div className="survey__controls" role="group" aria-label="Apsis view controls">
            <button
              type="button"
              className="survey__control"
              aria-label="Zoom in"
              title="Zoom in"
              onClick={() => controls.current?.zoomBy(0.86)}
            >
              <Plus size={17} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              className="survey__control"
              aria-label="Zoom out"
              title="Zoom out"
              onClick={() => controls.current?.zoomBy(1.16)}
            >
              <Minus size={17} strokeWidth={2} aria-hidden />
            </button>
            <span className="survey__controlRule" aria-hidden="true" />
            <button
              type="button"
              className="survey__control"
              aria-label="Reset the view"
              title="Reset the view"
              onClick={() => controls.current?.resetView()}
            >
              <RotateCcw size={16} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              className="survey__control"
              aria-label={fullscreen ? "Exit full screen" : "View the system full screen"}
              title={fullscreen ? "Exit full screen" : "Full screen"}
              onClick={toggleFullscreen}
            >
              {fullscreen ? (
                <Minimize2 size={16} strokeWidth={2} aria-hidden />
              ) : (
                <Maximize2 size={16} strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>

          {cutOn ? (
            <div className="survey__stamp" aria-hidden="true">
              <span className="survey__stampInner">
                <span className="survey__stampTop">Account closed</span>
                <span className="survey__stampDial">
                  <span className="survey__stampCore" aria-hidden="true" />
                  <span className="survey__stampBig">0</span>
                  <span className="survey__stampOrbit" aria-hidden="true" />
                </span>
                <span className="survey__stampBottom">routes remain</span>
                <span className="survey__stampFine">verified against the cut</span>
              </span>
            </div>
          ) : null}

          {!cutOn && row ? (
            <div className="hoprail">
              <ul className="hoprail__legend">
                <li>
                  <span className="hoprail__dot" data-tone="principal" aria-hidden="true" />
                  Principal
                </li>
                <li>
                  <span className="hoprail__dot" data-tone="admin" aria-hidden="true" />
                  Administrator
                </li>
                <li>
                  <span className="hoprail__dot" data-tone="live" aria-hidden="true" />
                  Live route
                </li>
              </ul>

              <div className="hoprail__walk">
                <button
                  type="button"
                  className="hoprail__play"
                  aria-pressed={playing}
                  aria-label={playing ? "Pause the walk" : "Play the walk"}
                  onClick={togglePlay}
                >
                  {playing ? (
                    <Pause size={15} strokeWidth={2.4} aria-hidden />
                  ) : (
                    <Play size={15} strokeWidth={2.4} aria-hidden />
                  )}
                </button>
                <ol className="hoprail__hops">
                  {row.route.edges.map((edge, i) => (
                    <li key={edge.id} data-past={i <= litHop ? "true" : undefined}>
                      <button
                        type="button"
                        className="hoprail__hop"
                        data-past={i < litHop ? "true" : undefined}
                        aria-current={i === litHop ? "true" : undefined}
                        aria-label={`Hop ${i + 1} of ${hops}: ${edge.name}`}
                        onClick={() => pickStep(i)}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </button>
                    </li>
                  ))}
                </ol>
                <p className="hoprail__count data" aria-hidden="true">
                  {String(Math.max(0, litHop + 1)).padStart(2, "0")} /{" "}
                  {String(hops).padStart(2, "0")}
                </p>
              </div>

              <p className="hoprail__name">{row.label}</p>
            </div>
          ) : null}
        </div>

        <aside className="survey__aside">
          <SurveyAside
            bundle={bundle}
            rows={rows}
            selected={selected}
            stepIndex={Math.max(0, litHop)}
            cutOn={cutOn}
            onSelect={choose}
            onStep={pickStep}
            onRestore={() => {
              setCutOn(false);
              setStep(null);
              setPlaying(false);
            }}
          />
        </aside>
      </div>

      <div className="survey__foot">
        <span>Fig. 02 / permission system</span>
        <span>Source: apsis export / {bundle.scenario.accountId}</span>
        <span>Binary sun / hop orbits / asteroid belt</span>
      </div>
    </section>
  );
}
