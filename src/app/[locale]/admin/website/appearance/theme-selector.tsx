"use client";

import { useTransition } from "react";
import { THEME_CONFIGS, type ThemeId } from "@/lib/themes";
import { activateTheme } from "./actions";
import { CheckCircle2 } from "lucide-react";

const THEME_ORDER: ThemeId[] = ["signature", "academy", "editorial"];

function ThemeMiniPreview({ theme }: { theme: (typeof THEME_CONFIGS)[ThemeId] }) {
  const bg = theme.colorBackground;
  const surface = theme.colorSurface;
  const fg = theme.colorForeground;
  const primary = theme.colorPrimary;
  const muted = theme.colorMuted;
  const mutedFg = theme.colorMutedForeground;
  const border = theme.colorBorder;
  const darkBg = theme.colorDarkBg;
  const r = theme.radiusPreset === "none" ? "0px" : theme.radiusPreset === "sm" ? "4px" : theme.radiusPreset === "md" ? "8px" : theme.radiusPreset === "lg" ? "12px" : "16px";

  return (
    <div
      style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: r, overflow: "hidden", aspectRatio: "16/10" }}
      className="w-full"
    >
      {/* Mini navbar */}
      <div style={{ backgroundColor: surface, borderBottom: `1px solid ${border}`, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: primary, fontWeight: 800, fontSize: 9, letterSpacing: theme.id === "signature" ? "-0.04em" : theme.id === "editorial" ? "-0.03em" : "-0.01em" }}>
          Ferhat Academy
        </span>
        <div style={{ display: "flex", gap: 5 }}>
          <span style={{ color: mutedFg, fontSize: 7 }}>Kurslar</span>
          <span style={{ color: mutedFg, fontSize: 7 }}>Canlı</span>
          <span style={{ backgroundColor: primary, color: theme.colorPrimaryForeground, fontSize: 7, borderRadius: r, padding: "1px 5px", fontWeight: 700 }}>Kayıt Ol</span>
        </div>
      </div>

      {/* Mini hero */}
      <div style={{ backgroundColor: darkBg, padding: "10px 10px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ backgroundColor: primary, height: 3, width: "45%", borderRadius: r }} />
        <div style={{ backgroundColor: "rgba(255,255,255,0.7)", height: 6, width: "70%", borderRadius: r }} />
        <div style={{ backgroundColor: "rgba(255,255,255,0.3)", height: 4, width: "55%", borderRadius: r }} />
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          <div style={{ backgroundColor: primary, height: 12, width: 36, borderRadius: r }} />
          <div style={{ backgroundColor: "rgba(255,255,255,0.15)", height: 12, width: 36, borderRadius: r, border: "1px solid rgba(255,255,255,0.2)" }} />
        </div>
      </div>

      {/* Mini cards row */}
      <div style={{ padding: "8px 10px", display: "flex", gap: 5 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, backgroundColor: surface, border: `1px solid ${border}`, borderRadius: r, overflow: "hidden" }}>
            <div style={{ backgroundColor: muted, height: 20 }} />
            <div style={{ padding: "4px 5px" }}>
              <div style={{ backgroundColor: fg, height: 4, width: "80%", borderRadius: 2, opacity: 0.7, marginBottom: 3 }} />
              <div style={{ backgroundColor: mutedFg, height: 3, width: "60%", borderRadius: 2, opacity: 0.4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  activeThemeId: string;
}

export function ThemeSelector({ activeThemeId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleActivate(themeId: ThemeId) {
    if (themeId === activeThemeId || isPending) return;
    startTransition(async () => {
      await activateTheme(themeId);
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {THEME_ORDER.map((themeId) => {
        const theme = THEME_CONFIGS[themeId];
        const isActive = activeThemeId === themeId;
        return (
          <div
            key={themeId}
            className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              isActive
                ? "border-primary shadow-lg shadow-primary/15"
                : "border-border hover:border-primary/40"
            } ${isPending ? "opacity-60 pointer-events-none" : ""}`}
          >
            {/* Active badge */}
            {isActive && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white shadow">
                <CheckCircle2 className="h-3 w-3" />
                Aktif
              </div>
            )}

            {/* Preview */}
            <div className="p-2 bg-muted/30">
              <ThemeMiniPreview theme={theme} />
            </div>

            {/* Info + actions */}
            <div className="p-3 bg-surface border-t border-border space-y-2">
              <div>
                <p className="font-bold text-foreground text-sm">{theme.nameTr}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{theme.descriptionTr}</p>
              </div>

              {/* Color swatches */}
              <div className="flex gap-1.5">
                <span
                  className="h-4 w-4 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: theme.colorPrimary }}
                  title="Primary"
                />
                <span
                  className="h-4 w-4 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: theme.colorBackground }}
                  title="Background"
                />
                <span
                  className="h-4 w-4 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: theme.colorForeground }}
                  title="Foreground"
                />
                <span className="text-xs text-muted-foreground ml-1 self-center">
                  {theme.radiusPreset === "none" ? "Keskin" : theme.radiusPreset === "md" ? "Yuvarlak" : "Çok Yuvarlak"}
                </span>
              </div>

              {isActive ? (
                <div className="text-xs font-semibold text-primary">Şu an aktif tema</div>
              ) : (
                <button
                  onClick={() => handleActivate(themeId)}
                  disabled={isPending}
                  className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Aktive Et
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
