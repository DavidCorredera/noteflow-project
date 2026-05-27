import { Platform } from 'react-native';

const isAndroid = Platform.OS === 'android';

const PRIMARY = '#3b82f6';

export const LightColors = {
  primary: PRIMARY,
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  background: '#f1f5f9',
  surface: isAndroid ? '#ffffff' : 'rgba(255,255,255,0.85)',
  surfaceLight: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  border: 'rgba(59,130,246,0.18)',
  borderLight: 'rgba(59,130,246,0.10)',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: PRIMARY,
  overlay: 'rgba(59,130,246,0.04)',
  deleteBg: 'rgba(239,68,68,0.08)',
  inputBg: isAndroid ? '#ffffff' : 'rgba(255,255,255,0.6)',
  cardShadow: PRIMARY,
  ideaColors: ['rgba(59,130,246,0.06)', 'rgba(96,165,250,0.08)', 'rgba(59,130,246,0.10)', 'rgba(96,165,250,0.06)', 'rgba(37,99,235,0.08)'],
};

export const DarkColors = {
  primary: PRIMARY,
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  background: '#0d0d14',
  surface: isAndroid ? '#252540' : 'rgba(37,37,64,0.9)',
  surfaceLight: '#2e2e4a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  border: 'rgba(59,130,246,0.12)',
  borderLight: 'rgba(59,130,246,0.06)',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#eab308',
  info: PRIMARY,
  overlay: 'rgba(59,130,246,0.05)',
  deleteBg: 'rgba(239,68,68,0.1)',
  inputBg: isAndroid ? '#1e1e2e' : 'rgba(30,30,46,0.6)',
  cardShadow: '#000000',
  ideaColors: ['rgba(59,130,246,0.08)', 'rgba(96,165,250,0.06)', 'rgba(59,130,246,0.12)', 'rgba(96,165,250,0.08)', 'rgba(37,99,235,0.06)'],
};

export type AppColors = typeof LightColors;

export function getColors(isDark: boolean): AppColors {
  return isDark ? DarkColors : LightColors;
}
