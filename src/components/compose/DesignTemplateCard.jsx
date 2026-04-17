import { MdZoomOutMap } from 'react-icons/md';
import { resolveTemplateVisual, getTemplateExample } from './constants';

export default function DesignTemplateCard({ template, selected, onSelect, onPeek }) {
  const visual = resolveTemplateVisual(template);
  const exampleUrl = getTemplateExample(template);

  function handlePeek(e) {
    e.stopPropagation();
    e.preventDefault();
    onPeek?.(template);
  }

  return (
    <button
      className={`csp__tpl-card ${selected ? 'csp__tpl-card--selected' : ''}`}
      onClick={() => onSelect(template.id)}
      type="button"
    >
      <div className="csp__tpl-thumb">
        {exampleUrl ? (
          <img
            src={exampleUrl}
            alt={template.name}
            className="csp__tpl-thumb-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <MiniPoster visual={visual} name={template.name} />
        )}

        {onPeek && (
          <span
            className="csp__tpl-peek"
            onClick={handlePeek}
            role="button"
            tabIndex={0}
            aria-label={`Preview ${template.name}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handlePeek(e);
            }}
          >
            <MdZoomOutMap />
          </span>
        )}

        {selected && <div className="csp__tpl-check">✓</div>}
      </div>
      <div className="csp__tpl-info">
        <span className="csp__tpl-name">{template.name}</span>
        <span className="csp__tpl-desc">{template.description}</span>
      </div>
    </button>
  );
}

// ─── Mini-Poster SVG illustrations per layout ────────────────
// Used only for templates without a real example image. Each layout
// renders a distinct, genre-communicating composition so admins can read
// the template's structure and vibe at a glance.

function MiniPoster({ visual }) {
  const { layout, palette } = visual;
  switch (layout) {
    case 'activities':    return <ActivitiesPoster palette={palette} />;
    case 'destinations':  return <DestinationsPoster palette={palette} />;
    case 'polaroids':     return <PolaroidsPoster palette={palette} />;
    case 'heritage':      return <HeritagePoster palette={palette} />;
    case 'brush':         return <BrushPoster palette={palette} />;
    case 'editorial':     return <EditorialPoster palette={palette} />;
    default:              return <DefaultPoster palette={palette} />;
  }
}

const VB = { w: 120, h: 160 };

function ActivitiesPoster({ palette }) {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="mini-svg" preserveAspectRatio="xMidYMid slice">
      <rect width={VB.w} height={VB.h} fill={palette.bg} />
      <rect width={VB.w} height="70" fill={palette.hero} opacity="0.08" />
      <g fill="#e5e7eb">
        <ellipse cx="22" cy="22" rx="12" ry="5" />
        <ellipse cx="30" cy="19" rx="8" ry="4" />
        <ellipse cx="92" cy="30" rx="14" ry="5" />
        <ellipse cx="82" cy="27" rx="7" ry="3.5" />
      </g>
      <g stroke={palette.hero} strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M50 20 q3 -2 6 0 q3 -2 6 0" />
        <path d="M70 14 q2 -1.5 4 0 q2 -1.5 4 0" />
      </g>
      <g>
        <rect x="14" y="54" width="28" height="54" rx="3" fill={palette.hero} opacity="0.85" />
        <rect x="46" y="54" width="28" height="54" rx="3" fill={palette.accent} opacity="0.85" />
        <rect x="78" y="54" width="28" height="54" rx="3" fill={palette.hero} opacity="0.55" />
      </g>
      <rect x="18" y="122" width="70" height="7" rx="2" fill="#111827" />
      <rect x="18" y="134" width="44" height="4" rx="2" fill="#111827" opacity="0.35" />
      <g fill={palette.accent}>
        <circle cx="96" cy="128" r="2" />
        <circle cx="102" cy="128" r="2" opacity="0.6" />
      </g>
    </svg>
  );
}

function DestinationsPoster({ palette }) {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="mini-svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="destHero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.hero} />
          <stop offset="1" stopColor={palette.accent} />
        </linearGradient>
      </defs>
      <rect width={VB.w} height={VB.h} fill="#ffffff" />
      <rect width={VB.w} height="70" fill="url(#destHero)" />
      <circle cx="96" cy="20" r="6" fill="#ffffff" opacity="0.7" />
      <g>
        <rect x="14" y="38" width="26" height="72" rx="3" fill={palette.hero} opacity="0.9" stroke="#ffffff" strokeWidth="1.5" />
        <rect x="47" y="48" width="26" height="72" rx="3" fill={palette.accent} opacity="0.95" stroke="#ffffff" strokeWidth="1.5" />
        <rect x="80" y="40" width="26" height="72" rx="3" fill={palette.hero} opacity="0.7" stroke="#ffffff" strokeWidth="1.5" />
      </g>
      <rect x="18" y="128" width="84" height="8" rx="2" fill="#111827" />
      <rect x="18" y="142" width="54" height="4" rx="2" fill="#111827" opacity="0.35" />
    </svg>
  );
}

function PolaroidsPoster({ palette }) {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="mini-svg" preserveAspectRatio="xMidYMid slice">
      <rect width={VB.w} height={VB.h} fill={palette.bg} />
      <rect x="30" y="24" width="60" height="72" rx="2" fill={palette.hero} opacity="0.85" />
      <g>
        {polaroid(14, 38, palette.accent, -12)}
        {polaroid(88, 30, palette.hero, 10)}
        {polaroid(18, 82, palette.hero, 6)}
        {polaroid(84, 80, palette.accent, -8)}
      </g>
      <rect x="20" y="120" width="70" height="7" rx="2" fill="#111827" />
      <rect x="20" y="132" width="40" height="4" rx="2" fill="#111827" opacity="0.35" />
    </svg>
  );
}

function polaroid(x, y, fill, rot) {
  return (
    <g transform={`rotate(${rot} ${x + 10} ${y + 12})`}>
      <rect x={x} y={y} width="20" height="24" rx="1" fill="#ffffff" stroke="#e5e7eb" />
      <rect x={x + 2} y={y + 2} width="16" height="16" fill={fill} opacity="0.85" />
    </g>
  );
}

function HeritagePoster({ palette }) {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="mini-svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="heritageHero" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.bg} />
          <stop offset="1" stopColor={palette.hero} />
        </linearGradient>
      </defs>
      <rect width={VB.w} height={VB.h} fill="url(#heritageHero)" />
      <rect x="10" y="10" width={VB.w - 20} height={VB.h - 20} rx="2" fill="none" stroke={palette.accent} strokeWidth="1" />
      <rect x="13" y="13" width={VB.w - 26} height={VB.h - 26} rx="1" fill="none" stroke={palette.accent} strokeWidth="0.5" opacity="0.7" />
      <text
        x={VB.w / 2}
        y="78"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="44"
        fontStyle="italic"
        fill={palette.accent}
        opacity="0.95"
      >Aa</text>
      <path d="M32 92 q28 -6 56 0" stroke={palette.accent} strokeWidth="1.2" fill="none" opacity="0.8" />
      <rect x="28" y="120" width="64" height="5" rx="1.5" fill="#ffffff" opacity="0.95" />
      <rect x="38" y="130" width="44" height="3" rx="1.5" fill="#ffffff" opacity="0.65" />
    </svg>
  );
}

function BrushPoster({ palette }) {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="mini-svg" preserveAspectRatio="xMidYMid slice">
      <rect width={VB.w} height={VB.h} fill={palette.bg} />
      <rect width={VB.w} height="86" fill={palette.hero} />
      <path
        d="M8 50 q30 -28 60 -8 t48 -8"
        stroke="#ffffff"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        opacity="0.92"
      />
      <path d="M16 72 q40 8 88 0" stroke={palette.accent} strokeWidth="2" fill="none" opacity="0.8" />
      <g>
        <rect x="14" y="96" width="42" height="22" rx="2" fill="#f3f4f6" />
        <rect x="64" y="96" width="42" height="22" rx="2" fill="#f3f4f6" />
        <rect x="14" y="122" width="92" height="18" rx="2" fill="#f3f4f6" />
      </g>
      <g fill="#9ca3af">
        <rect x="18" y="102" width="24" height="3" rx="1" />
        <rect x="18" y="108" width="14" height="2" rx="1" />
        <rect x="68" y="102" width="24" height="3" rx="1" />
        <rect x="68" y="108" width="14" height="2" rx="1" />
        <rect x="18" y="128" width="60" height="3" rx="1" />
      </g>
    </svg>
  );
}

function EditorialPoster({ palette }) {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="mini-svg" preserveAspectRatio="xMidYMid slice">
      <rect width={VB.w} height={VB.h} fill={palette.bg} />
      <rect width="60" height={VB.h} fill={palette.hero} opacity="0.9" />
      <text
        x="30"
        y="96"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="52"
        fontStyle="italic"
        fill="#ffffff"
        opacity="0.95"
      >R</text>
      <g transform="translate(66 28)">
        <rect width="44" height="5" rx="1.5" fill="#111827" />
        <rect y="10" width="36" height="3" rx="1.5" fill="#111827" opacity="0.5" />
        <rect y="22" width="44" height="54" rx="2" fill={palette.accent} opacity="0.85" />
        <rect y="82" width="40" height="3" rx="1.5" fill="#111827" opacity="0.5" />
        <rect y="90" width="28" height="3" rx="1.5" fill="#111827" opacity="0.3" />
      </g>
    </svg>
  );
}

function DefaultPoster({ palette }) {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="mini-svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="defHero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.hero} />
          <stop offset="1" stopColor={palette.accent} />
        </linearGradient>
      </defs>
      <rect width={VB.w} height={VB.h} fill={palette.bg} />
      <rect width={VB.w} height="92" fill="url(#defHero)" />
      <rect x="14" y="104" width="72" height="7" rx="2" fill="#111827" />
      <rect x="14" y="116" width="50" height="4" rx="2" fill="#111827" opacity="0.35" />
      <g fill="#e5e7eb">
        <rect x="14" y="130" width="18" height="10" rx="2" />
        <rect x="36" y="130" width="18" height="10" rx="2" />
        <rect x="58" y="130" width="18" height="10" rx="2" />
      </g>
    </svg>
  );
}
