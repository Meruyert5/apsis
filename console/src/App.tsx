import { Masthead } from "./components/Masthead";
import { Cosmos } from "./components/Cosmos";
import { Hero } from "./sections/Hero";
import { Survey } from "./sections/Survey";
import { Atlas } from "./sections/Atlas";
import { Commands } from "./sections/Commands";
import { Close } from "./sections/Close";
import { useSection } from "./lib/useSection";

export default function App() {
  const current = useSection();

  return (
    <>
      <Cosmos />
      <Masthead current={current} />
      <main id="main">
        <Hero />
        <Survey />
        <Atlas />
        <Commands />
        <Close />
      </main>
    </>
  );
}
