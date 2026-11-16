import { useEffect, useState } from "react";
import { SECTIONS, scrollToSection, type SectionId } from "../lib/useSection";
import { MOTION_CHANGE } from "../lib/motion";
import { ApsisMark } from "./ApsisMark";

export function Masthead({ current }: { current: SectionId }) {
  const [motion, setMotion] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const on = window.localStorage.getItem("apsis-motion") !== "off";
    setMotion(on);
    document.documentElement.dataset.motion = on ? "on" : "off";
    window.dispatchEvent(new Event(MOTION_CHANGE));
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const toggleMotion = () => {
    const next = !motion;
    setMotion(next);
    document.documentElement.dataset.motion = next ? "on" : "off";
    window.localStorage.setItem("apsis-motion", next ? "on" : "off");
    window.dispatchEvent(new Event(MOTION_CHANGE));
  };

  const position = SECTIONS.findIndex((section) => section.id === current);

  return (
    <header className="mast" role="banner">
      <a
        className="mast__mark"
        href="#start"
        onClick={(event) => {
          event.preventDefault();
          scrollToSection("start");
        }}
      >
        <span className="mast__word">Apsis</span>
        <span className="mast__glyph">
          <ApsisMark size={22} />
        </span>
      </a>

      <span className="mast__issue">Orbital security / 01</span>

      <nav className="mast__nav" aria-label="Sections">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className="mast__link"
            data-section={section.id}
            aria-current={current === section.id ? "true" : undefined}
            onClick={() => scrollToSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div className="mast__tools">
        <span className="mast__status">Read-only</span>
        <button
          type="button"
          className="mast__toggle"
          aria-pressed={motion}
          aria-label={motion ? "Turn motion off" : "Turn motion on"}
          onClick={toggleMotion}
        >
          <span className="mast__motionDot" data-on={motion} aria-hidden="true" />
          <span>Motion {motion ? "on" : "off"}</span>
        </button>
        <p className="mast__step" aria-hidden="true">
          {String(position + 1).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}
        </p>
      </div>

      <span
        className="mast__progress"
        style={{ transform: `scaleX(${progress.toFixed(3)})` }}
        aria-hidden="true"
      />
    </header>
  );
}
