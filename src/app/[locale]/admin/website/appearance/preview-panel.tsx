"use client";

import { RefObject } from "react";
import { Monitor, Tablet, Smartphone, ExternalLink } from "lucide-react";
import type { PageKey } from "./actions";

const PAGES: { key: PageKey | "OVERVIEW"; label: string; path: string }[] = [
  { key: "OVERVIEW", label: "Genel Bakış", path: "" },
  { key: "HOME", label: "Ana Sayfa", path: "" },
  { key: "COURSES", label: "Kurslar", path: "/courses" },
  { key: "LIVE_TRAINING", label: "Canlı Eğitim", path: "/live" },
  { key: "PRODUCTS", label: "Ürünler", path: "/products" },
  { key: "ABOUT", label: "Hakkımda", path: "/about" },
  { key: "LOGIN", label: "Giriş", path: "/login" },
];

const VIEWPORT_WIDTHS: Record<string, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

interface Props {
  locale: string;
  selectedPage: PageKey | "OVERVIEW";
  viewport: "desktop" | "tablet" | "mobile";
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onPageChange: (p: PageKey | "OVERVIEW") => void;
  onViewportChange: (v: "desktop" | "tablet" | "mobile") => void;
  onIframeLoad: () => void;
}

export function PreviewPanel({
  locale,
  selectedPage,
  viewport,
  iframeRef,
  onPageChange,
  onViewportChange,
  onIframeLoad,
}: Props) {
  const pageDef = PAGES.find((p) => p.key === selectedPage);
  const previewUrl =
    selectedPage === "OVERVIEW" ? null : `/${locale}${pageDef?.path ?? ""}?__preview__=1`;

  return (
    <div className="flex flex-col h-full">
      {/* Preview toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface shrink-0 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {PAGES.map((page) => (
            <button
              key={page.key}
              onClick={() => onPageChange(page.key as PageKey | "OVERVIEW")}
              className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                selectedPage === page.key
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {page.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {(["desktop", "tablet", "mobile"] as const).map((vp) => {
            const Icon = vp === "desktop" ? Monitor : vp === "tablet" ? Tablet : Smartphone;
            return (
              <button
                key={vp}
                onClick={() => onViewportChange(vp)}
                className={`rounded p-1.5 transition-colors ${
                  viewport === vp
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={vp}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground p-1.5 rounded transition-colors"
              title="Yeni sekmede aç"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-muted/40 flex items-start justify-center p-4">
        {selectedPage === "OVERVIEW" ? (
          <div className="w-full max-w-2xl space-y-2">
            <p className="text-xs text-muted-foreground text-center mb-4">
              Önizlemek istediğin sayfayı üstten seç.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PAGES.filter((p) => p.key !== "OVERVIEW").map((page) => (
                <button
                  key={page.key}
                  onClick={() => onPageChange(page.key as PageKey)}
                  className="group relative rounded-lg overflow-hidden border border-border bg-background hover:border-primary transition-colors text-left"
                  style={{ aspectRatio: "16/10" }}
                >
                  <iframe
                    src={`/${locale}${page.path}?__preview__=1`}
                    className="w-full h-full pointer-events-none"
                    style={{
                      transform: "scale(0.3)",
                      transformOrigin: "0 0",
                      width: "333%",
                      height: "333%",
                    }}
                    title={page.label}
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                    <p className="text-white text-[11px] font-semibold">{page.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="bg-white shadow-xl rounded overflow-hidden transition-all duration-300"
            style={{
              width: VIEWPORT_WIDTHS[viewport],
              maxWidth: "100%",
              height: "calc(100vh - 160px)",
              minHeight: "400px",
            }}
          >
            {previewUrl && (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-0"
                title="Site Önizlemesi"
                onLoad={onIframeLoad}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
