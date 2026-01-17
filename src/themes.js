export const ACCENT_COLORS = [
  { id: 'indigo', name: 'Indigo', hex: '#6366F1', hover: '#4F46E5' },
  { id: 'rose', name: 'Rose', hex: '#F43F5E', hover: '#E11D48' },
  { id: 'emerald', name: 'Emerald', hex: '#10B981', hover: '#059669' },
  { id: 'amber', name: 'Amber', hex: '#F59E0B', hover: '#D97706' },
  { id: 'sky', name: 'Sky', hex: '#0EA5E9', hover: '#0284C7' },
  { id: 'violet', name: 'Violet', hex: '#8B5CF6', hover: '#7C3AED' },
  { id: 'neon', name: 'Neon', hex: '#E11D48', hover: '#BE123C' }, // Adding a neon pinkish red
];

export const THEME_PRESETS = [
  {
    id: 'cyberpunk',
    name: 'Neon Tokyo',
    backgroundId: 'City-Night.png',
    accentId: 'rose',
    overlay: true,
  },
  {
    id: 'zen',
    name: 'Zen Garden',
    backgroundId: 'Bonsai-Plant.png',
    accentId: 'emerald',
    overlay: true,
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    backgroundId: 'Fantasy - Sunset.png',
    accentId: 'amber',
    overlay: true,
  },
  {
    id: 'space',
    name: 'Deep Space',
    backgroundId: null, // Default gradient
    accentId: 'indigo',
    overlay: false,
  }
];
