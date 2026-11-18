import { useEffect, useMemo, useRef, useState } from "react";
import { commands, fleet, modules, scenarioTitle, techniqueRows } from "./model";
import { Icon } from "./ui";
import type { IconName } from "./ui";

type ItemKind = "view" | "account" | "command" | "technique";

interface Item {
  kind: ItemKind;
  id: string;
  label: string;
  meta: string;
  icon: IconName;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  navigate,
  setAccount,
  setCommandKey,
  setTechniqueId,
}: {
  open: boolean;
  onClose: () => void;
  navigate: (view: string) => void;
  setAccount: (key: string) => void;
  setCommandKey: (key: string) => void;
  setTechniqueId: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => [
    ...modules.map((module) => ({
      kind: "view" as const,
      id: module.id,
      label: module.label,
      meta: module.detail,
      icon: module.id as IconName,
      run: () => navigate(module.id),
    })),
    ...fleet.map((account) => ({
      kind: "account" as const,
      id: account.key,
      label: account.title,
      meta: `${account.routes} routes · ${account.identities} identities · ${account.severity}`,
      icon: "atlas" as const,
      run: () => {
        setAccount(account.key);
        navigate("path");
      },
    })),
    ...commands.map((command) => ({
      kind: "command" as const,
      id: command.key,
      label: command.command,
      meta: `${command.verb} · ${scenarioTitle(command.scenario)} · ${command.format}`,
      icon: "commands" as const,
      run: () => {
        setCommandKey(command.key);
        navigate("commands");
      },
    })),
    ...techniqueRows.map((technique) => ({
      kind: "technique" as const,
      id: technique.id,
      label: technique.name,
      meta: `${technique.category} · ${technique.mitre} · ${technique.edges} edges`,
      icon: "extensions" as const,
      run: () => {
        setTechniqueId(technique.id);
        navigate("extensions");
      },
    })),
  ], [navigate, setAccount, setCommandKey, setTechniqueId]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return [
        ...items.filter((item) => item.kind === "view"),
        ...items.filter((item) => item.kind === "account").slice(0, 6),
        ...items.filter((item) => item.kind === "technique").slice(0, 5),
        ...items.filter((item) => item.kind === "command").slice(0, 5),
      ].slice(0, 24);
    }
    return items
      .map((item) => {
        const label = item.label.toLowerCase();
        const meta = item.meta.toLowerCase();
        let score = 0;
        if (label === term) score = 100;
        else if (label.startsWith(term)) score = 80;
        else if (label.includes(term)) score = 60;
        else if (meta.includes(term)) score = 30;
        else if (item.kind.includes(term)) score = 12;
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.length - b.item.label.length)
      .slice(0, 40)
      .map((entry) => entry.item);
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelected((value) => Math.min(results.length - 1, value + 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelected((value) => Math.max(0, value - 1));
      }
      if (event.key === "Enter") {
        const item = results[selected];
        if (item) {
          event.preventDefault();
          item.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, results, selected]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="palette-wrap" role="presentation">
      <button type="button" className="palette-scrim" aria-label="Close search" onClick={onClose} />
      <section className="palette" role="dialog" aria-modal="true" aria-label="Search or jump">
        <div className="palette-search">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Jump to a view, account, command or technique…"
            aria-label="Search views, accounts, commands and techniques"
          />
          <kbd>esc</kbd>
        </div>
        <div className="palette-results" role="listbox" aria-label="Results">
          {results.map((item, index) => (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              role="option"
              aria-selected={index === selected}
              className={`palette-item ${index === selected ? "is-selected" : ""}`}
              onMouseEnter={() => setSelected(index)}
              onClick={() => {
                item.run();
                onClose();
              }}
            >
              <span className="palette-icon"><Icon name={item.icon} size={15} /></span>
              <span className="palette-copy">
                <b>{item.label}</b>
                <em>{item.meta}</em>
              </span>
              <span className="palette-kind">{item.kind}</span>
            </button>
          ))}
          {results.length === 0 ? (
            <p className="palette-empty">No match. Try a route, account or technique.</p>
          ) : null}
        </div>
        <footer className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </footer>
      </section>
    </div>
  );
}
