import { useEffect, useState } from "react";
import { BioSky } from "./components/BioSky";
import { TopBar } from "./components/TopBar";
import { MissionRail } from "./components/MissionRail";
import { CommandPalette } from "./components/CommandPalette";
import { Signal } from "./sections/Signal";
import { Map } from "./sections/Map";
import { Decide } from "./sections/Decide";
import { Prove } from "./sections/Prove";
import { useSection } from "./lib/useSection";
import { byKey } from "./lib/data";

export default function App() {
  const current = useSection();
  const [palette, setPalette] = useState(false);
  const [focusTitle, setFocusTitle] = useState("Games studio");
  const only = new URLSearchParams(window.location.search).get("only");

  useEffect(() => {
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    }
    const onFocus = (event: Event) => {
      const title = byKey.get((event as CustomEvent<string>).detail)?.scenario.title;
      if (title) setFocusTitle(title);
    };
    window.addEventListener("apsis:focus", onFocus);
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("apsis:focus", onFocus);
    };
  }, []);

  return (
    <>
      <BioSky />
      <TopBar
        current={current}
        focusTitle={focusTitle}
        onFocus={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        onPalette={() => setPalette(true)}
      />
      <MissionRail current={current} />
      <main id="main" className="bio-main">
        {!only || only === "signal" ? <Signal /> : null}
        {!only || only === "map" ? <Map /> : null}
        {!only || only === "decide" ? <Decide /> : null}
        {!only || only === "prove" ? <Prove /> : null}
      </main>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </>
  );
}
