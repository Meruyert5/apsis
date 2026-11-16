/**
 * The deep-space field behind the console. It is one fixed layer so every
 * glass surface refracts the same sky; it is decorative and never interactive.
 */
export function Cosmos() {
  return (
    <div className="cosmos" aria-hidden="true">
      <span className="cosmos__mesh" />
      <span className="cosmos__nebula" />
      <span className="cosmos__stars" />
      <span className="cosmos__stars cosmos__stars--near" />
      <span className="cosmos__arc cosmos__arc--one" />
      <span className="cosmos__arc cosmos__arc--two" />
      <span className="cosmos__horizon" />
      <span className="cosmos__orb cosmos__orb--one" />
      <span className="cosmos__orb cosmos__orb--two" />
      <span className="cosmos__axis cosmos__axis--x" />
      <span className="cosmos__axis cosmos__axis--y" />
    </div>
  );
}
