// The Village mark: a family of people forming a heart, flanked by two homes,
// with chat bubbles above — "Connect. Communicate. Coordinate." Rendered inline
// (not an <img>) so it bundles into the single-file build with no external request.
export default function Logo({ size = 40, rounded = true }: { size?: number; rounded?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="Village"
      style={{ display: 'block' }}
    >
      {rounded && <rect x="16" y="16" width="480" height="480" rx="112" fill="#ffffff" />}
      <g>
        {/* Left house: teal */}
        <ellipse cx="168" cy="268" rx="34" ry="22" fill="#8ba955" />
        <path d="M84 168 L156 168 L156 262 L120 306 L84 262 Z" fill="#6c9c92" />
        <path d="M66 172 L120 116 L174 172 Z" fill="#1f3b5e" />
        <g fill="#ffffff">
          <rect x="102" y="190" width="13" height="13" rx="2" />
          <rect x="119" y="190" width="13" height="13" rx="2" />
          <rect x="102" y="207" width="13" height="13" rx="2" />
          <rect x="119" y="207" width="13" height="13" rx="2" />
        </g>
        {/* Right house: yellow */}
        <ellipse cx="344" cy="268" rx="34" ry="22" fill="#8ba955" />
        <path d="M356 168 L428 168 L428 262 L392 306 L356 262 Z" fill="#e6ad46" />
        <path d="M338 172 L392 116 L446 172 Z" fill="#1f3b5e" />
        <g fill="#ffffff">
          <rect x="380" y="190" width="13" height="13" rx="2" />
          <rect x="397" y="190" width="13" height="13" rx="2" />
          <rect x="380" y="207" width="13" height="13" rx="2" />
          <rect x="397" y="207" width="13" height="13" rx="2" />
        </g>

        {/* People forming the heart */}
        <g fill="#e07a5f" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round">
          <circle cx="178" cy="212" r="38" />
          <path d="M130 268 A48 48 0 0 1 226 268 L236 462 Z" />
        </g>
        <g fill="#7fb0a6" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round">
          <circle cx="334" cy="212" r="38" />
          <path d="M286 268 A48 48 0 0 1 382 268 L276 462 Z" />
        </g>
        <g fill="#1f3b5e" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round">
          <circle cx="256" cy="176" r="52" />
          <path d="M192 252 A64 64 0 0 1 320 252 L256 474 Z" />
        </g>
        <g fill="#e6ad46" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round">
          <circle cx="214" cy="256" r="31" />
          <path d="M175 304 A39 39 0 0 1 253 304 L243 466 Z" />
        </g>
        <g fill="#8ba955" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round">
          <circle cx="298" cy="256" r="31" />
          <path d="M259 304 A39 39 0 0 1 337 304 L269 466 Z" />
        </g>

        {/* Chat bubbles */}
        <g>
          <rect x="110" y="44" width="96" height="54" rx="20" fill="#e07a5f" />
          <path d="M132 92 L150 116 L162 92 Z" fill="#e07a5f" />
          <g fill="#ffffff">
            <circle cx="138" cy="71" r="6" />
            <circle cx="158" cy="71" r="6" />
            <circle cx="178" cy="71" r="6" />
          </g>
        </g>
        <g>
          <rect x="312" y="36" width="98" height="54" rx="20" fill="#6c9c92" />
          <path d="M388 84 L404 108 L372 84 Z" fill="#6c9c92" />
          <g fill="#ffffff">
            <circle cx="338" cy="63" r="6" />
            <circle cx="360" cy="63" r="6" />
            <circle cx="382" cy="63" r="6" />
          </g>
        </g>
        <g>
          <rect x="222" y="96" width="72" height="44" rx="16" fill="#8ba955" />
          <path d="M244 136 L256 156 L266 136 Z" fill="#8ba955" />
          <g fill="#ffffff">
            <circle cx="240" cy="118" r="5" />
            <circle cx="258" cy="118" r="5" />
            <circle cx="276" cy="118" r="5" />
          </g>
        </g>
      </g>
    </svg>
  )
}
