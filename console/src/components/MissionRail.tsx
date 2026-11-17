import { useState } from "react";
import { SECTIONS, scrollToSection } from "../lib/useSection";
import { index, totals } from "../lib/data";

interface Props {
  current: string;
}

export function MissionRail({ current }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="bio-rail" data-open={open ? "true" : "false"} aria-label="Mission rail">
      <button
        type="button"
        className="bio-rail-toggle"
        aria-expanded={open}
        aria-label={open ? "Collapse the mission rail" : "Expand the mission rail"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "‹" : "›"}
      </button>

      <nav className="bio-rail-nav" aria-label="Act progress">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className="bio-rail-act"
            aria-current={current === section.id ? "true" : undefined}
            onClick={() => scrollToSection(section.id)}
          >
            <b>{section.index}</b>
            <span>{section.label}</span>
          </button>
        ))}
      </nav>

      <span className="bio-rail-progress" aria-hidden="true" />

      <div className="bio-rail-status">
        <b>{totals.accounts}</b> accounts<br />
        <b>{totals.routes}</b> routes<br />
        <b>{totals.cut}</b> edges cut<br />
        <br />
        apsis {index.engine.version}
      </div>
    </aside>
  );
}
