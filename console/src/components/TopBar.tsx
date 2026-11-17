import { ApsisMark } from "./ApsisMark";
import { SECTIONS, scrollToSection } from "../lib/useSection";

interface Props {
  current: string;
  focusTitle: string;
  onFocus: () => void;
  onPalette: () => void;
}

export function TopBar({ current, focusTitle, onFocus, onPalette }: Props) {
  return (
    <header className="bio-topbar">
      <button
        type="button"
        className="bio-brand"
        onClick={() => scrollToSection("signal")}
        aria-label="Apsis, back to the top"
      >
        Apsis
        <ApsisMark size={17} />
      </button>

      <nav className="bio-acts" aria-label="Acts">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className="bio-actlink"
            aria-current={current === section.id ? "true" : undefined}
            onClick={() => scrollToSection(section.id)}
          >
            {section.index} {section.label}
          </button>
        ))}
      </nav>

      <div className="bio-topright">
        <button type="button" className="bio-focuschip" onClick={onFocus}>
          focus <b>{focusTitle}</b>
        </button>
        <button
          type="button"
          className="bio-kbd"
          onClick={onPalette}
          aria-label="Open the command palette"
        >
          ⌘K
        </button>
        <span className="bio-readonly">
          <i /> <span>read-only</span>
        </span>
      </div>
    </header>
  );
}
