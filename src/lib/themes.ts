export type ThemeId = "signature" | "academy" | "editorial";

export interface ThemeConfig {
  id: ThemeId;
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  colorPrimary: string;
  colorPrimaryForeground: string;
  colorAccent: string;
  colorBackground: string;
  colorSurface: string;
  colorForeground: string;
  colorMuted: string;
  colorMutedForeground: string;
  colorBorder: string;
  colorSuccess: string;
  colorWarning: string;
  colorDanger: string;
  colorDarkBg: string;
  colorDarkSurface: string;
  radiusPreset: "none" | "sm" | "md" | "lg" | "xl";
  // Admin preview swatches — bg, accent, text
  swatches: [string, string, string];
}

export const THEME_CONFIGS: Record<ThemeId, ThemeConfig> = {
  signature: {
    id: "signature",
    nameTr: "Ferhat Signature",
    nameEn: "Ferhat Signature",
    descriptionTr: "Koyu, editoryal ve güçlü. Kişisel marka öne çıkar.",
    descriptionEn: "Dark, editorial and bold. Personal brand takes center stage.",
    colorPrimary: "#f97316",
    colorPrimaryForeground: "#ffffff",
    colorAccent: "#f97316",
    colorBackground: "#0f0e0d",
    colorSurface: "#1c1a18",
    colorForeground: "#f2ede5",
    colorMuted: "#252320",
    colorMutedForeground: "#8c8580",
    colorBorder: "#2e2c29",
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorDanger: "#ef4444",
    colorDarkBg: "#050505",
    colorDarkSurface: "#0f0e0d",
    radiusPreset: "none",
    swatches: ["#0f0e0d", "#f97316", "#f2ede5"],
  },
  academy: {
    id: "academy",
    nameTr: "Modern Akademi",
    nameEn: "Modern Academy",
    descriptionTr: "Temiz, yapılandırılmış ve okunabilir. Güvenilir eğitim platformu.",
    descriptionEn: "Clean, structured and readable. Credible education platform.",
    colorPrimary: "#0f4c81",
    colorPrimaryForeground: "#ffffff",
    colorAccent: "#1a6fa8",
    colorBackground: "#faf9f6",
    colorSurface: "#ffffff",
    colorForeground: "#1a1a2e",
    colorMuted: "#f0ede6",
    colorMutedForeground: "#6b6b7a",
    colorBorder: "#dddbd4",
    colorSuccess: "#1e7a3e",
    colorWarning: "#d97706",
    colorDanger: "#c0392b",
    colorDarkBg: "#0f1a2e",
    colorDarkSurface: "#162033",
    radiusPreset: "md",
    swatches: ["#faf9f6", "#0f4c81", "#1a1a2e"],
  },
  editorial: {
    id: "editorial",
    nameTr: "Creator Editorial",
    nameEn: "Creator Editorial",
    descriptionTr: "Krem zemin, cesur tipografi, medya enerjisi.",
    descriptionEn: "Cream base, bold typography, media energy.",
    colorPrimary: "#c8351f",
    colorPrimaryForeground: "#ffffff",
    colorAccent: "#c8351f",
    colorBackground: "#f7f3ed",
    colorSurface: "#ffffff",
    colorForeground: "#1a1714",
    colorMuted: "#ede8e1",
    colorMutedForeground: "#7a7068",
    colorBorder: "#d6d0c8",
    colorSuccess: "#2d7d41",
    colorWarning: "#b45309",
    colorDanger: "#b91c1c",
    colorDarkBg: "#1a1714",
    colorDarkSurface: "#2a241f",
    radiusPreset: "none",
    swatches: ["#f7f3ed", "#c8351f", "#1a1714"],
  },
};

export const DEFAULT_THEME_ID: ThemeId = "signature";
