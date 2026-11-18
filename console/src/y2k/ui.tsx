import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import { Figure3D, type FigureMode, type FigureVariant } from "./Figure3D";

export type IconName =
  | "overview"
  | "survey"
  | "path"
  | "atlas"
  | "drift"
  | "commands"
  | "extensions"
  | "blueprint"
  | "search"
  | "menu"
  | "close"
  | "arrow"
  | "play"
  | "pause"
  | "step"
  | "reset"
  | "cut"
  | "copy"
  | "check"
  | "motion"
  | "expand"
  | "collapse"
  | "star"
  | "shield"
  | "chevron";

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" />
          <rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" />
        </svg>
      );
    case "survey":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="3" />
          <path d="M8 8 12.5 3.5" /><circle cx="12.5" cy="3.5" r="1" fill="currentColor" />
        </svg>
      );
    case "path":
      return (
        <svg {...common}>
          <path d="M2 13h3v-3h3V7h3V4h3" />
          <circle cx="2" cy="13" r="1" fill="currentColor" /><circle cx="14" cy="4" r="1" fill="currentColor" />
        </svg>
      );
    case "atlas":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" /><ellipse cx="8" cy="8" rx="6" ry="2.4" />
          <ellipse cx="8" cy="8" rx="2.4" ry="6" />
        </svg>
      );
    case "drift":
      return (
        <svg {...common}>
          <rect x="2" y="3" width="4.5" height="10" /><rect x="9.5" y="3" width="4.5" height="10" />
          <path d="M6.5 5h3M6.5 8h3M6.5 11h3" />
        </svg>
      );
    case "commands":
      return (
        <svg {...common}>
          <rect x="2" y="3" width="12" height="10" />
          <path d="m5 6 2 2-2 2M9 10h2" />
        </svg>
      );
    case "extensions":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" />
          <rect x="2" y="9" width="5" height="5" />
          <path d="M11.5 9v4M9.5 11h4" />
        </svg>
      );
    case "blueprint":
      return (
        <svg {...common}>
          <path d="m8 2 5 3-5 3-5-3z" /><path d="m3 8 5 3 5-3" /><path d="m3 11 5 3 5-3" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="4.4" /><path d="m10.4 10.4 3 3" />
        </svg>
      );
    case "menu":
      return <svg {...common}><path d="M2 4h12M2 8h12M2 12h12" /></svg>;
    case "close":
      return <svg {...common}><path d="m3 3 10 10M13 3 3 13" /></svg>;
    case "arrow":
      return <svg {...common}><path d="M2 8h11" /><path d="m9 4 4 4-4 4" /></svg>;
    case "play":
      return <svg {...common}><path d="m5 3 8 5-8 5z" fill="currentColor" /></svg>;
    case "pause":
      return <svg {...common}><path d="M5 3v10M11 3v10" strokeWidth="2" /></svg>;
    case "step":
      return <svg {...common}><path d="m4 3 6 5-6 5z" fill="currentColor" /><path d="M12 3v10" /></svg>;
    case "reset":
      return <svg {...common}><path d="M3 7a5 5 0 1 1 1.6 5.2" /><path d="M3 3v4h4" /></svg>;
    case "cut":
      return <svg {...common}><circle cx="4" cy="4" r="2" /><circle cx="4" cy="12" r="2" /><path d="m5.5 5.5 8 5M5.5 10.5l8-5" /></svg>;
    case "copy":
      return <svg {...common}><rect x="5" y="5" width="8" height="8" /><path d="M3 10V3h7" /></svg>;
    case "check":
      return <svg {...common}><path d="m2.5 8 3.5 3.5 7.5-8" /></svg>;
    case "motion":
      return <svg {...common}><path d="M2 10c2-6 4 4 6-2s4-2 6-4" /><circle cx="2" cy="10" r="1" fill="currentColor" /></svg>;
    case "expand":
      return <svg {...common}><path d="M6 2H2v4M10 2h4v4M2 10v4h4M14 10v4h-4" /></svg>;
    case "collapse":
      return <svg {...common}><path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" /></svg>;
    case "shield":
      return (
        <svg {...common}>
          <path d="M8 1.8 13 4v4.2c0 3-2.1 5-5 6-2.9-1-5-3-5-6V4z" />
          <path d="m5.8 8 1.6 1.6 3-3.2" />
        </svg>
      );
    case "star":
      return <svg {...common}><path d="M8 1.5 9.5 6.5 14.5 8 9.5 9.5 8 14.5 6.5 9.5 1.5 8 6.5 6.5z" fill="currentColor" stroke="none" /></svg>;
    default:
      return <svg {...common}><path d="m5 3 5 5-5 5" /></svg>;
  }
}

export function Count({ value, motion }: { value: number; motion: boolean }) {
  const [display, setDisplay] = useState(motion ? 0 : value);

  useEffect(() => {
    if (!motion) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 720;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, motion]);

  if (value === 0) return <>0</>;
  return <>{String(Math.round(display)).padStart(2, "0")}</>;
}

export function Panel({
  title,
  meta,
  actions,
  children,
  className = "",
  glow = false,
}: {
  title: string;
  meta?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section className={`panel ${glow ? "is-glow" : ""} ${className}`.trim()}>
      <header className="panel-head">
        <h2>{title}</h2>
        {meta ? <span className="panel-meta">{meta}</span> : null}
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function FigurePanel({
  variant,
  index,
  title,
  meta,
  tags,
  note,
  foot,
  motion,
  active,
  count,
  cut,
  focus,
  onPick,
  badge = false,
  className = "",
}: {
  variant: FigureVariant;
  index: string;
  title: string;
  meta: string;
  tags?: string[];
  note?: string;
  foot?: string;
  motion: boolean;
  active?: number;
  count?: number;
  cut?: boolean;
  focus?: number;
  onPick?: (index: number) => void;
  badge?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<FigureMode>(() => {
    try {
      return localStorage.getItem("apsis.figure-mode") === "wireframe" ? "wireframe" : "planets";
    } catch {
      return "planets";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("apsis.figure-mode", mode);
    } catch {
      /* private mode: the preference simply does not persist */
    }
  }, [mode]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  return (
    <section className={`figure-panel ${expanded ? "is-expanded" : ""} ${className}`.trim()}>
      <header className="figure-head">
        <span className="figure-index">{index}</span>
        <div>
          <h2>{title}</h2>
          <p>{meta}</p>
        </div>
        <span className="figure-status">
          <span className={`auto-badge ${motion ? "is-on" : ""}`}>
            <i />{motion ? "Auto" : "Paused"}
          </span>
          <span className="live"><i />Live</span>
          <button
            type="button"
            className="figure-expand"
            aria-pressed={expanded}
            aria-label={expanded ? "Collapse figure" : "Expand figure"}
            title={expanded ? "Collapse figure" : "Expand figure"}
            onClick={() => setExpanded((value) => !value)}
          >
            <Icon name={expanded ? "collapse" : "expand"} size={14} />
          </button>
        </span>
      </header>
      <div className="figure-stage">
        <Figure3D
          variant={variant}
          mode={mode}
          onMode={setMode}
          motion={motion}
          active={active}
          count={count}
          cut={cut}
          focus={focus}
          onPick={onPick}
          label={`${title} — ${meta}`}
        />
        {badge ? <CircularBadge /> : null}
        <div className="figure-tags">
          {(tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </div>
      <footer className="figure-foot">
        <span>{note ?? "Drag / scroll / double-click reset"}</span>
        {foot ? <span>{foot}</span> : null}
      </footer>
    </section>
  );
}

export function CircularBadge({ id = "badge" }: { id?: string }) {
  const pathId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg className="circular-badge" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(255,255,255,.45)" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#2b3cff" strokeWidth="1" strokeDasharray="3 6" />
      <g className="badge-ring">
        <defs>
          <path id={`${id}-${pathId}`} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        <text>
          <textPath href={`#${id}-${pathId}`} startOffset="0">
            EVERY ROUTE REACHES ITS APSIS / READ-ONLY / 16 ACCOUNTS / 07 HOPS /
          </textPath>
        </text>
      </g>
      <path className="badge-star" d="M100 46 L104 96 L154 100 L104 104 L100 154 L96 104 L46 100 L96 96 Z" />
      <text className="badge-word" x="100" y="105" textAnchor="middle">APSIS</text>
    </svg>
  );
}

export function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button type="button" className={`chip ${active ? "is-active" : ""}`} aria-pressed={active} onClick={onClick}>
      {children}
      {typeof count === "number" ? <em>{count}</em> : null}
    </button>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={value === item.id ? "is-active" : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {typeof item.count === "number" ? <em>{item.count}</em> : null}
        </button>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  center,
}: {
  segments: { label: string; value: number; color: string }[];
  center: ReactNode;
}) {
  const total = Math.max(1, segments.reduce((sum, segment) => sum + segment.value, 0));
  const circumference = 2 * Math.PI * 44;
  let offset = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="11" />
        {segments.map((segment) => {
          const length = (segment.value / total) * circumference;
          const dash = `${Math.max(0, length - 2)} ${circumference - Math.max(0, length - 2)}`;
          const item = (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke={segment.color}
              strokeWidth="11"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += length;
          return item;
        })}
      </svg>
      <div className="donut-center">{center}</div>
    </div>
  );
}

export function Barcode({ vertical = false }: { vertical?: boolean }) {
  return <span className={`barcode ${vertical ? "vertical" : ""}`} aria-hidden="true" />;
}
