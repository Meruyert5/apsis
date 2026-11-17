interface Props {
  variant: "observer" | "biologist" | "diver";
}

/**
 * The three crew figures. Each is a line-art operator in the console palette:
 * the observatory controller, the field biologist and the abyss diver. They
 * are decorative; all data lives in the surrounding text.
 */
export function MissionFigure({ variant }: Props) {
  if (variant === "observer") {
    return (
      <svg className="mission-figure mission-figure--observer" viewBox="0 0 260 210" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="obs-screen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4fe3c1" stopOpacity=".28" />
            <stop offset="1" stopColor="#8b7bff" stopOpacity=".08" />
          </linearGradient>
        </defs>
        <g stroke="#bfffe9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 176 L232 176 L214 196 L42 196 Z" fill="rgba(4,26,23,.7)" />
          <path d="M48 176 L64 118 L198 118 L212 176" fill="rgba(4,30,26,.35)" />
          <path d="M72 118 L80 76 L184 76 L192 118" fill="url(#obs-screen)" />
          <ellipse cx="132" cy="96" rx="34" ry="12" opacity=".7" />
          <circle cx="132" cy="96" r="4" fill="#ffd27a" stroke="none" />
          <path d="M86 108 L98 102 L108 108 L122 96 L134 104 L150 94 L168 104" opacity=".8" />
          <path d="M180 118 L180 54" opacity=".35" />
          <path d="M166 54 L196 46 L200 60 L170 66 Z" opacity=".4" />
          <circle cx="116" cy="42" r="12" fill="rgba(4,26,23,.8)" />
          <path d="M102 42 Q106 26 120 28 Q132 30 130 44" />
          <path d="M104 44 L96 50 L102 56" />
          <path d="M112 32 L108 20 L116 16" />
          <path d="M128 54 Q146 56 156 68 L164 82" />
          <path d="M104 54 Q94 62 90 76 L88 94" />
          <path d="M86 94 L74 112" />
          <path d="M162 82 L176 100" />
          <circle cx="72" cy="114" r="4" />
          <circle cx="178" cy="102" r="4" />
          <path d="M92 128 Q112 140 132 140 Q152 140 172 128" opacity=".6" />
          <path d="M60 170 L60 148 L90 148" opacity=".4" />
          <circle cx="66" cy="164" r="3" fill="#4fe3c1" stroke="none" />
          <circle cx="78" cy="164" r="3" fill="#ffd27a" stroke="none" />
        </g>
      </svg>
    );
  }

  if (variant === "biologist") {
    return (
      <svg className="mission-figure mission-figure--biologist" viewBox="0 0 180 240" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="bio-jar" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#4fe3c1" stopOpacity=".8" />
            <stop offset="1" stopColor="#4fe3c1" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g stroke="#bfffe9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M70 48 Q78 30 96 30 Q114 32 120 50 L112 64 Q94 58 78 66 Z" fill="rgba(4,26,23,.65)" />
          <path d="M78 62 Q96 54 112 62" opacity=".6" />
          <path d="M86 32 L84 22 L92 18" />
          <rect x="84" y="18" width="12" height="6" rx="3" fill="rgba(255,210,122,.25)" />
          <circle cx="90" cy="21" r="2" fill="#ffd27a" stroke="none" />
          <path d="M76 68 Q68 92 72 128 L86 196 L74 232" fill="none" />
          <path d="M114 68 Q124 96 120 132 L108 196 L120 232" fill="none" />
          <path d="M76 68 Q96 60 114 68 L120 130 Q96 144 72 130 Z" fill="rgba(4,30,26,.65)" />
          <path d="M86 76 L86 124 M108 76 L108 124" opacity=".25" />
          <path d="M76 96 Q52 106 44 130 L54 144" />
          <path d="M114 96 Q140 104 150 128 L142 142" />
          <circle cx="54" cy="146" r="4.5" />
          <circle cx="142" cy="144" r="4.5" />
          <path d="M64 132 L40 140 L44 164 L66 156 Z" fill="rgba(4,30,26,.8)" />
          <path d="M48 145 L58 142" opacity=".5" />
          <circle cx="150" cy="108" r="10" fill="rgba(4,26,23,.8)" />
          <path d="M150 108 L150 108" />
          <path d="M148 108 Q154 104 160 110" opacity=".7" />
          <circle cx="150" cy="108" r="18" fill="url(#bio-jar)" opacity=".7" />
          <path d="M142 108 L158 108 M150 100 L150 116" opacity=".35" />
          <path d="M86 196 L86 206 L72 214 M108 196 L108 206 L122 214" opacity=".6" />
          <path d="M62 138 Q48 150 50 170" strokeDasharray="2 5" opacity=".35" />
          <circle cx="160" cy="78" r="2.5" opacity=".6" />
          <circle cx="168" cy="64" r="1.8" opacity=".45" />
          <circle cx="36" cy="96" r="2" opacity=".4" />
        </g>
      </svg>
    );
  }

  return (
    <svg className="mission-figure mission-figure--diver" viewBox="0 0 220 300" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="diver-visor" cx="38%" cy="34%" r="70%">
          <stop offset="0" stopColor="#d6fff2" stopOpacity=".5" />
          <stop offset=".55" stopColor="#2a8f80" stopOpacity=".25" />
          <stop offset="1" stopColor="#03110f" stopOpacity=".9" />
        </radialGradient>
      </defs>
      <g stroke="#bfffe9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M66 196 Q24 226 8 282" strokeDasharray="3 7" opacity=".4" />
        <rect x="78" y="88" width="66" height="72" rx="17" fill="rgba(4,30,26,.72)" />
        <rect x="87" y="96" width="18" height="48" rx="9" opacity=".7" />
        <rect x="111" y="96" width="18" height="48" rx="9" opacity=".7" />
        <path d="M132 98 Q154 76 138 56" opacity=".65" />
        <path d="M74 108 Q110 94 146 108 L152 172 Q110 188 68 172 Z" fill="rgba(4,28,24,.78)" />
        <path d="M86 116 Q110 108 134 116" opacity=".4" />
        <rect x="94" y="124" width="36" height="24" rx="5" fill="rgba(2,16,14,.8)" />
        <circle cx="102" cy="136" r="2.4" fill="#4fe3c1" stroke="none" />
        <circle cx="112" cy="136" r="2.4" fill="#ffd27a" stroke="none" />
        <circle cx="122" cy="136" r="2.4" fill="#ff8fa3" stroke="none" />
        <path d="M72 170 Q110 182 148 170" />
        <rect x="80" y="172" width="16" height="11" rx="2" opacity=".65" />
        <rect x="100" y="172" width="16" height="11" rx="2" opacity=".65" />
        <rect x="120" y="172" width="16" height="11" rx="2" opacity=".65" />
        <path d="M76 116 Q52 138 42 168 L54 184" />
        <path d="M144 116 Q170 132 180 158 L168 172" />
        <circle cx="54" cy="186" r="6" fill="rgba(4,30,26,.8)" />
        <circle cx="168" cy="174" r="6" fill="rgba(4,30,26,.8)" />
        <path d="M78 146 L54 160" opacity=".45" />
        <path d="M142 146 L166 158" opacity=".45" />
        <rect x="156" y="162" width="28" height="20" rx="4" transform="rotate(12 170 172)" fill="rgba(2,16,14,.85)" />
        <path d="M161 168 L178 165" opacity=".7" />
        <path d="M161 173 L175 171" opacity=".5" />
        <path d="M84 182 Q78 220 68 250 L82 268" />
        <path d="M134 182 Q142 220 152 250 L138 268" />
        <path d="M74 236 Q84 244 94 238" opacity=".5" />
        <path d="M146 236 Q156 244 166 238" opacity=".5" />
        <path d="M68 250 L54 258 L58 270 L82 268" fill="rgba(4,30,26,.75)" />
        <path d="M152 250 L166 258 L162 270 L138 268" fill="rgba(4,30,26,.75)" />
        <circle cx="110" cy="62" r="41" fill="rgba(4,24,21,.8)" />
        <circle cx="110" cy="62" r="32" fill="rgba(4,28,24,.9)" stroke="rgba(214,255,242,.65)" />
        <ellipse cx="110" cy="62" rx="25" ry="19" fill="url(#diver-visor)" stroke="rgba(214,255,242,.55)" />
        <path d="M92 52 Q106 42 124 48" stroke="rgba(255,255,255,.55)" />
        <path d="M110 22 L110 10" />
        <circle cx="110" cy="8" r="2.5" fill="#ffd27a" stroke="none" />
        <circle cx="146" cy="62" r="4" fill="#ffd27a" stroke="none" />
        <path d="M150 62 L188 48 L192 70 L150 68 Z" fill="rgba(255,210,122,.08)" stroke="rgba(255,210,122,.22)" />
        <path d="M84 44 L78 34 M136 44 L142 34" opacity=".5" />
        <circle cx="188" cy="96" r="3.2" opacity=".5" />
        <circle cx="196" cy="118" r="2.2" opacity=".35" />
        <circle cx="30" cy="246" r="2.6" opacity=".3" />
      </g>
    </svg>
  );
}
