export const LightColors = {
  primary: '#9333ea',
  primaryLight: '#a855f7',
  primaryDark: '#7e22ce',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLight: '#FAFAFA',
  text: '#1c1c1e',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  overlay: '#00000010',
  deleteBg: '#fef2f2',
  inputBg: '#FAFAFA',
  cardShadow: '#000',
  ideaColors: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#ede9fe'],
};

export const DarkColors = {
  primary: '#a855f7',
  primaryLight: '#c084fc',
  primaryDark: '#9333ea',
  background: '#0f0f0f',
  surface: '#1a1a2e',
  surfaceLight: '#222240',
  text: '#f1f1f1',
  textSecondary: '#9ca3af',
  border: '#2d2d4a',
  borderLight: '#1f1f38',
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  overlay: '#00000040',
  deleteBg: '#3b1a1a',
  inputBg: '#1a1a2e',
  cardShadow: '#000',
  ideaColors: ['#2d1b4e', '#1a1a3e', '#2d2d4a', '#1b2d4e', '#1b3e2d'],
};

export type AppColors = typeof LightColors;

export function getColors(isDark: boolean): AppColors {
  return isDark ? DarkColors : LightColors;
}
