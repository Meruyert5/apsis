import { useEffect, useState } from "react";

export const SECTIONS = [
  { id: "start", label: "Start", index: "01" },
  { id: "survey", label: "Orbit", index: "02" },
  { id: "atlas", label: "Atlas", index: "03" },
  { id: "commands", label: "Log", index: "04" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/** The section occupying the reading position, tracked once for the whole page.
 * A scroll read (rather than an IntersectionObserver) survives the lazy
 * Commands chunk replacing its Suspense fallback with a new DOM node. */
export function useSection(): SectionId {
  const [current, setCurrent] = useState<SectionId>("start");

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.scrollY + window.innerHeight * 0.3;
      let best: SectionId = SECTIONS[0].id;
      for (const section of SECTIONS) {
        const node = document.getElementById(section.id);
        if (!node) continue;
        const top = node.getBoundingClientRect().top + window.scrollY;
        if (top <= line) best = section.id;
      }
      setCurrent((value) => (value === best ? value : best));
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const watcher = new MutationObserver(schedule);
    watcher.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      watcher.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return current;
}

export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const jump = () => target.scrollIntoView({ behavior: "instant", block: "start" });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionOff = document.documentElement.dataset.motion === "off";
  const vt = (document as Document & { startViewTransition?: (cb: () => void) => unknown })
    .startViewTransition;
  if (typeof vt === "function" && !reduced && !motionOff) {
    vt.call(document, jump);
  } else if (reduced || motionOff) {
    jump();
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
