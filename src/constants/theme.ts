export const LightTheme = {
  isDark: false,
  colors: {
    background: '#FBFBF9', // Notion signature warm off-white canvas
    surface: '#FFFFFF',
    surfaceSubtle: '#F7F6F3',
    surfaceHover: '#EFEFEA',
    
    // Borders
    border: '#E8E8E3',
    borderSubtle: '#F0F0EB',
    
    // Typography
    textPrimary: '#2F3437', // Notion dark graphite
    textSecondary: '#787774', // Notion muted grey
    textMuted: '#9B9A97',
    
    // Brand Accents (derived from the cat logo)
    brandOrange: '#EB5E28', // Cat body warm terracotta orange
    brandOrangeLight: '#FFF1EB',
    brandYellow: '#FED766', // Logo pastel yellow canvas
    brandYellowLight: '#FFF9E6',
    
    // Utility
    danger: '#E03E3E',
    dangerLight: '#FDE8E8',
    success: '#0F7B6C',
    successLight: '#E8F5F3',
    
    // Badges & Pills
    pillActiveBg: '#2F3437',
    pillActiveText: '#FFFFFF',
    pillInactiveBg: '#F0F0EB',
    pillInactiveText: '#5A5A58',
    
    // Lock screen
    lockBg: '#FBFBF9',
    lockGlow: 'rgba(235, 94, 40, 0.12)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
};

export const DarkTheme = {
  isDark: true,
  colors: {
    background: '#191919', // Notion signature dark mode
    surface: '#202020',
    surfaceSubtle: '#282828',
    surfaceHover: '#303030',
    
    // Borders
    border: '#2F2F2F',
    borderSubtle: '#252525',
    
    // Typography
    textPrimary: '#EAEAEA',
    textSecondary: '#9B9B9B',
    textMuted: '#666666',
    
    // Brand Accents
    brandOrange: '#FF7E47',
    brandOrangeLight: '#331B12',
    brandYellow: '#FFE382',
    brandYellowLight: '#2D2817',
    
    // Utility
    danger: '#EB5757',
    dangerLight: '#3D1C1C',
    success: '#27AE60',
    successLight: '#173623',
    
    // Badges & Pills
    pillActiveBg: '#EAEAEA',
    pillActiveText: '#191919',
    pillInactiveBg: '#2A2A2A',
    pillInactiveText: '#A0A0A0',
    
    // Lock screen
    lockBg: '#191919',
    lockGlow: 'rgba(255, 126, 71, 0.15)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
};

export type AppTheme = typeof LightTheme;
