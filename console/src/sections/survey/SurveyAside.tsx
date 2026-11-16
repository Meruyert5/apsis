import {
  ArrowLeft,
  ArrowRight,
  Crown,
  RotateCcw,
  Scissors,
  ShieldAlert,
  Waypoints,
} from "lucide-react";
import type { Bundle, GraphEdge } from "../../lib/types";
import type { PrincipalRow } from "../../lib/graph";

interface Props {
  bundle: Bundle;
  rows: PrincipalRow[];
  selected: string | null;
  stepIndex: number;
  cutOn: boolean;
  onSelect: (id: string) => void;
  onStep: (index: number) => void;
  onRestore: () => void;
}

export function SurveyAside({
  bundle,
  rows,
  selected,
  stepIndex,
  cutOn,
  onSelect,
  onStep,
  onRestore,
}: Props) {
  const node = selected ? bundle.nodes.find((item) => item.id === selected) ?? null : null;
  const row = selected ? rows.find((item) => item.id === selected) ?? null : null;
  const steps: GraphEdge[] = row ? row.route.edges : [];
  const activeStep = steps[Math.min(stepIndex, steps.length - 1)] ?? null;
  const sever = bundle.sever;
  const cutEdges = sever.edgeCut.edges
    .map((id) => bundle.edges.find((edge) => edge.id === id))
    .filter((edge): edge is GraphEdge => Boolean(edge));

  return (
    <div className="dossier">
      <section className="dossier__card dossier__card--node" key={node?.id} aria-labelledby="survey-node-title">
        <p className="dossier__kicker">
          <span className="dossier__kickerLine" aria-hidden="true" />
          Selected {node?.admin ? "destination" : "identity"}
        </p>
        {node ? (
          <>
            <div className="dossier__nodeHead">
              <span className="dossier__nodeMark" data-admin={node.admin ? "true" : undefined}>
                <span />
              </span>
              <div>
                <h3 className="dossier__nodeName" id="survey-node-title">
                  {node.label}
                </h3>
                <p className="dossier__nodeKind">
                  {node.kind} / {node.degree} connection{node.degree === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {node.note ? <p className="dossier__note">{node.note}</p> : null}
            {node.admin ? (
              <p className="dossier__flag">
                <Crown size={14} strokeWidth={2} aria-hidden />
                Every lit route ends here.
              </p>
            ) : null}
            {node.arn ? <p className="dossier__arn">{node.arn}</p> : null}
          </>
        ) : (
          <p className="dossier__note">Pick a node in the field, or a principal below.</p>
        )}
      </section>

      {cutOn ? (
        <section className="dossier__card dossier__card--closed" aria-labelledby="survey-closed-title">
          <div className="dossier__closedHead">
            <span className="dossier__closedMark" aria-hidden="true">
              <Scissors size={16} strokeWidth={2} />
            </span>
            <div>
              <h3 id="survey-closed-title">Account closed</h3>
              <p>{sever.routesAfter} of {sever.routesBefore} routes remain</p>
            </div>
          </div>

          <dl className="dossier__tally">
            <div>
              <dt>Grants removed</dt>
              <dd>{sever.edgeCut.edges.length}</dd>
            </div>
            <div>
              <dt>Routes before</dt>
              <dd>{sever.routesBefore}</dd>
            </div>
            <div>
              <dt>After</dt>
              <dd data-zero="true">0</dd>
            </div>
          </dl>

          <ol className="dossier__cutList">
            {sever.permissionSteps.map((step) => (
              <li key={step.action}>
                <span className="dossier__cutAction">{step.action}</span>
                <span className="dossier__cutMeta">
                  {step.edgesRemoved} grant{step.edgesRemoved === 1 ? "" : "s"} / killed{" "}
                  {step.routesKilled} route{step.routesKilled === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ol>

          <ul className="dossier__cutEdges" aria-label="Severed grants">
            {cutEdges.map((edge) => (
              <li key={edge.id}>
                <span>{edge.name}</span>
                <span className="data">{edge.actions[0]}</span>
              </li>
            ))}
          </ul>

          <button type="button" className="dossier__restore" onClick={onRestore}>
            <RotateCcw size={15} strokeWidth={2} aria-hidden />
            Restore routes
          </button>
        </section>
      ) : null}

      {!cutOn && row ? (
        <section className="dossier__card dossier__card--walk" aria-labelledby="survey-walk-title">
          <header className="dossier__head">
            <h3 id="survey-walk-title">The walk</h3>
            <span className="dossier__count data">
              {String(Math.min(stepIndex + 1, row.route.hops)).padStart(2, "0")} /{" "}
              {String(row.route.hops).padStart(2, "0")}
            </span>
          </header>

          <ol className="dossier__spine" aria-label="Route hops">
            {steps.map((step, index) => (
              <li key={step.id}>
                <button
                  type="button"
                  className="dossier__spineHop"
                  data-state={index < stepIndex ? "past" : index === stepIndex ? "now" : "next"}
                  aria-current={index === stepIndex ? "true" : undefined}
                  aria-label={`Hop ${index + 1} of ${steps.length}: ${step.name}`}
                  onClick={() => onStep(index)}
                >
                  <span className="dossier__spineIndex data" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="dossier__spineDot" aria-hidden="true" />
                  <span className="dossier__spineName">{step.name}</span>
                </button>
              </li>
            ))}
          </ol>

          {activeStep ? (
            <div className="dossier__detail dossier__detail--first" key={activeStep.id}>
              <p className="dossier__detailHead">
                <Waypoints size={14} strokeWidth={2} aria-hidden />
                {activeStep.name}
              </p>
              <p className="dossier__detailText">{activeStep.narration}</p>

              <div className="dossier__actionRow">
                {activeStep.actions.map((action) => (
                  <span className="dossier__action data" key={action}>
                    {action}
                  </span>
                ))}
                {activeStep.conditional ? <span className="dossier__cond">conditional</span> : null}
              </div>

              <dl className="dossier__facts">
                <div>
                  <dt>MITRE</dt>
                  <dd className="data">{activeStep.mitre}</dd>
                </div>
                <div>
                  <dt>Severity</dt>
                  <dd>
                    <span className="dossier__sevDot" data-sev={activeStep.severity} aria-hidden="true" />
                    {activeStep.severity}
                  </dd>
                </div>
              </dl>

              <p className="dossier__label">Evidence</p>
              <p className="dossier__evidence">{activeStep.evidence}</p>
              <p className="dossier__fix">
                <strong>Fix.</strong> {activeStep.fix}
              </p>

              <div className="dossier__hopNav">
                <button
                  type="button"
                  className="dossier__hop"
                  disabled={stepIndex <= 0}
                  onClick={() => onStep(Math.max(0, stepIndex - 1))}
                >
                  <ArrowLeft size={14} strokeWidth={2} aria-hidden />
                  Previous
                </button>
                <span className="dossier__hopCount data">
                  {String(Math.min(stepIndex + 1, row.route.hops)).padStart(2, "0")} /{" "}
                  {String(row.route.hops).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  className="dossier__hop"
                  disabled={stepIndex >= row.route.hops - 1}
                  onClick={() => onStep(Math.min(row.route.hops - 1, stepIndex + 1))}
                >
                  Next
                  <ArrowRight size={14} strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="dossier__card dossier__card--routes" aria-labelledby="survey-routes-title">
        <header className="dossier__head">
          <h3 id="survey-routes-title">Reachable principals</h3>
          <span className="dossier__count data">
            {rows.length} / {bundle.stats.sources}
          </span>
        </header>
        {rows.length > 0 ? (
          <ul className="dossier__routes">
            {rows.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="dossier__route"
                  aria-current={item.id === selected ? "true" : undefined}
                  aria-label={`${item.label}, route of ${item.route.hops} hops`}
                  onClick={() => onSelect(item.id)}
                >
                  <span className="dossier__routeMark" aria-hidden="true" />
                  <span className="dossier__routeName">{item.label}</span>
                  <span className="dossier__routeHops data">{item.route.hops}</span>
                  <ArrowRight size={14} strokeWidth={2} aria-hidden className="dossier__routeArrow" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dossier__empty">
            <ShieldAlert size={15} strokeWidth={2} aria-hidden />
            No principal reaches administrator.
          </p>
        )}
      </section>

      {!cutOn && !row && node && !node.admin ? (
        <section className="dossier__card dossier__card--empty">
          <h3>
            <ShieldAlert size={16} strokeWidth={2} aria-hidden />
            No route from {node.label}
          </h3>
          <p>
            This principal cannot walk to an administrator in the current graph. The other{" "}
            {rows.length} principals with routes are listed below.
          </p>
        </section>
      ) : null}
    </div>
  );
}
