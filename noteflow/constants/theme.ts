export const LightColors = {
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',
  background: '#f5f0ff',
  surface: 'rgba(255,255,255,0.75)',
  surfaceLight: '#ede6ff',
  text: '#1a1a2e',
  textSecondary: '#6b6090',
  textTertiary: '#9a90b8',
  border: 'rgba(124,58,237,0.15)',
  borderLight: 'rgba(124,58,237,0.08)',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#6366f1',
  overlay: 'rgba(124,58,237,0.06)',
  deleteBg: 'rgba(239,68,68,0.08)',
  inputBg: 'rgba(255,255,255,0.6)',
  cardShadow: '#7c3aed',
  ideaColors: ['rgba(124,58,237,0.08)', 'rgba(167,139,250,0.10)', 'rgba(196,181,253,0.12)', 'rgba(221,214,254,0.15)', 'rgba(237,233,254,0.18)'],
};

export const DarkColors = {
  primary: '#a78bfa',
  primaryLight: '#c4b5fd',
  primaryDark: '#7c3aed',
  background: '#0d0b1a',
  surface: 'rgba(26,22,50,0.8)',
  surfaceLight: '#1a1638',
  text: '#e8e4f5',
  textSecondary: '#9a90b8',
  textTertiary: '#6b6090',
  border: 'rgba(167,139,250,0.15)',
  borderLight: 'rgba(167,139,250,0.08)',
  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#818cf8',
  overlay: 'rgba(167,139,250,0.06)',
  deleteBg: 'rgba(248,113,113,0.1)',
  inputBg: 'rgba(26,22,50,0.6)',
  cardShadow: '#a78bfa',
  ideaColors: ['rgba(167,139,250,0.08)', 'rgba(196,181,253,0.06)', 'rgba(124,58,237,0.10)', 'rgba(167,139,250,0.12)', 'rgba(196,181,253,0.08)'],
};

export type AppColors = typeof LightColors;

export function getColors(isDark: boolean): AppColors {
  return isDark ? DarkColors : LightColors;
}
