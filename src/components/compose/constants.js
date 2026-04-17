import {
  MdExplore,
  MdFavorite,
  MdTerrain,
  MdAccountBalance,
  MdBrush,
} from 'react-icons/md';

// ─── Content Sources ─────────────────────────────────────

export const CONTENT_SOURCE = {
  PRODUCT: 'PRODUCT',
  STOCK: 'STOCK',
  AI_GENERATED: 'AI_GENERATED',
};

export const CONTENT_SOURCE_LABELS = {
  [CONTENT_SOURCE.PRODUCT]: 'Product Data',
  [CONTENT_SOURCE.STOCK]: 'Stock Media',
  [CONTENT_SOURCE.AI_GENERATED]: 'AI Generate',
};

// ─── Modal Steps ─────────────────────────────────────────

export const STEP = {
  SOURCE_SELECT: 'source_select',
  STOCK_BROWSER: 'stock_browser',
  TEMPLATE_SELECT: 'template_select',
  GENERATING: 'generating',
};

// ─── Video Post Types ────────────────────────────────────

const VIDEO_POST_TYPES = new Set(['reel', 'cinematic_video']);

export function getMediaType(entry) {
  return VIDEO_POST_TYPES.has(entry.post_type) ? 'video' : 'image';
}

// ─── Entry Helpers ───────────────────────────────────────

export function getProductInfo(entry) {
  return {
    name: entry.product?.name || entry.product_name || null,
    price: entry.product?.price || entry.product_price || null,
    thumbnail: entry.product?.image_url || entry.product?.thumbnail_url || null,
    hasProduct: !!(entry.product_id || entry.product),
  };
}

export function extractPost(res) {
  return res.post || res.data?.post || res;
}

// ─── Template Card Visuals ───────────────────────────────

// Each template has a `layout` that drives a distinct mini-poster illustration
// (see MiniPoster in DesignTemplateCard.jsx). `palette` is {bg, hero, accent}
// consumed by those SVG compositions.

export const TEMPLATE_VISUALS = {
  'explorer-minimal': {
    icon: MdExplore,
    gradient: 'linear-gradient(135deg, #14b8a6, #fb923c)',
    layout: 'activities',
    palette: { bg: '#ffffff', hero: '#14b8a6', accent: '#fb923c' },
  },
  'lifestyle-editorial': {
    icon: MdFavorite,
    gradient: 'linear-gradient(135deg, #fb7185, #fcd34d)',
    layout: 'editorial',
    palette: { bg: '#ffffff', hero: '#fb7185', accent: '#fcd34d' },
  },
  'bold-adventure': {
    icon: MdTerrain,
    gradient: 'linear-gradient(135deg, #22c55e, #facc15)',
    layout: 'destinations',
    palette: { bg: '#22c55e', hero: '#16a34a', accent: '#facc15' },
  },
  'heritage-cinematic': {
    icon: MdAccountBalance,
    gradient: 'linear-gradient(135deg, #d97706, #a8a29e)',
    layout: 'heritage',
    palette: { bg: '#d97706', hero: '#a8a29e', accent: '#fde68a' },
  },
  'brush-script-escape': {
    icon: MdBrush,
    gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
    layout: 'brush',
    palette: { bg: '#ffffff', hero: '#f97316', accent: '#ef4444' },
  },
  // Broader slug coverage — matches what the backend likely sends
  'explore-activities': {
    icon: MdExplore,
    gradient: 'linear-gradient(135deg, #0ea5e9, #a7f3d0)',
    layout: 'activities',
    palette: { bg: '#ffffff', hero: '#0ea5e9', accent: '#f59e0b' },
  },
  'explore-destinations': {
    icon: MdExplore,
    gradient: 'linear-gradient(180deg, #60a5fa, #ffffff)',
    layout: 'destinations',
    palette: { bg: '#dbeafe', hero: '#3b82f6', accent: '#1e40af' },
  },
  'travel-destinations': {
    icon: MdTerrain,
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    layout: 'destinations',
    palette: { bg: '#ffffff', hero: '#8b5cf6', accent: '#ec4899' },
  },
  'summer-holiday': {
    icon: MdFavorite,
    gradient: 'linear-gradient(135deg, #fde68a, #fb923c)',
    layout: 'polaroids',
    palette: { bg: '#ffffff', hero: '#fb923c', accent: '#0ea5e9' },
  },
};

export const DEFAULT_TEMPLATE_VISUAL = {
  icon: MdBrush,
  gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
  layout: 'default',
  palette: { bg: '#ffffff', hero: '#8b5cf6', accent: '#6366f1' },
};

// Resolve a visual for a template: slug → name-keyword → default.
// Keyword match makes the card look right even when the backend ships a new
// slug we haven't mapped yet (e.g. "beach-destinations" → destinations layout).
export function resolveTemplateVisual(template) {
  if (!template) return DEFAULT_TEMPLATE_VISUAL;
  const direct = TEMPLATE_VISUALS[template.slug];
  if (direct) return direct;

  const name = (template.name || '').toLowerCase();
  if (/activit/.test(name)) return TEMPLATE_VISUALS['explore-activities'];
  if (/destinat/.test(name)) return TEMPLATE_VISUALS['travel-destinations'];
  if (/holiday|summer|polaroid|scatter/.test(name)) return TEMPLATE_VISUALS['summer-holiday'];
  if (/heritage|cinema|cultural|calligraphy/.test(name)) return TEMPLATE_VISUALS['heritage-cinematic'];
  if (/brush|script|bold/.test(name)) return TEMPLATE_VISUALS['brush-script-escape'];
  if (/editorial|lifestyle/.test(name)) return TEMPLATE_VISUALS['lifestyle-editorial'];
  return DEFAULT_TEMPLATE_VISUAL;
}

// Admin-maintained reference media. Key = template slug, value = URL (remote
// or /public path). Drop real post screenshots / gifs here so admins can see
// exactly what each template produces.
export const TEMPLATE_EXAMPLES = {
  'explore-activities': '/assets/gif/explore_activities.gif',
  'explore-destinations': '/assets/gif/explore_destinations.gif',
  'travel-destinations': '/assets/gif/travel_destinations.gif',
  'itinerary': '/assets/gif/itinerary.gif',
  'itineraries': '/assets/gif/itinerary.gif',
  'summer-holiday': '/assets/gif/summer_holiday.gif',
};

// Map name-keywords → example media, so backend slug variants still resolve.
// Order matters — more specific matchers come first (activities before
// destinations, travel before generic explore, etc.).
const EXAMPLE_NAME_MATCHERS = [
  { test: /activit/i, url: '/assets/gif/explore_activities.gif' },
  { test: /itinerar|day[\s-]?wise|schedule/i, url: '/assets/gif/itinerary.gif' },
  { test: /summer|holiday|vacation|getaway/i, url: '/assets/gif/summer_holiday.gif' },
  { test: /travel/i, url: '/assets/gif/travel_destinations.gif' },
  { test: /destinat|explore/i, url: '/assets/gif/explore_destinations.gif' },
];

export function getTemplateExample(template) {
  if (!template) return null;
  if (template.example_url) return template.example_url;
  if (template.thumbnail_url) return template.thumbnail_url;

  const direct = TEMPLATE_EXAMPLES[template.slug];
  if (direct) return direct;

  const name = template.name || '';
  const match = EXAMPLE_NAME_MATCHERS.find((m) => m.test.test(name));
  return match ? match.url : null;
}

// ─── Generating State Copy ───────────────────────────────

export const GENERATING_TIPS = {
  [CONTENT_SOURCE.PRODUCT]:
    'The AI is adding text, branding & layout to your product image.',
  [CONTENT_SOURCE.STOCK]:
    'The AI is applying design, text & branding to your selected images.',
  [CONTENT_SOURCE.AI_GENERATED]:
    'The AI is creating a fully designed poster from your brief.',
};

// ─── Template Picker Copy (keyed by content source) ──────

export const TEMPLATE_PICKER_COPY = {
  [CONTENT_SOURCE.PRODUCT]: {
    heading: 'Design Product Post',
    subtitle: 'AI will redesign your product image into a marketing poster',
    placeholder: 'e.g. "Add price in bold, use sunset tones, include Rayna logo top-right"',
  },
  [CONTENT_SOURCE.STOCK]: {
    heading: 'Design Stock Post',
    subtitle: 'AI will redesign your image into a marketing poster',
    placeholder: 'e.g. "Use sunset tones, add beach vibes, include CTA button"',
  },
  [CONTENT_SOURCE.AI_GENERATED]: {
    heading: 'AI Generate',
    subtitle: 'AI will redesign your image into a marketing poster',
    placeholder: 'e.g. "Use sunset tones, add beach vibes"',
  },
};
