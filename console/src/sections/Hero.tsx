import { ArrowDown, ArrowUpRight, ShieldCheck } from "lucide-react";
import { byKey, techniques, totals } from "../lib/data";
import { scrollToSection } from "../lib/useSection";
import { PlanetHero } from "../components/PlanetHero";

const FEATURED = "games-studio";

const STEPS = [
  {
    id: "ingest",
    name: "Ingest",
    value: String(totals.identities),
    unit: "identities",
    text: "Users, roles, groups and the resources that trust them, read as one system.",
  },
  {
    id: "compose",
    name: "Compose",
    value: String(techniques.length),
    unit: "techniques",
    text: "Every edge records the permission that created it. Nothing is inferred.",
  },
  {
    id: "routes",
    name: "Find routes",
    value: String(totals.routes),
    unit: "routes",
    text: "The shortest walk from each principal to an administrator, ranked by hops.",
  },
  {
    id: "sever",
    name: "Sever",
    value: String(totals.cut),
    unit: "grants",
    text: `Across ${totals.accounts} accounts, each minimum cut is re-run until no route remains.`,
  },
  {
    id: "render",
    name: "Render",
    value: "5",
    unit: "outputs",
    text: "Text, JSON, SARIF, Mermaid — and the survey you are reading.",
  },
] as const;

export function Hero() {
  const bundle = byKey.get(FEATURED);
  const route = bundle?.signature ?? null;
  const hidden = Math.max(0, (route?.hops ?? 7) - 4);
  const startLabel = route?.labels[0] ?? "Principal";

  if (!bundle) return null;

  return (
    <section className="hero" id="start" aria-labelledby="start-title" tabIndex={-1}>
      <div className="hero__stage">
        <div className="hero__field" aria-hidden="true">
          <PlanetHero />
        </div>
        <span className="hero__shade" aria-hidden="true" />
        <span className="hero__scan" aria-hidden="true" />
        <span className="hero__frame" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <div className="hero__telemetry" aria-hidden="true">
          <span>
            <i /> SIGNAL / LIVE
          </span>
          <span>SYS / AP-01</span>
          <span>TRANSIT / 07</span>
        </div>


        <div className="shell hero__content">
          <div className="hero__copy">
            <p className="kicker">Apsis / Orbital security 01</p>
            <h1
              className="hero__title"
              id="start-title"
              aria-label="Every route ends at the sun."
            >
              <span className="hero__line">
                <span>Every route</span>
              </span>
              <span className="hero__line">
                <span>
                  ends at the <span className="accent-text">sun.</span>
                </span>
              </span>
            </h1>
            <p className="hero__subject">
              TO THE ADMINISTRATOR <span aria-hidden="true">/</span> EVERY STOLEN CREDENTIAL'S PATH
            </p>
            <p className="hero__lede">
              Apsis reads an AWS account as a solar system of permissions. It finds every path a
              stolen credential could walk to the administrator at its centre — then computes the
              fewest grants that close them all.
            </p>

            <div className="hero__actions">
              <button
                type="button"
                className="btn btn--signal"
                onClick={() => scrollToSection("survey")}
              >
                Enter the system
                <ArrowUpRight size={18} strokeWidth={2.2} aria-hidden />
              </button>
              <button
                type="button"
                className="btn btn--line"
                onClick={() => scrollToSection("how")}
              >
                Read the method
                <ArrowDown size={16} strokeWidth={2} aria-hidden />
              </button>
            </div>

            <ul className="hero__stats">
              <li>
                <span className="hero__statValue">{bundle.stats.identities}</span>
                <span className="hero__statLabel">identities</span>
              </li>
              <li>
                <span className="hero__statValue">{bundle.stats.edges}</span>
                <span className="hero__statLabel">edges</span>
              </li>
              <li>
                <span className="hero__statValue">{bundle.stats.routes}</span>
                <span className="hero__statLabel">routes</span>
              </li>
              <li>
                <span className="hero__statValue">{bundle.sever.edgeCut.edges.length}</span>
                <span className="hero__statLabel">cuts</span>
              </li>
            </ul>
          </div>
        </div>

        <aside className="hero__hud" aria-label="Signature route">
          <p className="hero__hudKicker">Signature transit</p>
          <p className="hero__hudRoute">
            {startLabel} <span aria-hidden="true">→</span> Administrator
          </p>
          <div className="hero__hudMeta">
            <span>{route?.hops ?? 7} hops</span>
            <span>{hidden} withheld</span>
            <span>Games studio</span>
          </div>
          <span className="hero__hudLine" aria-hidden="true" />
        </aside>

        <div className="shell hero__foot">
          <span>Games studio / live services</span>
          <span>{bundle.scenario.accountId} / eu-west-2</span>
          <span className="hero__scroll">
            Enter the system
            <span className="hero__scrollLine" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="hero__ticker" aria-hidden="true">
        <div className="hero__tickerTrack">
          <span>
            {totals.identities} identities / {totals.edges} edges / {totals.routes} routes /{" "}
            {totals.cut} cuts / {totals.accounts} accounts / {techniques.length} techniques /
          </span>
          <span>
            {totals.identities} identities / {totals.edges} edges / {totals.routes} routes /{" "}
            {totals.cut} cuts / {totals.accounts} accounts / {techniques.length} techniques /
          </span>
        </div>
      </div>

      <div className="shell hero__method" id="how">
        <div className="hero__methodHead">
          <div>
            <p className="kicker">The method</p>
            <h2 aria-label="Five moves from raw policy to a closed account.">
              Five moves from
              <br />
              <span className="accent-text">raw policy</span> to a closed account.
            </h2>
          </div>
          <p>
            Each stage hands its output to the next. These are the engine's own figures, not a
            diagram of them.
          </p>
        </div>

        <ol className="method">
          {STEPS.map((step, index) => (
            <li className="method__step" key={step.id}>
              <span className="method__top" aria-hidden="true" />
              <span className="method__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="method__name">{step.name}</span>
              <p className="method__metric">
                <span className="method__value">{step.value}</span>
                <span className="method__unit">{step.unit}</span>
              </p>
              <p className="method__text">{step.text}</p>
            </li>
          ))}
        </ol>

        <p className="hero__methodFoot">
          <ShieldCheck size={15} strokeWidth={2} aria-hidden />
          Every figure is drawn from the same export as the survey below.
        </p>
      </div>
    </section>
  );
}
