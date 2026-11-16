interface Props {
  size?: number;
}

/** The Apsis mark: a apsis arc crossing an orbit, with the sun at the
 *  centre and a live body at the culmination point. */
export function ApsisMark({ size = 20 }: Props) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <ellipse
        cx="12"
        cy="12"
        rx="9.4"
        ry="3.4"
        stroke="var(--gold)"
        strokeOpacity="0.54"
        strokeWidth="0.8"
        transform="rotate(-20 12 12)"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="4.6"
        ry="9.2"
        stroke="var(--blue-lit)"
        strokeOpacity="0.78"
        strokeWidth="0.8"
        transform="rotate(18 12 12)"
      />
      <circle cx="12" cy="12" r="2.8" fill="var(--gold)" />
      <circle cx="12" cy="12" r="1.25" fill="var(--gold-lit)" />
      <circle cx="15.6" cy="3.6" r="1.6" fill="var(--signal)" />
      <circle cx="15.6" cy="3.6" r="2.7" fill="none" stroke="var(--signal)" strokeOpacity="0.28" strokeWidth="0.7" />
      <circle cx="4.6" cy="15.6" r="0.9" fill="var(--bone)" fillOpacity="0.8" />
    </svg>
  );
}
