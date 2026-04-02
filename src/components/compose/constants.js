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

export const TEMPLATE_VISUALS = {
  'explorer-minimal': {
    icon: MdExplore,
    gradient: 'linear-gradient(135deg, #14b8a6, #fb923c)',
  },
  'lifestyle-editorial': {
    icon: MdFavorite,
    gradient: 'linear-gradient(135deg, #fb7185, #fcd34d)',
  },
  'bold-adventure': {
    icon: MdTerrain,
    gradient: 'linear-gradient(135deg, #22c55e, #facc15)',
  },
  'heritage-cinematic': {
    icon: MdAccountBalance,
    gradient: 'linear-gradient(135deg, #d97706, #a8a29e)',
  },
  'brush-script-escape': {
    icon: MdBrush,
    gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
  },
};

export const DEFAULT_TEMPLATE_VISUAL = {
  icon: MdBrush,
  gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
};

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
