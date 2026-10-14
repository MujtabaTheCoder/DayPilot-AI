
export const Palette = {
  // Brand Aurora Accents
  auroraCyan: '#00F2FE',
  auroraBlue: '#4FACFE',
  auroraPurple: '#8B5CF6',
  auroraIndigo: '#6366F1',
  auroraEmerald: '#10B981',
  auroraAmber: '#F59E0B',
  auroraRose: '#F43F5E',
  auroraCoral: '#FF6B6B',

  // Dark Luxury Obsidian
  obsidianVoid: '#070A12',
  obsidianSurface: '#0E1526',
  obsidianElevated: '#17223B',
  obsidianOverlay: 'rgba(14, 21, 38, 0.85)',
  obsidianBorder: 'rgba(255, 255, 255, 0.08)',
  obsidianBorderLight: 'rgba(255, 255, 255, 0.15)',

  // Text
  textPrimaryDark: '#F8FAFC',
  textSecondaryDark: '#94A3B8',
  textMutedDark: '#64748B',

  // Light Mode counterparts (for system toggle)
  lightBackground: '#F8FAFC',
  lightSurface: '#FFFFFF',
  lightElevated: '#F1F5F9',
  lightBorder: 'rgba(0, 0, 0, 0.08)',
  textPrimaryLight: '#0F172A',
  textSecondaryLight: '#475569',
  textMutedLight: '#94A3B8',
} as const;

export const Colors = {
  dark: {
    background: Palette.obsidianVoid,
    surface: Palette.obsidianSurface,
    surfaceElevated: Palette.obsidianElevated,
    surfaceOverlay: Palette.obsidianOverlay,
    border: Palette.obsidianBorder,
    borderStrong: Palette.obsidianBorderLight,
    text: Palette.textPrimaryDark,
    textSecondary: Palette.textSecondaryDark,
    textMuted: Palette.textMutedDark,
    primary: Palette.auroraCyan,
    primaryGlow: 'rgba(0, 242, 254, 0.25)',
    secondary: Palette.auroraPurple,
    accent: Palette.auroraBlue,
    success: Palette.auroraEmerald,
    warning: Palette.auroraAmber,
    danger: Palette.auroraCoral,
    card: Palette.obsidianSurface,
    cardBorder: Palette.obsidianBorder,
    tabBarBackground: '#0B1120',
    tabBarActive: Palette.auroraCyan,
    tabBarInactive: '#64748B',
  },
  light: {
    background: Palette.lightBackground,
    surface: Palette.lightSurface,
    surfaceElevated: Palette.lightElevated,
    surfaceOverlay: 'rgba(255, 255, 255, 0.9)',
    border: Palette.lightBorder,
    borderStrong: 'rgba(0, 0, 0, 0.15)',
    text: Palette.textPrimaryLight,
    textSecondary: Palette.textSecondaryLight,
    textMuted: Palette.textMutedLight,
    primary: '#0284C7',
    primaryGlow: 'rgba(2, 132, 199, 0.15)',
    secondary: '#7C3AED',
    accent: '#2563EB',
    success: '#059669',
    warning: '#D97706',
    danger: '#E11D48',
    card: Palette.lightSurface,
    cardBorder: Palette.lightBorder,
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#0284C7',
    tabBarInactive: '#94A3B8',
  },
} as const;

export type ThemeColors = typeof Colors.dark;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
  giant: 40,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

export const Shadows = {
  glowPrimary: {
    shadowColor: Palette.auroraCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  glowPurple: {
    shadowColor: Palette.auroraPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
