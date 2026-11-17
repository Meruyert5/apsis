import { useEffect, useMemo, useRef, useState } from "react";
import { bundles, techniques } from "../lib/data";
import { SECTIONS, scrollToSection } from "../lib/useSection";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Row =
  | { kind: "act"; id: string; label: string; hint: string }
  | { kind: "account"; id: string; label: string; hint: string }
  | { kind: "technique"; id: string; label: string; hint: string };

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previous = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement as HTMLElement | null;
    setQuery("");
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      previous.current?.focus?.();
    };
  }, [open, onClose]);

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    const all: Row[] = [
      ...SECTIONS.map((section) => ({
        kind: "act" as const,
        id: section.id,
        label: `${section.index} ${section.label}`,
        hint: "Act",
      })),
      ...bundles.map((entry) => ({
        kind: "account" as const,
        id: entry.key,
        label: entry.bundle.scenario.title,
        hint: `${entry.bundle.stats.routes} routes`,
      })),
      ...techniques.map((tech) => ({
        kind: "technique" as const,
        id: tech.id,
        label: tech.name,
        hint: `${tech.category} · ${tech.mitre}`,
      })),
    ];
    if (!q) return all;
    return all.filter((row) => row.label.toLowerCase().includes(q) || row.id.includes(q));
  }, [query]);

  useEffect(() => {
    if (active >= rows.length) setActive(0);
  }, [rows.length, active]);

  if (!open) return null;

  const run = (row: Row) => {
    if (row.kind === "act") {
      scrollToSection(row.id);
    } else if (row.kind === "account") {
      window.dispatchEvent(new CustomEvent("apsis:focus", { detail: row.id }));
      scrollToSection("map");
    } else {
      window.dispatchEvent(new CustomEvent("apsis:technique", { detail: row.id }));
      scrollToSection("decide");
    }
    onClose();
  };

  return (
    <div className="bio-palette-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="bio-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search an account, a technique or an act"
          aria-label="Search"
          onChange={(event) => { setQuery(event.target.value); setActive(0); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => Math.min(rows.length - 1, value + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(0, value - 1));
            } else if (event.key === "Enter" && rows[active]) {
              run(rows[active]);
            }
          }}
        />
        <div className="bio-palette-list" role="listbox" aria-label="Results">
          {rows.map((row, index) => (
            <button
              key={`${row.kind}-${row.id}`}
              type="button"
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => run(row)}
            >
              <span>{row.label}</span>
              <em>{row.hint}</em>
            </button>
          ))}
          {rows.length === 0 ? <p>No account, technique or act matches.</p> : null}
        </div>
        <footer><span>↑↓ move · Enter open · Esc close</span><span>{rows.length} results</span></footer>
      </div>
    </div>
  );
}
