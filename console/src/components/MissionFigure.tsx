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
    <svg className="mission-figure mission-figure--diver" viewBox="0 0 230 330" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="diver-suit" x1="70" y1="104" x2="152" y2="196" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#256b5d" />
          <stop offset=".48" stopColor="#0d302b" />
          <stop offset="1" stopColor="#04110f" />
        </linearGradient>
        <linearGradient id="diver-limb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f5c51" />
          <stop offset=".6" stopColor="#0b2a25" />
          <stop offset="1" stopColor="#051614" />
        </linearGradient>
        <linearGradient id="diver-tank" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#071a17" />
          <stop offset=".42" stopColor="#2f8a76" />
          <stop offset=".7" stopColor="#124238" />
          <stop offset="1" stopColor="#061512" />
        </linearGradient>
        <radialGradient id="diver-visor" cx="36%" cy="30%" r="80%">
          <stop offset="0" stopColor="#eafff9" stopOpacity=".72" />
          <stop offset=".34" stopColor="#57d9c2" stopOpacity=".34" />
          <stop offset=".72" stopColor="#0a3733" stopOpacity=".92" />
          <stop offset="1" stopColor="#020b0a" />
        </radialGradient>
        <linearGradient id="diver-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffd27a" stopOpacity=".3" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="diver-fin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d574d" />
          <stop offset="1" stopColor="#061816" />
        </linearGradient>
      </defs>

      <g stroke="#bfffe9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {/* tether and clip */}
        <path d="M80 200 Q36 246 12 318" strokeDasharray="4 9" opacity=".38" />
        <rect x="74" y="192" width="10" height="14" rx="3" transform="rotate(-24 79 199)" fill="#08201c" />
        <path d="M76 197 L84 203" opacity=".7" />

        {/* twin tanks */}
        <rect x="82" y="98" width="19" height="86" rx="9" fill="url(#diver-tank)" />
        <rect x="112" y="98" width="19" height="86" rx="9" fill="url(#diver-tank)" />
        <path d="M82 120 L101 120 M112 120 L131 120" opacity=".45" />
        <path d="M82 154 L101 154 M112 154 L131 154" opacity=".45" />
        <rect x="86" y="90" width="11" height="10" rx="3" fill="#0a2621" />
        <rect x="116" y="90" width="11" height="10" rx="3" fill="#0a2621" />
        <path d="M91 90 L91 82 M121 90 L121 82" />
        <circle cx="91" cy="80" r="3" fill="#4fe3c1" stroke="none" />
        <circle cx="121" cy="80" r="3" fill="#ffd27a" stroke="none" />

        {/* torso */}
        <path d="M72 108 Q110 96 150 108 L158 178 Q110 198 64 178 Z" fill="url(#diver-suit)" />
        <path d="M76 114 Q110 104 144 114" opacity=".35" />
        <path d="M70 148 Q110 160 152 148" opacity=".22" />
        <ellipse cx="76" cy="113" rx="10" ry="7" fill="#123b33" />
        <ellipse cx="146" cy="113" rx="10" ry="7" fill="#123b33" />

        {/* harness */}
        <path d="M84 110 L94 176 M136 110 L126 176" stroke="rgba(191,255,233,.42)" strokeWidth="4" />
        <path d="M86 142 L134 142" stroke="rgba(191,255,233,.28)" strokeWidth="3" />
        <rect x="104" y="137" width="12" height="10" rx="2" fill="#08201c" />

        {/* chest console */}
        <rect x="90" y="120" width="40" height="30" rx="6" fill="#031512" stroke="rgba(191,255,233,.55)" />
        <rect x="95" y="125" width="22" height="11" rx="2" fill="rgba(79,227,193,.18)" stroke="rgba(79,227,193,.4)" strokeWidth="1" />
        <path d="M98 130 L104 127 L110 132 L115 128" stroke="#4fe3c1" strokeWidth="1.1" />
        <circle cx="96" cy="144" r="2.4" fill="#4fe3c1" stroke="none" />
        <circle cx="105" cy="144" r="2.4" fill="#ffd27a" stroke="none" />
        <circle cx="114" cy="144" r="2.4" fill="#ff8fa3" stroke="none" />
        <path d="M121 128 L126 128 M121 132 L126 132 M121 136 L124 136" opacity=".5" strokeWidth="1" />

        {/* belt and pouches */}
        <rect x="68" y="174" width="84" height="14" rx="4" fill="#0a231f" />
        <rect x="102" y="176" width="16" height="10" rx="2" fill="#123b33" stroke="rgba(191,255,233,.45)" />
        <path d="M110 176 L110 186" opacity=".5" />
        <rect x="74" y="178" width="12" height="9" rx="2" fill="#061a17" />
        <rect x="136" y="178" width="12" height="9" rx="2" fill="#061a17" />

        {/* left arm */}
        <path d="M76 114 Q60 138 54 162 L49 180" stroke="url(#diver-limb)" strokeWidth="14" />
        <path d="M79 116 Q65 138 60 160" opacity=".3" strokeWidth="1" />
        <path d="M55 152 L62 155 M53 160 L60 163 M51 168 L58 171" strokeWidth="1" opacity=".5" />
        <ellipse cx="47" cy="188" rx="10" ry="12" fill="#0b2a25" />
        <path d="M42 196 L41 205 M47 198 L47 208 M52 196 L54 204" strokeWidth="1.2" opacity=".8" />

        {/* right arm */}
        <path d="M148 114 Q164 138 169 160 L175 176" stroke="url(#diver-limb)" strokeWidth="14" />
        <path d="M144 116 Q159 138 164 158" opacity=".3" strokeWidth="1" />
        <path d="M162 148 L169 151 M164 156 L171 159 M166 164 L173 167" strokeWidth="1" opacity=".5" />
        <ellipse cx="177" cy="184" rx="10" ry="12" fill="#0b2a25" />
        <path d="M172 192 L171 201 M177 194 L177 204 M182 192 L184 200" strokeWidth="1.2" opacity=".8" />

        {/* wrist slate */}
        <rect x="166" y="200" width="34" height="24" rx="3" transform="rotate(9 183 212)" fill="#041714" stroke="rgba(191,255,233,.5)" />
        <path d="M173 208 L192 205 M173 213 L189 210 M173 218 L185 216" transform="rotate(9 183 212)" strokeWidth="1" opacity=".55" />

        {/* legs */}
        <path d="M92 190 Q86 216 85 238 L79 276" stroke="url(#diver-limb)" strokeWidth="18" />
        <path d="M130 190 Q136 216 137 238 L143 276" stroke="url(#diver-limb)" strokeWidth="18" />
        <ellipse cx="86" cy="238" rx="11" ry="9" transform="rotate(-8 86 238)" fill="#123b33" />
        <ellipse cx="136" cy="238" rx="11" ry="9" transform="rotate(8 136 238)" fill="#123b33" />
        <path d="M80 252 L88 254 M80 260 L88 262 M80 268 L88 270" strokeWidth="1" opacity=".4" />
        <path d="M142 252 L150 254 M142 260 L150 262 M142 268 L150 270" strokeWidth="1" opacity=".4" />

        {/* fins */}
        <path d="M79 274 L56 318 L100 308 L88 278 Z" fill="url(#diver-fin)" />
        <path d="M143 274 L166 318 L122 308 L134 278 Z" fill="url(#diver-fin)" />
        <path d="M72 294 L94 290 M68 303 L98 298" strokeWidth="1" opacity=".4" />
        <path d="M150 294 L128 290 M154 303 L124 298" strokeWidth="1" opacity=".4" />

        {/* hoses */}
        <path d="M74 82 Q50 102 62 136" stroke="#0a2a25" strokeWidth="7" />
        <path d="M74 82 Q50 102 62 136" stroke="rgba(191,255,233,.32)" strokeWidth="2" />
        <path d="M146 82 Q170 102 158 134" stroke="#0a2a25" strokeWidth="7" />
        <path d="M146 82 Q170 102 158 134" stroke="rgba(191,255,233,.32)" strokeWidth="2" />

        {/* helmet */}
        <circle cx="110" cy="60" r="43" fill="#04120f" />
        <circle cx="110" cy="60" r="35" fill="#061c18" stroke="rgba(214,255,242,.55)" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return (
            <circle
              key={deg}
              cx={(110 + Math.cos(a) * 39).toFixed(1)}
              cy={(60 + Math.sin(a) * 39).toFixed(1)}
              r="2.1"
              fill="rgba(214,255,242,.6)"
              stroke="none"
            />
          );
        })}
        <ellipse cx="110" cy="60" rx="28" ry="22" fill="url(#diver-visor)" stroke="rgba(214,255,242,.6)" />
        <path d="M88 50 Q104 39 126 46" stroke="rgba(255,255,255,.62)" strokeWidth="2" />
        <path d="M92 70 Q106 79 124 71" stroke="rgba(214,255,242,.24)" strokeWidth="1.4" />
        <path d="M118 40 Q126 43 129 50" stroke="rgba(255,255,255,.4)" strokeWidth="1.2" />
        <rect x="101" y="73" width="18" height="10" rx="3" fill="#06201c" stroke="rgba(214,255,242,.5)" />
        <path d="M105 76 L115 76 M107 80 L113 80" strokeWidth="1" opacity=".6" />

        {/* helmet lamp and beam */}
        <rect x="101" y="11" width="18" height="12" rx="4" fill="#0a2a25" />
        <circle cx="110" cy="15" r="3.2" fill="#ffd27a" stroke="none" />
        <circle cx="110" cy="15" r="7" fill="rgba(255,210,122,.2)" stroke="none" />
        <path d="M100 22 L26 58 L34 96 Z" fill="url(#diver-beam)" stroke="none" opacity=".3" />
        <path d="M119 15 L124 10 M101 15 L96 10" opacity=".5" />

        {/* antenna */}
        <path d="M133 24 L140 14" opacity=".7" />
        <circle cx="141" cy="12" r="2.4" fill="#ff8fa3" stroke="none" />
      </g>

      <g className="diver-bubbles" fill="#bfffe9" stroke="none">
        <circle cx="34" cy="118" r="3.2" opacity=".5" />
        <circle cx="24" cy="86" r="2.2" opacity=".4" />
        <circle cx="42" cy="54" r="1.8" opacity=".35" />
        <circle cx="196" cy="140" r="2.6" opacity=".4" />
        <circle cx="206" cy="106" r="1.8" opacity=".3" />
      </g>
    </svg>
  );
}
