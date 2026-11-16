import { ArrowUpRight, ChevronRight, ShieldCheck } from "lucide-react";
import { index, techniques, totals } from "../lib/data";
import { SECTIONS, scrollToSection } from "../lib/useSection";
import { Reveal } from "../components/Reveal";
import { ApsisMark } from "../components/ApsisMark";
import { BlackHole } from "../components/BlackHole";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does Apsis actually read?",
    a: "An export of the account's identity and policy metadata: users, roles, groups, what trusts them, and which IAM actions each one may perform. It never writes to the account the survey is about.",
  },
  {
    q: "How is a route different from a policy finding?",
    a: "A finding names one risky grant. A route is a walk: every hop is a permission the principal can actually use, and the last hop lands on an administrator. The page lights the shortest route for each principal, using the same breadth-first walk the engine runs.",
  },
  {
    q: "What makes the cut minimum?",
    a: "The engine removes the fewest grants that leave no principal able to reach an administrator, then re-runs every source against the reduced graph. The accounts on this page close with 1 to 4 grants and report zero remaining routes.",
  },
  {
    q: "Does severing break production?",
    a: "It is printed as a proposal, not applied. Each removed grant is tied to the technique and IAM action that created the edge, so a human can judge the operational cost before revoking anything.",
  },
  {
    q: "Can this run in CI?",
    a: "Yes. apsis check exits clean when no identity reaches administrator and non-zero with the remaining route when one does. The delivery-pipeline fixture on this page is the same account before and after a single pull request.",
  },
];

export function Close() {
  const generated = new Date(index.generated).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <section className="close" id="close" aria-labelledby="close-title">
      <div className="close__scene">
        <span className="close__halo" aria-hidden="true" />
        <span className="close__grid" aria-hidden="true" />
        <div className="shell close__sceneGrid">
          <div className="close__copy">
            <p className="kicker">05 / Resolution</p>
            <h2 className="close__title" id="close-title" aria-label="Every route closed.">
              Every route
              <br />
              <span className="accent-text">closed.</span>
            </h2>
            <p className="close__lede">
              One export, every identity, every way through — and the fewest grants that close
              them all. The survey is live; the commands are recorded from the included fixture
              fleet; nothing here is hand-typed.
            </p>

            <div className="close__actions">
              <button
                type="button"
                className="btn btn--signal"
                onClick={() => scrollToSection("survey")}
              >
                Open the survey
                <ArrowUpRight size={18} strokeWidth={2.2} aria-hidden />
              </button>
              <button
                type="button"
                className="btn btn--line"
                onClick={() => scrollToSection("commands")}
              >
                Run a command
              </button>
            </div>

            <ul className="close__facts">
              <li>
                <strong>{totals.identities}</strong> identities
              </li>
              <li>
                <strong>{totals.edges}</strong> edges
              </li>
              <li>
                <strong>{totals.routes}</strong> routes
              </li>
              <li>
                <strong>{totals.cut}</strong> cuts
              </li>
              <li>
                <strong>{totals.accounts}</strong> accounts
              </li>
              <li>
                <strong>{techniques.length}</strong> techniques
              </li>
            </ul>
          </div>

          <div className="close__zero" aria-hidden="true">
            <span className="close__zeroDial">
              <BlackHole />
            </span>
            <span className="close__zeroLabel">
              <b>0</b> routes remain
            </span>
            <span className="close__zeroFine">event horizon verified</span>
          </div>
        </div>

        <div className="shell close__sceneFoot">
          <span>
            <ShieldCheck size={14} strokeWidth={2} aria-hidden />
            Read-only
          </span>
          <span>{index.engine.name} {index.engine.version}</span>
          <span>{generated}</span>
        </div>
      </div>

      <div className="shell close__faq">
        <div className="close__faqIntro">
          <p className="kicker">Notes</p>
          <h2 aria-label="Questions the map raises.">
            Questions the map
            <br />
            <span className="accent-text">raises.</span>
          </h2>
          <p>
            Short answers, in the same order as the page: what is read, how a route is found, what
            the cut costs, and how to keep it closed.
          </p>
          <p className="close__faqMore">
            Every number here is drawn from the engine export, not typed by hand.
          </p>
        </div>

        <Reveal className="close__faqBody" delay={60}>
          <div className="close__faqList">
            {FAQ.map((item, i) => (
              <details className="faq" key={item.q} open={i === 0}>
                <summary className="faq__summary">
                  <span className="faq__num data">{String(i + 1).padStart(2, "0")}</span>
                  <span className="faq__q">{item.q}</span>
                  <span className="faq__icon" aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className="faq__a">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </Reveal>
      </div>

      <footer className="close__footer">
        <div className="shell close__footerInner">
          <div className="close__brand">
            <p className="close__word">
              Apsis
              <span className="close__slash">
                <ApsisMark size={16} />
              </span>
            </p>
            <p className="close__tag">
              An orbital security console, drawn from the export.
              <br />
              Recorded from synthetic fixtures. No customer data.
              <br />
              Code & design by Meruyert Oshayeva.
            </p>
          </div>

          <nav className="close__nav" aria-label="Page sections">
            <p className="close__navLabel">Sections</p>
            <ul>
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <button type="button" onClick={() => scrollToSection(section.id)}>
                    <span className="data">{section.index}</span>
                    {section.label}
                    <ChevronRight size={13} strokeWidth={2} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="close__meta">
            <p className="close__navLabel">Export</p>
            <dl>
              <div>
                <dt>Engine</dt>
                <dd className="data">
                  {index.engine.name} {index.engine.version}
                </dd>
              </div>
              <div>
                <dt>Generated</dt>
                <dd className="data">{generated}</dd>
              </div>
              <div>
                <dt>Fixtures</dt>
                <dd className="data">{index.totals.fixtures}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>read-only</dd>
              </div>
            </dl>
          </div>
        </div>

        <p className="close__mega" aria-hidden="true">
          Apsis
        </p>

        <div className="shell close__base">
          <p>Apsis / identity escalation survey</p>
          <p>Recorded fixture fleet / every count traceable</p>
          <p>Planet textures / Solar System Scope · CC BY 4.0</p>
        </div>
      </footer>
    </section>
  );
}
