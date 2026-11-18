import { useEffect, useRef, useState } from "react";
import { BackgroundFX } from "./BackgroundFX";
import { CommandPalette } from "./CommandPalette";
import {
  commands,
  modules,
  snapshot,
  techniqueRows,
  generatedLabel,
} from "./model";
import type { ViewId } from "./model";
import { Atlas } from "./views/Atlas";
import { Blueprint } from "./views/Blueprint";
import { Commands } from "./views/Commands";
import { Extensions } from "./views/Extensions";
import { Overview } from "./views/Overview";
import { PathMap } from "./views/PathMap";
import { Survey } from "./views/Survey";
import { Barcode, Chevrons, Icon } from "./ui";
import type { IconName } from "./ui";

const VIEW_IDS = new Set(modules.map((module) => module.id));

function readView(): ViewId {
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return VIEW_IDS.has(raw) ? (raw as ViewId) : "overview";
}

export function App() {
  const [view, setView] = useState<ViewId>(readView);
  const [account, setAccount] = useState("games-studio");
  const [commandKey, setCommandKey] = useState(commands[0]?.key ?? "");
  const [techniqueId, setTechniqueId] = useState(techniqueRows[0]?.id ?? "");
  const [motion, setMotion] = useState(() => {
    try {
      const stored = window.localStorage.getItem("apsis-motion");
      if (stored === "off") return false;
      if (stored === "on") return true;
    } catch {
      /* local storage can be unavailable */
    }
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [rail, setRail] = useState(false);
  const [palette, setPalette] = useState(false);
  const [note, setNote] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onHash = () => setView(readView());
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
    };
  }, []);

  useEffect(() => {
    const current = modules.find((module) => module.id === view);
    document.title = `Apsis — ${current?.label ?? "Console"}`;
  }, [view]);

  useEffect(() => {
    try {
      window.localStorage.setItem("apsis-motion", motion ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, [motion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((value) => !value);
      }
      if (event.key === "Escape") {
        setPalette(false);
        setRail(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const notify = (message: string) => {
    setNote(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNote(""), 2400);
  };

  const navigate = (next: ViewId) => {
    setView(next);
    setRail(false);
    if (window.location.hash !== `#/${next}`) {
      window.history.pushState(null, "", `#/${next}`);
    }
    window.scrollTo(0, 0);
  };

  const pickAccount = (key: string) => {
    setAccount(key);
    navigate("path");
  };

  const current = modules.find((module) => module.id === view) ?? modules[0];

  return (
    <div className={`app ${motion ? "" : "motion-off"}`}>
      <BackgroundFX motion={motion} />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-aurora" aria-hidden="true" />
      <div className="screen-edge" aria-hidden="true">
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      </div>

      <a className="skip" href="#main">Skip to dashboard</a>

      <aside className={`rail ${rail ? "is-open" : ""}`} aria-label="Primary">
        <div className="rail-head">
          <div className="brand">
            <b>APSIS</b>
            <span>Path + Atlas</span>
          </div>
          <button type="button" className="rail-close" onClick={() => setRail(false)} aria-label="Close navigation">
            <Icon name="close" />
          </button>
        </div>

        <nav className="rail-nav">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              className={module.id === view ? "is-active" : undefined}
              aria-current={module.id === view ? "page" : undefined}
              onClick={() => navigate(module.id as ViewId)}
            >
              <span>{module.index}</span>
              <Icon name={module.id as IconName} size={16} />
              <b>{module.label}</b>
            </button>
          ))}
        </nav>

        <div className="rail-note">
          <span>Snapshot</span>
          <b>{generatedLabel}</b>
          <p>Read-only. The console never writes to an account.</p>
        </div>

        <div className="rail-foot">
          <Barcode />
          <div className="rail-foot-row">
            <Chevrons />
            <Icon name="star" size={14} />
          </div>
          <div className="status"><i />Read-only / 0 writes</div>
          <p>{snapshot.accounts} accounts / {snapshot.identities} identities</p>
        </div>
      </aside>

      {rail ? (
        <button type="button" className="rail-scrim" onClick={() => setRail(false)} aria-label="Close navigation overlay" />
      ) : null}

      <div className="app-main">
        <header className="topbar">
          <div className="crumb">
            <button type="button" className="rail-toggle" onClick={() => setRail(true)} aria-label="Open navigation">
              <Icon name="menu" />
            </button>
            <b>APSIS</b>
            <span>/</span>
            <span>{current.label}</span>
          </div>

          <button type="button" className="search-launch" onClick={() => setPalette(true)}>
            <Icon name="search" size={15} />
            <span>Search or jump…</span>
            <kbd>⌘K</kbd>
          </button>

          <div className="top-actions">
            <button
              type="button"
              className={`motion-toggle ${motion ? "is-on" : ""}`}
              aria-pressed={motion}
              aria-label={motion ? "Pause motion" : "Enable motion"}
              onClick={() => {
                const next = !motion;
                setMotion(next);
                notify(next ? "Motion on" : "Motion paused");
              }}
            >
              <i />
              <span>Motion</span>
            </button>
            <span className="snapshot"><i />Snapshot</span>
            <span className="avatar" aria-hidden="true">MO</span>
          </div>
        </header>

        <main id="main" key={view} className="view-wrap">
          {view === "overview" ? <Overview navigate={navigate} pickAccount={pickAccount} motion={motion} /> : null}
          {view === "survey" ? <Survey navigate={navigate} pickAccount={pickAccount} motion={motion} notify={notify} /> : null}
          {view === "path" ? (
            <PathMap
              account={account}
              setAccount={setAccount}
              motion={motion}
              notify={notify}
              navigate={navigate}
            />
          ) : null}
          {view === "atlas" ? <Atlas account={account} setAccount={setAccount} motion={motion} navigate={navigate} /> : null}
          {view === "commands" ? (
            <Commands
              commandKey={commandKey}
              setCommandKey={setCommandKey}
              motion={motion}
              notify={notify}
            />
          ) : null}
          {view === "extensions" ? (
            <Extensions
              techniqueId={techniqueId}
              setTechniqueId={setTechniqueId}
              motion={motion}
              notify={notify}
              navigate={navigate}
              setAccount={setAccount}
            />
          ) : null}
          {view === "blueprint" ? <Blueprint navigate={navigate} motion={motion} /> : null}
        </main>

        <footer className="app-foot">
          <span>APSIS / PATH + ATLAS / 2026</span>
          <span>{snapshot.accounts} accounts · {snapshot.identities} identities · {snapshot.routes} routes · {snapshot.cut} edges</span>
          <span>Read-only / 0 writes</span>
        </footer>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        navigate={(next) => navigate(next as ViewId)}
        setAccount={setAccount}
        setCommandKey={setCommandKey}
        setTechniqueId={setTechniqueId}
      />

      <div className={`toast ${note ? "show" : ""}`} role="status" aria-live="polite">{note}</div>
    </div>
  );
}
