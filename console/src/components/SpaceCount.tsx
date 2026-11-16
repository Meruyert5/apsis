import type { CSSProperties } from "react";

export type SpaceKind =
  | "void"
  | "moon"
  | "planet"
  | "ringed"
  | "giant"
  | "star"
  | "cluster"
  | "galaxy";

export function spaceKind(count: number): SpaceKind {
  if (count <= 0) return "void";
  if (count === 1) return "moon";
  if (count <= 3) return "planet";
  if (count <= 6) return "ringed";
  if (count <= 9) return "giant";
  if (count <= 19) return "star";
  if (count <= 33) return "cluster";
  return "galaxy";
}

type Tone = "identity" | "compute" | "trust" | "signal" | "solar" | "mint" | "plasma";

interface Props {
  count: number;
  tone?: Tone;
  size?: "xs" | "sm" | "md" | "metric" | "lg";
  showNumber?: boolean;
  decorative?: boolean;
  className?: string;
}

function toneVar(tone: Tone) {
  if (tone === "identity") return "var(--solar)";
  if (tone === "compute") return "var(--blue-lit)";
  if (tone === "trust") return "var(--violet-lit)";
  if (tone === "solar") return "var(--solar)";
  if (tone === "mint") return "var(--mint)";
  if (tone === "plasma") return "var(--plasma)";
  return "var(--signal)";
}

/** A miniature, rendered celestial body. The class encodes grant volume;
 *  the exact count stays as a small telemetry tag. */
function Body({ kind, tone }: { kind: SpaceKind; tone: Tone }) {
  const common = { viewBox: "0 0 32 32", width: "100%", height: "100%", "aria-hidden": true };
  const tex = (name: string) => `${import.meta.env.BASE_URL}textures/${name}`;

  if (kind === "moon" || kind === "planet" || kind === "ringed" || kind === "giant") {
    const planetTexture =
      tone === "compute"
        ? tex("1k_neptune.jpg")
        : tone === "trust"
          ? tex("1k_venus_surface.jpg")
          : tone === "mint"
            ? tex("1k_uranus.jpg")
            : tone === "solar"
              ? tex("1k_mercury.jpg")
              : tex("1k_mars.jpg");
    const source =
      kind === "moon"
        ? tex("1k_mercury.jpg")
        : kind === "planet"
          ? planetTexture
          : kind === "ringed"
            ? tex("1k_saturn.jpg")
            : tex("1k_jupiter.jpg");
    return (
      <span
        className={`spaceCount__photo spaceCount__photo--${kind}`}
        style={{ backgroundImage: `url(${source})` }}
      >
        <span className="spaceCount__limb" />
        {kind === "moon" ? <span className="spaceCount__crater" /> : null}
        {kind === "planet" ? <span className="spaceCount__speck" /> : null}
        {kind === "ringed" ? <span className="spaceCount__photoRing" /> : null}
        {kind === "giant" ? (
          <>
            <span className="spaceCount__photoRing spaceCount__photoRing--wide" />
            <span className="spaceCount__photoRing spaceCount__photoRing--two" />
          </>
        ) : null}
      </span>
    );
  }

  if (kind === "void") {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="4.2" fill="#01030a" stroke="currentColor" strokeOpacity="0.52" />
        <circle cx="16" cy="16" r="8.4" fill="none" stroke="currentColor" strokeOpacity="0.24" strokeDasharray="1.5 3.2" transform="rotate(-20 16 16)" />
      </svg>
    );
  }

  if (kind === "star") {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="10" fill="currentColor" fillOpacity="0.12" />
        <path d="M16 1.5l2.2 11.1L29 16l-10.8 3.4L16 30.5l-2.2-11.1L3 16l10.8-3.4z" fill="currentColor" fillOpacity="0.9" />
        <circle cx="16" cy="16" r="3.6" fill="#fff" fillOpacity="0.9" />
        <circle cx="16" cy="16" r="6.4" fill="none" stroke="#fff" strokeOpacity="0.25" />
      </svg>
    );
  }

  if (kind === "cluster") {
    return (
      <svg {...common}>
        <circle cx="16" cy="16" r="11" fill="currentColor" fillOpacity="0.08" />
        <circle cx="11" cy="12" r="2.4" fill="currentColor" fillOpacity="0.85" />
        <circle cx="20" cy="10.5" r="1.6" fill="#fff" fillOpacity="0.9" />
        <circle cx="23" cy="18" r="2.1" fill="currentColor" fillOpacity="0.8" />
        <circle cx="14" cy="22" r="1.8" fill="currentColor" fillOpacity="0.85" />
        <circle cx="8" cy="19.5" r="1.2" fill="#fff" fillOpacity="0.7" />
        <circle cx="18" cy="17" r="1.4" fill="#fff" fillOpacity="0.75" />
        <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeOpacity="0.18" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="16" cy="16" r="12" fill="currentColor" fillOpacity="0.08" />
      <path d="M16 7c4.5 0 8 3.5 8 8 0 3.2-1.8 5.8-4.2 7.2" fill="none" stroke="currentColor" strokeOpacity="0.85" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 25c-4.5 0-8-3.5-8-8 0-3.2 1.8-5.8 4.2-7.2" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M19 9.5c3.2 1.2 5.5 4 5.5 7.2 0 2.2-.8 4.2-2.2 5.8" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3.2" fill="#fff" fillOpacity="0.9" />
      <circle cx="16" cy="16" r="5.5" fill="none" stroke="currentColor" strokeOpacity="0.3" />
    </svg>
  );
}

export function SpaceCount({
  count,
  tone = "signal",
  size = "sm",
  showNumber = true,
  decorative = false,
  className,
}: Props) {
  const kind = spaceKind(count);
  return (
    <span
      className={`spaceCount spaceCount--${size} spaceCount--${kind}${className ? ` ${className}` : ""}`}
      data-tone={tone}
      aria-hidden={decorative ? "true" : undefined}
      title={decorative ? undefined : `${count} grant${count === 1 ? "" : "s"}`}
      style={{ "--tone": toneVar(tone), color: "var(--tone)" } as CSSProperties}
    >
      <span className="spaceCount__glyph" aria-hidden="true">
        <Body kind={kind} tone={tone} />
      </span>
      {showNumber && count > 0 ? <span className="spaceCount__num">{count}</span> : null}
    </span>
  );
}
