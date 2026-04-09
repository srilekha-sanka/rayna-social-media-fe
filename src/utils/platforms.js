import {
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
  FaTiktok,
  FaYoutube,
  FaLinkedinIn,
  FaPinterestP,
  FaSnapchat,
  FaThreads,
  FaWhatsapp,
  FaTelegram,
  FaRedditAlien,
  FaBluesky,
} from 'react-icons/fa6';

export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: '#E4405F' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebookF, color: '#1877F2' },
  { id: 'x', name: 'X (Twitter)', icon: FaXTwitter, color: '#000000' },
  { id: 'tiktok', name: 'TikTok', icon: FaTiktok, color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: '#FF0000' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedinIn, color: '#0A66C2' },
  { id: 'pinterest', name: 'Pinterest', icon: FaPinterestP, color: '#BD081C' },
  { id: 'snapchat', name: 'Snapchat', icon: FaSnapchat, color: '#FFFC00' },
  { id: 'threads', name: 'Threads', icon: FaThreads, color: '#000000' },
  { id: 'bluesky', name: 'Bluesky', icon: FaBluesky, color: '#0085FF' },
  { id: 'whatsapp', name: 'WhatsApp', icon: FaWhatsapp, color: '#25D366' },
  { id: 'telegram', name: 'Telegram', icon: FaTelegram, color: '#0088cc' },
  { id: 'reddit', name: 'Reddit', icon: FaRedditAlien, color: '#FF4500' },
];

// Platforms that support OAuth connection via PostForMe
export const CONNECTABLE_PLATFORMS = [
  'instagram', 'facebook', 'x', 'linkedin', 'tiktok',
  'youtube', 'pinterest', 'threads', 'bluesky',
];

export function getPlatformConfig(platformId) {
  return PLATFORMS.find((p) => p.id === platformId) || null;
}

export const CONTENT_TYPES = [
  {
    id: 'image-overlay',
    title: 'Image + Text Overlay',
    description: 'Product image with text overlay, AI-generated hashtags & captions. Carousel support.',
    tag: 'No AI Video',
  },
  {
    id: 'image-to-video',
    title: 'Image to Video',
    description: 'Transform product images into engaging videos with audio layers.',
    tag: 'AI Video',
    tools: ['Kling', 'Seedance'],
  },
  {
    id: 'cinematic-video',
    title: 'Cinematic Video',
    description: 'End-to-end cinematic video creation with AI-powered editing.',
    tag: 'AI Pro',
    tools: ['Veo3', 'Kling'],
  },
  {
    id: 'vlog-style',
    title: 'Vlog / Human Style',
    description: 'Amateur human vlog-type content for authentic, relatable posts.',
    tag: 'Authentic',
  },
  {
    id: 'content-remix',
    title: 'Content Remix',
    description: 'Label existing content and create new variations using AI.',
    tag: 'Remix',
  },
];
