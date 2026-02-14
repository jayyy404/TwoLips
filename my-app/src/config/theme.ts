import { StyleSheet } from "react-native";

// Glassmorphism Palette
export const COLORS = {
  // Gradient
  primaryPink: "#FFD1DC",
  primaryBlue: "#B3E5FC",

  // Glass surfaces
  glassSurface: "rgba(255, 255, 255, 0.35)",
  glassBorder: "rgba(255, 255, 255, 0.6)",
  glassShadow: "rgba(31, 38, 135, 0.1)",

  // Text
  text: "#5D5D5D",
  textSecondary: "#8E8E93",
  textWhite: "#FFFFFF",
  textWhiteSoft: "rgba(255, 255, 255, 0.9)",

  // Core
  primary: "#FFD1DC",
  primaryLight: "rgba(255, 209, 220, 0.5)",
  primaryDark: "#E8B4C0",
  background: "#F5F5F0",
  surface: "#FFFFFF",
  black: "#000000",
  white: "#FFFFFF",

  // Overlays
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.25)",
  shadow: "rgba(0, 0, 0, 0.08)",

  // Accents
  error: "#D32F2F",
  pinkGlow: "rgba(255, 209, 220, 0.6)",
  blueGlow: "rgba(179, 229, 252, 0.5)",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 32,
  title: 13,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 30,
  round: 9999,
};

export const commonStyles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  screenBackground: {
    flex: 1,
  },
  glassPanel: {
    backgroundColor: COLORS.glassSurface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
});
